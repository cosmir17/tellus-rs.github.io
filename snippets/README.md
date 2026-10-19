# Landing page snippets

The code shown on the landing page. Each file must eventually come from code CI compiles, so it
cannot drift from the API:

| Snippet                                     | Target source                                                        |
|---------------------------------------------|----------------------------------------------------------------------|
| `cluster-default.yaml`, `cluster-k8s.yaml`  | `tellus-cluster-demo/config`, once `feat/remoting` is released       |
| `install.sh`                                | stays here                                                           |
