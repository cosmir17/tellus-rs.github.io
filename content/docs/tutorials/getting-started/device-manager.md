+++
title       = "A device manager"
description = "Put a manager on top of the groups and route commands through the actor tree."
weight      = 7
+++

A building has more than one room. In this last step a device manager sits on top: it spawns a
group per room on demand and routes every command to the right group. The groups, the devices and
the query actor are those from the previous step, unchanged.

## The manager

{{<example path="tellus/examples/tutorials/getting_started/07_device_manager.rs" anchor="manager"/>}}

The manager follows the same pattern as the group one level below: a map from names to
`ActorRef`s, filled on demand with `context.spawn`. Every command names its group, and the manager
forwards the rest of it.

For `Average`, the request's `ReplyTo` now travels two levels down: from the manager to the group,
and from the group into a new query actor. The query replies directly to whoever asked. For an
unknown group the manager replies `None` itself.

## Run it

{{<example path="tellus/examples/tutorials/getting_started/07_device_manager.rs" anchor="main"/>}}

```sh
RUST_LOG=tellus=debug cargo run --quiet -p tellus --example getting_started_07_device_manager
```

On stdout it prints:

```txt
Average temperature in attic: 21.50
No readings in cellar
No readings in garage
```

In the attic, `right` retired, so only `left` counts. In the cellar, `boiler` failed on the invalid
reading and restarted without its 11.0. The garage does not exist.

Stopping the system stops the whole tree bottom-up: devices first, then groups, then the manager.

## What you learned

Actor trees compose: each actor knows only its direct children. A `ReplyTo` lets the query at the
bottom answer the asker directly, without going back through the group and the manager. If you
know the IoT device manager from the
[Apache Pekko documentation](https://pekko.apache.org/docs/pekko/current/typed/guide/tutorial.html),
this is tellus's take on it.

## Where to go from here

You have used the core features of tellus: actors with state, `tell` and `ask`, child actors,
watch with its ordering guarantee, and supervision.

The next tutorials build on this one.
[Event-sourced actors](@/docs/tutorials/event-sourced-actors/_index.md) makes the devices survive
restarts, and [Clustered actors](@/docs/tutorials/clustered-actors/_index.md), coming soon, will
spread them across nodes.
