+++
title       = "Watching devices"
description = "Learn when an actor has terminated, and rely on having seen all of its messages."
weight      = 4
+++

Devices get replaced. When a device retires, it hands over its last reading to the group and
stops. The group should then forget the device. In this step the group watches its devices, so
tellus tells it when one has terminated.

## Retiring a device

A device now also understands `Retire`. It replies with its last reading and stops:

{{<example path="tellus/examples/tutorials/getting_started/04_watch.rs" anchor="device-receive"/>}}

The group gets two new messages: `Retire` from the outside, and `Retired`, which carries a
device's handover:

{{<example path="tellus/examples/tutorials/getting_started/04_watch.rs" anchor="group-message"/>}}

## Watching

{{<example path="tellus/examples/tutorials/getting_started/04_watch.rs" anchor="receive"/>}}

Right after spawning a device, the group calls `context.watch(&device)`. From then on, when
the device terminates, the group receives `Incoming::Terminated` with the device's `ActorId`. The
group removes the device from its registry, and once the last device is gone it stops itself.

For `Retire`, the group needs the device's answer in its own mailbox, as a `GroupMessage`.
`context.reply_to` creates such a `ReplyTo`: the closure turns the device's reply into a
`Retired` message for the group. This is how actors ask each other without ever waiting.

## Run it

{{<example path="tellus/examples/tutorials/getting_started/04_watch.rs" anchor="main"/>}}

```sh
cargo run --quiet -p tellus --example getting_started_04_watch
```

```txt
Last reading of left: 21.5
right handed over its last reading 19.1
right is gone
left handed over its last reading 21.5
left is gone
```

The first line is the answer to the `ask` in `main`, which still reads a device through the group
as in the previous step. After that, the two devices run concurrently, so `left` and `right` may
appear in either order.

## The ordering guarantee

For each device, the handover always comes before "is gone". That is not luck. tellus guarantees that the
terminated signal is ordered behind every message the terminated actor delivered to the watcher.

So receiving `Terminated` proves that you have seen every message from that actor you will ever
see. The group can rely on this: when it forgets a device, no handover from it can still be on the
way. You will use the same guarantee in the next step to avoid waiting for answers that will never
come.

## What you learned

`context.watch` turns another actor's termination into an `Incoming::Terminated` signal, and the
signal arrives after all of that actor's messages. `context.reply_to` lets an actor receive a
reply as an ordinary message.
