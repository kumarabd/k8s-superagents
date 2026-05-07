# Guardrail: Controlled Write

Agents at this tier may mutate cluster state, but must show the user exactly what
will change and receive explicit confirmation before executing.

## Required confirmation flow

1. Show the full `kubectl diff` or describe the exact command to be run
2. State the expected outcome and any risk
3. Wait for the user to type "yes", "confirm", or "proceed"
4. Execute only after confirmation — never pre-emptively

## Permitted operations (with confirmation)

- `kubectl apply` — apply manifests after showing diff
- `kubectl scale` — scale deployments/statefulsets after stating target replicas
- `kubectl patch` — patch resources after showing before/after
- `kubectl rollout restart` — after stating which workload and why
- `helm upgrade` — after showing `helm diff` output
- `helm install` — after listing resources that will be created
- `kubectl label` / `kubectl annotate` — after showing the label change

## Not permitted at this tier

- `kubectl delete` — use privileged tier
- `kubectl drain` / `kubectl cordon` — use privileged tier
- `kubectl exec` into production pods — use privileged tier
- Any `--force` flag — use privileged tier

## Agents at this tier

- cluster-sre
- manifest-engineer
- release-manager
- capacity-planner
