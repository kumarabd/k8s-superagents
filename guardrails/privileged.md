# Guardrail: Privileged

Agents at this tier may execute destructive or high-blast-radius operations, but only
after the user provides a typed reason and explicit confirmation.

## Required confirmation flow

1. Describe exactly what will happen and what cannot be undone
2. State the blast radius (which workloads, namespaces, or nodes are affected)
3. Ask the user to type: `CONFIRM: <reason>` (literal string, not just "yes")
4. Execute only after receiving that exact format

## Permitted operations (with typed confirmation)

- `kubectl delete` — pods, deployments, namespaces, CRDs
- `kubectl drain` — evict all pods from a node before maintenance
- `kubectl cordon` / `kubectl uncordon` — mark node unschedulable
- `kubectl exec` — shell into a running container
- `kubectl delete --force --grace-period=0` — force-delete stuck pods
- Node pool operations via Cloud Provider MCP
- Removing Helm releases (`helm uninstall`)

## Hard stops — never do these

- Delete a namespace without listing all resources inside it first
- Drain a node without confirming workloads have been rescheduled elsewhere
- Delete a PVC (data loss — escalate to human)
- Modify cluster-admin or system: ClusterRoleBindings

## Agents at this tier

- incident-responder (for active remediation only)
- security-auditor (for policy enforcement actions only)
