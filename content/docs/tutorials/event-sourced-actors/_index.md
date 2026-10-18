+++
title         = "Event-sourced actors"
description   = "Make the devices survive restarts with event sourcing, in memory first, then in PostgreSQL."
weight        = 2
template      = "docs.html"
page_template = "docs-page.html"
sort_by       = "weight"

[extra]
status = "coming-soon"
+++

This tutorial is being written. Until then, the event-sourced examples of tellus show the
`persistence` feature in action:
[`event_sourced_counter`](https://github.com/tellus-rs/tellus/blob/tellus-v0.3.4/tellus-persistence-postgres/examples/event_sourced_counter.rs)
and
[`event_sourced_supervision`](https://github.com/tellus-rs/tellus/blob/tellus-v0.3.4/tellus-persistence-postgres/examples/event_sourced_supervision.rs),
both against PostgreSQL. The post
[tellus 0.2: event sourcing for actors](https://heikoseeberger.de/2026-08-31-tellus-persistence/)
explains the design.
