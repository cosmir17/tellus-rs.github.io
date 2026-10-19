+++
title       = "Message delivery"
description = "What tellus guarantees about delivering messages: at most once, in order per sender, and dead letters for the rest."
weight      = 3
+++

`tell` puts a message into an actor's mailbox and returns. It never blocks, and it never reports
whether the message arrived. This page explains what tellus guarantees about delivery and what it
deliberately does not.

## At most once

A message is delivered at most once. tellus never sends it twice, and it never retries. It can
fail to deliver a message for two reasons:

- The actor has terminated. Its mailbox is closed, and the message cannot enter it.
- The actor has a bounded mailbox, and the mailbox is full.

In both cases tellus drops the message and logs it at warn level as a dead letter, with the actor
ID and the message type. A message which was delivered can still go unprocessed: when the actor
stops before it gets to the message, the message is dropped with the rest of the mailbox. When an
actor fails while handling a message, that message is consumed and not delivered again, also not
to the restarted actor.

At least once would need acknowledgements and redelivery, and with them deduplication in every
receiver. tellus leaves that to the protocols which need it, built from messages. Request and
response is such a protocol, built into tellus as `ask`.

## In order per sender

Messages from one sender arrive in the order they were sent. If the group tells a device
`Record(21.5)` and then `Record(22.0)`, the device handles them in that order, and its last
reading is 22.0. There is no order between different senders. Two actors which record a reading
at the same time cannot know whose message the device handles first.

## Request and response

`ask` sends a message which carries a `ReplyTo` and waits for the reply, at most for a given
timeout. It resolves exactly once: with the reply, or with an error. The error says what went
wrong, for example that the mailbox was full, that the actor has terminated, that the timeout
elapsed, or that the `ReplyTo` was dropped without a reply. The reply itself is an ordinary
message, so it is delivered at most once, too. A reply after the timeout is a dead letter.

## Signals are never dropped

A terminated signal, which tells a watcher that a watched actor has terminated, bypasses the
capacity of a bounded mailbox. It is never dropped while the watcher is alive. It also arrives
behind every message the terminated actor delivered to the watcher, which is the
[death watch ordering guarantee](@/docs/explanation/death-watch-ordering.md).

## What this means for your code

Design protocols for loss. When a message matters, let the receiver confirm it, typically with
`ask`, and decide what to do when the confirmation does not come. When an actor must not lose its
state with a failure or a restart of the process, make it
[event-sourced](@/docs/explanation/event-sourcing.md). When a producer can outrun a consumer, use
a protocol which lets the consumer pull its work, as described in
[Apply backpressure](@/docs/how-to/apply-backpressure.md).
