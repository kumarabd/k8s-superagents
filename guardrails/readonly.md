# Guardrail: Readonly

Agents operating at this tier may inspect cluster state freely without asking for confirmation.

## Permitted operations

- `kubectl get` — any resource, any namespace
- `kubectl describe` — any resource
- `kubectl logs` — any pod/container
- `kubectl events` — any namespace
- `kubectl diff` — compare manifests against live state (does not apply)
- `kubectl top` — nodes and pods
- `helm list`, `helm status`, `helm get values`
- Reading files from the filesystem
- Querying Prometheus, Grafana, Loki (read-only queries)
- Web search and documentation lookup

## Not permitted at this tier

Anything that mutates cluster state, even temporarily. This includes `apply`, `delete`,
`scale`, `patch`, `exec`, `port-forward`, `rollout restart`, and `drain`.

If a task requires mutation, tell the user which guardrail tier is needed and ask them
to activate the appropriate profile.

## Agents at this tier

- architect
- security-auditor (read phase)
