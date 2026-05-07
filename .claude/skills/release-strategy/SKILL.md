---
name: release-strategy
description: Choose and execute a Kubernetes release strategy — rolling update, canary, or blue/green. Covers strategy selection, progressive delivery config, SLI monitoring, and rollback decision gates.
---

# Skill: Release Strategy

## When to use

When releasing a new version of a workload to a production or staging environment,
especially when the change carries non-trivial risk.

## Inputs needed

- What is changing? (use rollout-risk-assessment skill first)
- Risk rating from rollout-risk-assessment
- Traffic sensitivity: is this a latency-critical user-facing service?
- Rollback speed requirement: how fast must you recover if something goes wrong?

## Strategy selection guide

| Strategy | When to use | Rollback speed |
|---|---|---|
| Rolling update | Low-medium risk, stateless, backward-compatible | Fast (`rollout undo`) |
| Canary | Medium-high risk, user-facing, need to validate with real traffic | Medium (shift traffic back) |
| Blue/Green | High risk, need instant cutover, stateless | Instant (switch service selector) |

## Rolling update

Default Kubernetes behavior. Configure in the Deployment:

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # allow 1 extra pod during rollout
      maxUnavailable: 0    # never reduce below desired replica count
```

Monitor:
```bash
kubectl rollout status deployment/<name> -n <ns> --watch
```

Rollback:
```bash
kubectl rollout undo deployment/<name> -n <ns>
```

## Canary (with Argo Rollouts)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  strategy:
    canary:
      steps:
        - setWeight: 10      # send 10% of traffic to canary
        - pause: {duration: 10m}
        - setWeight: 50
        - pause: {duration: 10m}
        - setWeight: 100
      analysis:
        templates:
          - templateName: success-rate
        args:
          - name: service-name
            value: myapp
```

Abort a canary (returns all traffic to stable):
```bash
kubectl argo rollouts abort <rollout-name> -n <ns>
```

## Blue/Green

```yaml
# Two Deployments: myapp-blue (current) and myapp-green (new)
# Service selector switches between them

# Switch to green
kubectl patch service myapp -n <ns> -p '{"spec":{"selector":{"version":"green"}}}'

# Rollback: switch back to blue
kubectl patch service myapp -n <ns> -p '{"spec":{"selector":{"version":"blue"}}}'
```

## SLI monitoring during rollout

Define abort thresholds before starting:
- Error rate > 1% for 2 consecutive minutes → abort
- p99 latency > 500ms → abort
- Readiness probe failure rate > 5% → abort

```promql
# Watch during rollout
rate(http_requests_total{status=~"5..", app="myapp"}[1m])
  / rate(http_requests_total{app="myapp"}[1m])
```

## Output

- Strategy chosen with rationale
- Rollout executed step by step with monitoring
- Rollback executed if thresholds breached, with incident handoff

## Safety checks

- Define abort thresholds BEFORE starting the rollout — not during
- Never proceed to the next canary step without checking SLIs
- Blue/Green: do not delete the old deployment until the new version is confirmed stable for at least 30 minutes
