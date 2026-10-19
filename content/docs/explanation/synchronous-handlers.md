+++
title       = "Synchronous message handlers"
description = "Why receive is a plain function, and what that means for your code."
weight      = 2
+++

In tellus, `receive` is a plain function, not an `async fn`. An actor handles a message from start
to finish. When it needs to wait for something, the result arrives later as another message. This
page explains why tellus is designed this way and what it means for your code.

## What an actor does

Carl Hewitt defined an actor by what it may do in response to a message. It may send a finite
number of messages to other actors, create a finite number of new actors, and designate the
behavior for the next message. A tellus `receive` does exactly that, here in the group of devices
from the [getting started tutorial](@/docs/tutorials/getting-started/group.md):

{{<example path="tellus/examples/tutorials/getting_started/03_group.rs" anchor="record"/>}}

`context.spawn` creates an actor for a device the group has not seen before, `tell` sends it the
reading, and the returned `Control::Continue(devices)` designates the state for the next message.
Then `receive` returns, and the actor is ready for the next message.

Hewitt's definition describes the reaction to one message as a whole. It has no step where an
actor pauses in the middle and waits.

## What you get from it

**No half-updated state.** `receive` takes the state by value and returns the next one. No other
message ever sees the state in between, because no other message is handled until `receive` has
returned.

**Actors stop between messages.** tellus never stops or restarts an actor while `receive` is
running. Stopping, restarting with a fresh state and terminating children all happen between two
messages, so an actor is never left halfway through a change.

**Waiting is part of the state.** An actor that waits for answers has to say so in its state. The
query actor in the [tutorial](@/docs/tutorials/getting-started/query.md) is in a `Running` state
with the devices it still waits for. You can read that state, match on it and test it with
`TestContext`, without running an actor system.

## Waiting is a message

When an actor needs a reply from another actor, it creates a `ReplyTo` with `context.reply_to`.
The reply then arrives in its own mailbox, as an ordinary message, and `receive` handles it like
any other. Only code outside of actors, like `main` or an HTTP handler, uses `ask` and awaits the
reply.

Event sourcing works the same way. The handler of an event-sourced actor returns an `Effect` that
names the events to persist. tellus appends them to the store and applies them to the state.
Whatever should happen once the events are durable, like replying, runs after that. The I/O
happens in tellus, not in your handler.

## Async and blocking work

Some work does need to await: a database query, an HTTP request. Spawn a Tokio task for it and send
the result back to the actor with `tell` or a `ReplyTo`. Blocking or CPU-heavy work goes into
`spawn_blocking` the same way. The how-to guide
[Call async code from an actor](@/docs/how-to/call-async-code.md) shows the pattern.

## The costs

A `receive` that blocks occupies a Tokio worker thread until it returns, so keep it short and move
slow work into a task. A `receive` that never returns keeps its actor from stopping, and with it
every ancestor, since a parent terminates only after its children.

Some interactions also need an extra message and an explicit state where an async handler would
simply await. tellus accepts that cost in exchange for actors you can reason about one message at
a time.

For the full argument, read
[Why tellus message handlers are synchronous](https://heikoseeberger.de/2026-10-18-why-sync-handlers/)
on Heiko Seeberger's blog.
