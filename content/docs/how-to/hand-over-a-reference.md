+++
title       = "Hand over a reference"
description = "Pass an actor reference to another node out of band, as bytes on its command line, and use it once that node has joined."
weight      = 110
+++

Within a cluster, references travel inside messages: an `ActorRef` or a `ReplyTo` in a message
crosses the wire with it. The first reference a node gets has to come from somewhere else. Usually
the receptionist finds it by key, as in
[Finding the device manager](@/docs/tutorials/clustered-actors/receptionist.md). Instead,
`cluster::serialize_ref` and `cluster::deserialize_ref` turn a reference into bytes and back, so it
can be handed over out of band: in a configuration file, an environment variable or on a command
line.

The examples on this page come from two nodes. The first one serializes the reference of its
greeter and passes it to the second one on the command line, in hex. The program plays both nodes,
as in the [clustered actors tutorial](@/docs/tutorials/clustered-actors/two-nodes.md).

## Serialize the reference

{{<example path="tellus/examples/how_to/hand_over_a_reference.rs" anchor="first-node"/>}}

`serialize_ref` needs a started endpoint and encodes the reference with the endpoint's codec. The
bytes carry the manifest of the message type next to the reference. A command line takes text, so
the example writes the bytes in hex; any encoding of bytes works. The first node then starts the
second node with the reference as an argument and bootstraps the cluster. It keeps the greeter
running until the second node has exited.

## Deserialize it on the other node

{{<example path="tellus/examples/how_to/hand_over_a_reference.rs" anchor="second-node"/>}}

`deserialize_ref::<Greet>` resolves the bytes into an `ActorRef<Greet>`. It refuses bytes serialized
for another message type as `RefError::TypeMismatch`, rather than resolving them into a reference
which drops every message told to it. `Greet` crosses the wire, so it derives serde's `Serialize`
and `Deserialize` and implements `Schema`. It implements `Manifest` for the type check. The reply, a
`String`, crosses the wire too, and tellus implements `Schema` for it. See [Messages that
travel](@/docs/tutorials/clustered-actors/remotable-messages.md).

The second node asks the greeter only once `bootstrap` has made it a member: a node refuses the
handshake of a peer which it does not list as a member, unless the peer is joining. The first node
takes the lower of the two addresses, so it is the one which forms the cluster, and the second node
becomes a member by joining it. Both nodes list each other from then on. The reference works like
any other, and the reply finds its way back through the `ReplyTo` inside `Greet`. Finally the second
node leaves the cluster and exits.

For a node which forms the cluster itself, `bootstrap` returns before the other node has joined. The
other node refuses that node's handshake until then, and tellus attempts it up to
`EndpointConfig::max_connect_attempts` times in all. So the first message of that node is sent late.

## What to keep in mind

**Every node has to agree on the manifest.** tellus compares the manifest in the bytes with that of
the requested type. It cannot check that the manifest names the same type on every node, so a
manifest has to be unique per type across the cluster.

**The bytes name one actor of one process.** Next to the actor's ID they hold the address of its
node and the node's
[incarnation](@/docs/explanation/membership-and-downing.md#members-and-incarnations). Once that
actor has terminated, the reference names nothing anymore, and messages told to it are dead letters.
The same holds once its node has left, has been downed or has been restarted. A restarted node is
another incarnation, and its actors have new IDs. So the reference has to be serialized and handed
over anew at every start of its node. `deserialize_ref` on another node still resolves bytes which
name nothing. A [subscription](@/docs/tutorials/clustered-actors/receptionist.md) at the
receptionist follows whichever actors are registered under a key instead.

**Only the first reference needs this.** Every further reference can travel inside a message told
to one already resolved.

## Run it

{{<example path="tellus/examples/how_to/hand_over_a_reference.rs" anchor="main"/>}}

From a clone of the tellus repository:

```sh
cargo run --quiet -p tellus --features cluster-dev --example how_to_hand_over_a_reference
```

```txt
The greeter answered: Hello, Bob
```

The second node prints the answer of the greeter, which runs on the first node. tellus logs to
stderr; `RUST_LOG=tellus=debug` shows what both nodes do meanwhile.
