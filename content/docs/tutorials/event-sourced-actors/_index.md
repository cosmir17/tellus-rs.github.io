+++
title         = "Event-sourced actors"
description   = "Make the devices survive restarts with event sourcing, in memory first, then in PostgreSQL."
weight        = 2
template      = "docs.html"
page_template = "docs-page.html"
sort_by       = "weight"
+++

The devices of the [getting started tutorial](@/docs/tutorials/getting-started/_index.md) keep their
last reading in memory, so it is gone after a restart. In this tutorial they persist what happens
to them as events and recover their state from those events: across a restart, across a new actor
system and finally across processes, with PostgreSQL. You need the `persistence-in-memory` feature
for the first three steps, and Docker for the last one.
