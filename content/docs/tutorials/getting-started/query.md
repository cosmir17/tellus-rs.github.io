+++
title       = "Asking all devices"
description = "Collect answers from many actors with a short-lived query actor, without timeouts."
weight      = 5
+++

What is the average temperature of a group? To answer, the group has to ask all of its devices
and combine their readings. Meanwhile it should keep handling other messages, and a device might
retire before it answers. In this step a short-lived query actor does the asking.

The handover from the previous step has served its purpose, so devices now simply stop on
`Retire`. The group's `Read` gives way to `Average`. Devices keep their `Read`: the query uses it.

## One query actor per request

{{<example path="tellus/examples/tutorials/getting_started/05_query.rs" anchor="average"/>}}

For every `Average` request, the group spawns a `Query` and gives it the current devices and the
request's `ReplyTo`. Then the group is free for the next message. The query does the rest:

{{<example path="tellus/examples/tutorials/getting_started/05_query.rs" anchor="query"/>}}

The query's state is a small state machine. On `Start` it watches every device, sends each a
`Read` and remembers it as pending. Each reading arrives through `context.reply_to` as a `Reading`
message and is added to the sum. When no device is pending anymore, the query replies and stops.

## Why the query cannot hang

A device may terminate before it answers. Then its `Read` is never handled, and without further
care the query would wait forever.

Because the query watches every device, it receives `Terminated` for such a device. The ordering
guarantee from the previous step tells the query that this device's reading can no longer arrive,
so it stops waiting for it. No timeout is needed inside the actors. The only deadline is the one
on `ask` in `main`, at the boundary to the outside world.

When a reading does arrive, the query calls `context.unwatch`. After `unwatch` returns, the query
never receives a terminated signal for that device, even if one was already on its way.

## Run it

{{<example path="tellus/examples/tutorials/getting_started/05_query.rs" anchor="main"/>}}

```sh
cargo run --quiet -p tellus --example getting_started_05_query
```

```txt
Average temperature: 20.95
```

The device `right` retires right before the request, so the average covers `left` and `middle`
only.

## What you learned

A short-lived actor per request keeps the group responsive. Watching the actors you wait for, and
relying on the ordering guarantee, replaces timeouts inside your actors. Next, devices fail.
