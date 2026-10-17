+++
title       = "Hello, tellus"
description = "Create an actor system with a single actor that handles one message and stops."
weight      = 1
+++

Create a new binary crate and add tellus together with Tokio and anyhow:

```sh
cargo add anyhow
cargo add tokio --features macros,rt-multi-thread
cargo add tellus
```

Replace `src/main.rs` with this program:

{{<example path="tellus/examples/hello.rs"/>}}

Run it with `cargo run` and it prints `Hello, Tellus!`.
