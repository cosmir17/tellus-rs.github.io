+++
title       = "Persist child actors"
description = "Spawn event-sourced children from a plain actor, persist a batch of events atomically and restart a timer after recovery."
weight      = 90
+++

An event-sourced actor does not have to be the root of its actor system. Any actor can spawn
event-sourced children with `context.spawn_event_sourced`, and each child recovers its own event
stream when it starts. What replay does not bring back is runtime state such as a timer, so a child
which needs one starts it again once it has recovered.

The examples on this page come from a building which spawns one event-sourced device per name. A
device persists batches of readings and forgets them once no new batch has arrived for a while. This
page builds on the [event-sourced actors tutorial](@/docs/tutorials/event-sourced-actors/_index.md)
and needs the `persistence` feature. The example runs on the in-memory store of the
`persistence-in-memory` feature.

## Spawn event-sourced children

{{<example path="tellus/examples/how_to/persist_child_actors.rs" anchor="building"/>}}

The building is a plain actor. It spawns a device on the first message for its name and forwards
every message to it as a command. `spawn_event_sourced` takes the actor and a `Persistence`, which
holds the store. The building keeps one and hands every device a clone, so all devices write to the
same store. Each device writes to a stream of its own, because its `persistence_id` is built from
its name with `PersistenceId::new("device", self.name)`. Two children with the same persistence ID
would share one stream, and an append of one would make the next append of the other fail.
`spawn_event_sourced_with_config` also takes an `ActorConfig`. Supervision, death watch and
termination work as for plain children. The devices run under the default strategy, `Stop`, and the
building does not watch them. A device which fails therefore stops and stays in the map. A plain
actor only needs to be `Send`. An event-sourced actor must also be `Sync` because tellus borrows it
across store calls.

## Persist a batch atomically

{{<example path="tellus/examples/how_to/persist_child_actors.rs" anchor="handle"/>}}

A `Record` command carries a batch of readings, and `Effect::persist_all` turns it into one
`Recorded` event per reading. tellus appends the events of one effect atomically, so after a crash
the store holds the whole batch or nothing of it, and `apply` folds them in order. `Read` persists
nothing, so its `then` continuation replies right after `handle`. `Expire` persists an `Expired`
event, so forgetting the readings is part of the history too: a recovery after it replays the
clearing.

## Start the timer again after recovery

The device declares `type Timers = Timed`, so its context can start timers. On every batch, `handle`
above starts the expiry timer under the key `expire`, which replaces the timer of the previous
batch. Once its delay has elapsed, the timer delivers `Expire`, which the device handles like any
command. The delay is a constant:

{{<example path="tellus/examples/how_to/persist_child_actors.rs" anchor="expire-after"/>}}

A timer is runtime state. It is neither persisted nor recreated by replay, and a restart cancels
it. Replay only applies events and never calls `handle`, so a device which recovers its readings has
no timer which would expire them. `recovered` runs once after every recovery, at the first start as
after a restart, and starts the timer again:

{{<example path="tellus/examples/how_to/persist_child_actors.rs" anchor="recovered"/>}}

`recovered` starts the full delay again, counted from the recovery. To keep the original deadline
instead, record it in an event and start the timer in `recovered` with the time remaining.

`recovered` has the context needed to start timers, spawn children or register with other actors
after recovery. The `init` of an event-sourced actor has no context, unlike the building's, and it
is skipped when a snapshot is loaded and used. A `then` continuation receives only the state, so it
cannot start a timer either.

## Run it

{{<example path="tellus/examples/how_to/persist_child_actors.rs" anchor="main"/>}}

The first actor system records a batch for each device and reads them back, then stops. The second
actor system starts on the same store. From a clone of the tellus repository:

```sh
cargo run --quiet -p tellus --features persistence-in-memory --example how_to_persist_child_actors
```

```txt
Device left: 21.5, 22.0, 22.4
Device right: 19.1, 19.4
Device left recovered 3 readings
Device left: 21.5, 22.0, 22.4
Device right recovered 2 readings
Device right: 19.1, 19.4
Device left: no readings
Device right: no readings
```

In the first actor system the devices have nothing to recover, so `recovered` prints nothing. In the
second one, the building spawns each device again on its first `Read`. The device recovers its
readings and starts its timer again in `recovered`. After twice `EXPIRE_AFTER`, both timers have
fired, and the devices have forgotten their readings. The timing leaves a margin of about one
`EXPIRE_AFTER` on both sides, but it is not guaranteed. On a heavily loaded machine a device can get
to its `Expire` before the first actor system has stopped it, or only after the last `Read`.
