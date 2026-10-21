+++
title       = "A group of devices"
description = "Spawn child actors on demand and route messages to them."
weight      = 3
+++

A building has many devices, grouped by room. In this step a group actor spawns a device actor
for every device it hears about and routes readings and requests to it.

## The group

{{<example path="tellus/examples/tutorials/getting_started/03_group.rs" anchor="group"/>}}

The group's state maps device names to `ActorRef<DeviceMessage>`, the handles for sending messages
to the devices. The device actor is the one from the previous step.

When a reading arrives for an unknown device, `context.spawn(Device)` creates a new device as a
child of the group and returns its `ActorRef`. The group stores it and forwards the reading.

`Read` shows that a `ReplyTo` can travel. The group does not answer itself: it forwards the
request's `ReplyTo` to the device, and the device replies directly to whoever asked. For an unknown
device the group replies `None` itself.

## Talking to the group

{{<example path="tellus/examples/tutorials/getting_started/03_group.rs" anchor="main"/>}}

## Run it

From a clone of the tellus repository:

```sh
cargo run --quiet -p tellus --example getting_started_03_group
```

It prints:

```txt
Last reading of left: 22.0
Last reading of right: 19.1
No reading of middle
```

## The actor tree

Every actor except the root has a parent: the actor that spawned it. Together they form a tree.
When an actor stops, tellus first stops its children, then the actor itself. So `system.stop()`
at the end stops the devices first and the group last, and `terminated` resolves only once the
whole tree is gone. You never have to stop children yourself.

## What you learned

`context.spawn` creates child actors, `ActorRef` is how you send them messages, and a `ReplyTo`
can be passed on so the right actor replies. Stopping an actor stops its children first. Next, a
device retires, and the group needs to know when it is gone.
