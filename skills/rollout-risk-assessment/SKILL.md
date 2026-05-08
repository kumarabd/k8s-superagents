---
name: rollout-risk-assessment
description: Assess the risk of a proposed Kubernetes change before applying it. Identifies blast radius, rollback complexity, and monitoring requirements. Used by developer, SRE, and release profiles.
---

# Skill: Rollout Risk Assessment

## When to use

Before applying any change to a shared environment (staging or production):
manifest updates, image upgrades, config changes, HPA adjustments, or Helm upgrades.

## Inputs needed

- What is changing? (show the diff)
- Which environment? (dev/staging/prod)
- What workloads are affected?
- What is the current state of those workloads? (healthy? recent incidents?)

## Assessment checklist

### Change characterization

- [ ] Is this a code change, config change, or infrastructure change?
- [ ] Does it change the API contract of any service? (breaking change?)
- [ ] Does it affect storage or persistent state? (higher risk)
- [ ] Does it affect RBAC or security policy? (security review needed)

### Blast radius

- [ ] How many users/requests are served by the affected workloads?
- [ ] Are there downstream dependencies that will break if this workload fails?
- [ ] Is this namespace isolated or shared across teams?

### Rollback complexity

- [ ] Can this be undone with `kubectl rollout undo`? (low risk)
- [ ] Does rollback require a database migration to reverse? (high risk — do not proceed without explicit plan)
- [ ] Are there CRD schema changes that cannot be rolled back? (high risk)

### Pre-flight checks

```bash
# Is the target workload healthy right now?
kubectl get deployment <name> -n <ns>
kubectl rollout status deployment/<name> -n <ns>

# Any active alerts on this workload?
# Check Grafana/Prometheus alertmanager

# Recent error rate baseline
# Check Prometheus: rate(errors[5m]) for this workload
```

## Risk rating

| Rating | Criteria |
|---|---|
| Low | Config change only, easy rollback, isolated namespace |
| Medium | Image upgrade, no schema change, standard rollout |
| High | Schema change, stateful workload, or cascading dependencies |
| Critical | Production data migration, cluster-wide impact, or no rollback path |

## Output

```
Change: <description>
Environment: <env>
Risk rating: Low / Medium / High / Critical

Blast radius: <N users, N services affected>
Rollback: <how to undo — command or "requires manual intervention">

Recommended strategy: rolling / canary / blue-green
Monitoring during rollout:
  - Watch: <metric or dashboard>
  - Abort if: <threshold>

Pre-flight: PASS / FAIL
  [PASS/FAIL] Workload currently healthy
  [PASS/FAIL] No active incidents on affected workload
  [PASS/FAIL] Rollback path confirmed
```

## Safety checks

- Do not proceed if risk is Critical without explicit architect sign-off
- Do not proceed if any pre-flight check fails
- Always define the abort threshold before starting — not during
