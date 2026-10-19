# Landing page snippets

Landing page code which is not in tellus yet. Each snippet except `install.sh` must eventually come
from code CI compiles, so it cannot drift from the API:

| Snippet                                     | Target source                                                        |
|---------------------------------------------|----------------------------------------------------------------------|
| `cluster-default.yaml`, `cluster-k8s.yaml`  | `tellus-cluster-demo/config`, once `feat/remoting` is released       |
| `install.sh`                                | stays here                                                           |
