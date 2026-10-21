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
actor fails while handling a message, that message is consumed and not delivered again, not even
to the restarted actor.

At least once would need acknowledgements and redelivery, and with them deduplication in every
receiver. tellus leaves that to the protocols which need it, built from messages. `ask` provides
the acknowledgement part: the caller learns whether a reply came. Redelivery is up to the caller.

## In order per sender

Messages from one sender arrive in the order they were sent. If the group tells a device
`Record(21.5)` and then `Record(22.0)`, the device handles them in that order, and its last
reading is 22.0. There is no order between different senders. Two actors which record a reading
at the same time cannot know whose message the device handles first.

## Request and response

`ask` sends a message which carries a `ReplyTo` and waits for the reply, at most for a given
timeout. It resolves exactly once: with the reply, or with an error. The error says what went
wrong, for example that the mailbox was full, that the actor has terminated, that the timeout
elapsed, or that the `ReplyTo` was dropped without a reply. The reply is delivered at most
once, too: a reply after the timeout is a dead letter.

## Terminated signals bypass the capacity

A terminated signal, which tells a watcher that a watched actor has terminated, bypasses the
capacity of a bounded mailbox. A full mailbox never drops it; only `unwatch` or the watcher's own
termination does. It also arrives
behind every message the terminated actor delivered to the watcher, which is the
[death watch ordering guarantee](@/docs/explanation/death-watch-ordering.md).

## Across nodes

With the `cluster` feature, `tell` and `ask` work the same on a reference to an actor on another
node. At most once and the order hold across nodes as well, with the additions below. Terminated
signals keep their ordering guarantee only when they report a real termination, see
[the death watch ordering guarantee across nodes](@/docs/explanation/death-watch-ordering.md#across-nodes).

A message to another node is still delivered at most once. Besides a terminated actor and a full
mailbox, the network adds its own reasons to drop it:

- The node is unreachable or gone.
- The queue of outgoing messages for that node is full.
- The encoded message is larger than the maximum frame size.
- The receiving node cannot decode it.

tellus logs each of these as a dead letter, too.

The order holds per sender and recipient. When a connection breaks, tellus reconnects and delivers
the messages queued meanwhile, in order. It does not replay the messages that were already handed to
the broken connection, so some of them may be lost. Across a reconnect, messages hence arrive in
order, with gaps: never reordered, never duplicated, possibly missing.

`ask` crosses nodes through the same API, and the `ReplyTo` travels inside the message. It still
resolves exactly once, at the latest at its timeout, and the reply stays in order with the other
messages the responder sends the asker. Noticing a `ReplyTo` that was dropped without a reply is
only best effort across nodes, so such an ask may end with its timeout instead. Three errors exist
only for remote requests: the message cannot be encoded, it is too large to send, or this node's
endpoint has not been started. Encoding and size errors are not transient: retrying the unchanged
request fails again.

## What this means for your code

Design protocols for loss, all the more across nodes. When a message matters, let the receiver
confirm it, typically with `ask`, and decide what to do when the confirmation does not come. When an
actor must not lose its state with a failure or a restart of the process, make it
[event-sourced](@/docs/explanation/event-sourcing.md). When a producer can outrun a consumer, use a
protocol which lets the consumer pull its work, as described in [Apply
backpressure](@/docs/how-to/apply-backpressure.md).