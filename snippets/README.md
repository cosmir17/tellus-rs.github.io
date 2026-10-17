# Landing page snippets

The code shown on the landing page. Each file must eventually come from code CI compiles, so it
cannot drift from the API:

| Snippet                                     | Target source                                                        |
|---------------------------------------------|----------------------------------------------------------------------|
| `dispatcher.rs`                             | a new `tellus/examples/dispatcher.rs`                                |
| `event_sourced.rs`                          | an example in `tellus-persistence-postgres` or `tellus/src/testing.rs` |
| `supervision.toml`, `backoff-error.txt`     | a test in `tellus` deserializing the configuration                   |
| `cluster-default.yaml`, `cluster-k8s.yaml`  | `tellus-cluster-demo/config`, once `feat/remoting` is released       |
| `install.sh`                                | stays here                                                           |
