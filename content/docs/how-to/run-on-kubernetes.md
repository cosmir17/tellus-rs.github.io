+++
title       = "Run on Kubernetes"
description = "Run cluster nodes as pods: advertise the pod's address, find the peers by label, report readiness and leave on termination."
weight      = 6
+++

A node on Kubernetes needs to know its own address, find its peers, prove who it is, tell
Kubernetes when it is ready, leave the cluster when Kubernetes stops its pod and exit when the
cluster downs it. The examples on this page come from a node that does all of that, and from the
manifests it runs with. One part stays specific to your deployment: issuing every pod a certificate
for its own address, see [Mount a certificate per pod](#mount-a-certificate-per-pod).

## Advertise the pod's address

{{<example path="tellus-bootstrap-k8s/examples/how_to_run_on_kubernetes.rs" anchor="transport"/>}}

The node binds to all interfaces, but advertises the pod's IP, which the downward API passes in:

{{<code path="tellus/tellus-bootstrap-k8s/examples/how_to_run_on_kubernetes.yaml" lang="yaml" title="tellus-bootstrap-k8s/examples/how_to_run_on_kubernetes.yaml" anchor="pod" comment="#"/>}}

Other nodes reach the node at that address, and only at that address is it admitted to the
cluster. The certificate, key and certificate authority come from `/etc/tellus/tls`, see
[Secure with mutual TLS](@/docs/how-to/secure-with-mutual-tls.md) and the certificates below.

## Find the peers by label

The `tellus-bootstrap-k8s` crate finds the peers by listing the pods that match a label selector:

```sh
cargo add tellus --features cluster
cargo add tellus-bootstrap-k8s
cargo add k8s-openapi --features v1_33
```

The last line is not optional: `k8s-openapi` needs the minimum Kubernetes version chosen by a
feature, and only your binary can choose it.

{{<example path="tellus-bootstrap-k8s/examples/how_to_run_on_kubernetes.rs" anchor="seeds"/>}}

`K8sSeeds::new` lists the pods labeled `app=tellus` through the Kubernetes API, with the service
account mounted into the pod, and pairs each pod's address with the port. `bootstrap` then forms or
joins the cluster through them. The listing sees a pod as soon as it has an address, so the nodes
find each other before any of them is ready. A headless Service lists only ready pods in DNS by
default; with `publishNotReadyAddresses: true` it lists them earlier, and the DNS seeds of
`tellus-bootstrap-dns` work as well.

## Allow listing pods

Listing pods is a permission, so the pods run as a service account of their own, which may list
pods and nothing else:

{{<code path="tellus/tellus-bootstrap-k8s/examples/how_to_run_on_kubernetes.yaml" lang="yaml" title="tellus-bootstrap-k8s/examples/how_to_run_on_kubernetes.yaml" anchor="rbac" comment="#"/>}}

A Role grants access to its own namespace, so the RoleBinding names the service account in the
namespace the pods run in, here `default`.

## Report ready once a member

A rollout replaces old pods only once their successors are ready. A node that counts as ready while
it is still bootstrapping would let Kubernetes retire established members before the new ones have
joined. So the node serves a readiness endpoint, which the `readinessProbe` of the manifest checks:

{{<example path="tellus-bootstrap-k8s/examples/how_to_run_on_kubernetes.rs" anchor="ready"/>}}

{{<example path="tellus-bootstrap-k8s/examples/how_to_run_on_kubernetes.rs" anchor="readiness"/>}}

The flag starts out false, turns true once `bootstrap` has made the node a member and its
application is running, and turns false again when the pod is terminated or the node is downed.
Since `K8sSeeds` sees unready pods too, gating readiness on membership hides no node from its peers.

## Leave when the pod terminates

{{<example path="tellus-bootstrap-k8s/examples/how_to_run_on_kubernetes.rs" anchor="lifecycle"/>}}

Kubernetes stops a pod with SIGTERM and kills it once `terminationGracePeriodSeconds` have passed.
On SIGTERM, the node reports itself unready and lingers until the readiness probe has failed, so no
Service sends it new traffic. Then it stops its actor system and leaves the cluster. The other
nodes list it as left as soon as they receive the departure, without detecting a failure.

`leave_on_terminated` waits for the actor system to terminate, without a deadline of its own, and
then bounds the drain by `EndpointConfig::leave_timeout`. The outer timeout hence covers both. The
grace period has to cover the linger, the termination timeout and the leave timeout: five, five and
three seconds here, well below the thirty of the manifest. A node that serves application requests
also drains them before it stops its actors, see
[Shut down gracefully](@/docs/how-to/shut-down-gracefully.md).

## Exit when downed

The cluster can also down the node, for example when it ends up in the minority of a partition. A
downed node is out of the cluster for good, so it must not stay ready:

{{<example path="tellus-bootstrap-k8s/examples/how_to_run_on_kubernetes.rs" anchor="await-downed"/>}}

`cluster_state` returns a `tokio::sync::watch::Receiver`, so `wait_for` also sees a downing that
happened before the wait began. The node is downed once its own entry is Down, or gone. The
lifecycle above races that against SIGTERM. When the node is downed, it reports itself unready and
exits with an error, without leaving: this node is no longer a member. Kubernetes restarts the
container, and the new process joins as a new node.

## Mount a certificate per pod

The certificate has to cover the address the node advertises, either with the pod's IP as an IP
address SAN or with `tellus://<pod IP>:7878` as a URI SAN. Every pod hence needs a certificate of
its own, issued once its IP is known. cert-manager's CSI driver issues a certificate per pod, but it
cannot put the pod's IP into it: it accepts IP addresses only literally and substitutes no pod IP.
So with this integration, issuing the certificates is a step of your own deployment, e.g. an init
container that requests the certificate from your certificate authority. The manifest leaves the
`tls` volume to that step.

## Deployment or StatefulSet

A Deployment is the natural choice: a pod that is replaced gets a new name and a new IP, and joins
as a new node, just as a restarted process would. A StatefulSet only pays off when something
outside the cluster addresses the nodes by name.

## Build and deploy

The example is meant to run in a pod, not on your machine. Build it from a tellus checkout:

```sh
cargo build -p tellus-bootstrap-k8s --example how_to_run_on_kubernetes
```

To deploy it, put the binary into an image, set that image in the manifest, provide the `tls`
volume and apply the manifest with `kubectl apply -f`.
