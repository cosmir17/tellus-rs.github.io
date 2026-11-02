+++
title       = "Why tellus"
description = "What tellus offers, how it compares with other Rust actor frameworks, what carries over from Akka and Erlang, and when it is not the right choice."
weight      = 0
+++

tellus is an actor framework for Rust, built on Tokio. It is meant for applications which keep
state in many independent units, react to failures instead of hiding them, and grow from one
process to a cluster without changing their code. This page explains what tellus offers, how it
relates to other Rust actor frameworks and to Akka and Erlang, and when you should pick something
else.

## Guarantees you can build on

An actor in tellus is a state machine. Its `receive` is a synchronous function which takes the
state by value and returns the next one, so an actor never holds a lock and never awaits in the
middle of a message. See [Synchronous message handlers](@/docs/explanation/synchronous-handlers.md).

Death watch comes with an ordering guarantee. A watcher receives the terminated signal only after
every message the terminated actor delivered to it, so the signal proves that nothing more will
come. That answers "am I done?" without a timeout, see
[The death watch ordering guarantee](@/docs/explanation/death-watch-ordering.md).

Supervision restarts a failing actor with backoff or stops it, and stopping always goes from the
children to the parent. See
[Supervision and lifecycle](@/docs/explanation/supervision-and-lifecycle.md). A bounded mailbox
caps what an actor has to hold, and terminated signals still pass a full one, see
[Apply backpressure](@/docs/how-to/apply-backpressure.md).

## From one process to a cluster

With the `cluster` feature, an `ActorRef` is serializable, and `tell`, `ask` and `watch` work on an
actor on another node through the same API. The nodes gossip their membership without a leader,
detect failures and decide which nodes are gone, see
[Membership and downing](@/docs/explanation/membership-and-downing.md). A receptionist finds
actors by key across the cluster, and pub-sub is built on top of it. Nodes talk QUIC with mutual
TLS and find each other through DNS or the Kubernetes API.

With the `persistence` feature, an actor can be event-sourced: its events are durable before its
state changes, and its state is recovered by replaying them through the same code which handled
them live. See [Event sourcing](@/docs/explanation/event-sourcing.md).

## Documented and tested

Every guarantee on these pages is written down as a contract in the
[internals documentation](https://github.com/tellus-rs/tellus/tree/main/docs), and the integration
tests encode them. A
[demo cluster](https://github.com/tellus-rs/tellus/tree/main/tellus-cluster-demo) of five nodes
runs under continuous kills, departures and partitions, while a verifier checks after every fault
that the cluster has recovered. Benchmarks run on every pull request.

## Compared with other Rust actor frameworks

Compared with the widely used Rust actor frameworks, tellus is the one which combines supervision,
ordered death watch, a cluster with failure detection and downing, and event sourcing in one
toolkit, with each guarantee documented as a contract. Others offer things tellus does not, for
example more supervision strategies or async handlers. [Rust actor frameworks
compared](@/docs/explanation/comparison.md) goes through the details, with sources.

## Coming from Akka and Erlang

In this section, Akka includes Apache Pekko, which continues Akka's last open source version with
the same APIs. Much of tellus will look familiar. Actors form a tree under supervision, and a
failure restarts or stops an actor instead of propagating as an error. Messages are delivered at
most once, in order between two actors, and reliability belongs in the protocol. An actor handles
one message at a time, synchronously, as in Akka, and asynchronous work comes back as a message, as
with `pipeToSelf`. References are location transparent, a cluster decides which nodes are gone, as
Akka's Split Brain Resolver does, and event-sourced actors persist events before they change their
state.

Some things are deliberately different. The state is a value which `receive` takes and returns,
and an actor which changes its behavior keeps an enum in its state instead of switching to another
handler. Each actor has exactly one message type. Cluster sharding and the cluster singleton are
not there yet; both are on the roadmap.

Rust adds a few things. The compiler checks that whatever crosses from one actor to another is safe
to send, where the JVM relies on the convention of immutable messages. Without a garbage collector,
there are no collection pauses which a failure detector could mistake for a dead node. And a node
is a single native binary.

Erlang, on the other hand, can do things Rust cannot. It preempts a long-running process, while a
long `receive` in tellus occupies a Tokio worker thread until it returns. Erlang processes have
separate heaps, while tellus actors share one process: a panic is caught per actor, but an abort or
running out of memory takes the whole node down. And Erlang loads new code into a running system.

<div class="table-wrap">

| Akka/Pekko (Typed) | Erlang/OTP | tellus |
|---|---|---|
| `Behavior[T]` | process, `gen_server` | `Actor` with `receive` |
| `ActorRef[T]` | pid | `ActorRef<M>` |
| `tell` (`!`) | `Pid ! Message` | `tell` |
| `ask` | `gen_server:call` | `ask`, `context.reply_to` |
| `context.spawn` | `spawn_link` | `context.spawn` |
| `context.watch`, `Terminated` | `monitor`, `'DOWN'` | `context.watch`, `Incoming::Terminated` |
| `SupervisorStrategy.restartWithBackoff` | supervisor | `SupervisionStrategy::Restart(RestartPolicy)` |
| `pipeToSelf` | | `context.pipe_to_self` |
| timers | `erlang:send_after` | `type Timers = Timed`, `context.start_timer` |
| `Receptionist` | `pg` | `cluster::register`, `receptionist::lookup` |
| Distributed Publish Subscribe (`Topic`) | `pg` | `pubsub::subscribe`, `pubsub::publish` |
| Split Brain Resolver, keep majority | | downing provider `KeepMajority` |
| `EventSourcedBehavior` | | `EventSourced` |
| Cluster Sharding, Cluster Singleton | | on the roadmap |

</div>

## When tellus is not the right choice

tellus aims at clusters of tens of nodes, not yet hundreds. If you need sharding or a singleton
today, it does not have them yet. Messages are delivered at most once; if you need more, you build
it into your protocol, or you need a message broker. If plain tasks and channels already do the job,
you do not need actors at all, see
[when to use actors, and when not](@/docs/explanation/actor-model.md#when-to-use-actors-and-when-not).
And tellus is at 0.x: a minor release may change the API.

## Getting started

The [getting started tutorial](@/docs/tutorials/getting-started/_index.md) builds a device manager
out of actors. [Event-sourced actors](@/docs/tutorials/event-sourced-actors/_index.md) makes it
survive restarts, and [Clustered actors](@/docs/tutorials/clustered-actors/_index.md) spreads it
over several nodes.
