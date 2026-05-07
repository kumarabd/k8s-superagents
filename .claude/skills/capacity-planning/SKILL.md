---
name: capacity-planning
description: Model current resource utilization and project future capacity needs. Produce rightsizing recommendations for HPA, VPA, resource requests/limits, and node pool sizing.
---

# Skill: Capacity Planning

## When to use

- Quarterly capacity review
- Before a traffic event (launch, campaign, seasonal peak)
- After repeated OOMKills or CPU throttling alerts
- When cluster costs are growing faster than usage

## Inputs needed

- Planning horizon (e.g., next 3 months)
- Expected traffic growth (percentage or multiplier)
- Current utilization data (Prometheus or kubectl top)
- Cost constraints (if any)

## Analysis steps

### Step 1: Collect current utilization

```bash
kubectl top pods -A --sort-by=memory
kubectl top nodes
kubectl get hpa -A -o wide
```

```promql
# Average CPU usage per workload over 7 days
avg_over_time(rate(container_cpu_usage_seconds_total{container!=""}[5m])[7d:5m])

# Average memory usage per workload over 7 days
avg_over_time(container_memory_working_set_bytes{container!=""}[7d:5m])
```

### Step 2: Compare requests vs actual usage

For each workload:
- **CPU request >> actual**: overprovisioned → reduce request (saves cost, improves scheduling density)
- **CPU actual ≈ CPU limit**: throttling risk → increase limit or optimize
- **Memory actual > 80% of limit**: OOMKill risk → increase limit
- **Memory request >> actual**: overprovisioned → reduce request

### Step 3: Review HPA effectiveness

```bash
kubectl describe hpa -A | grep -A5 "Metrics:\|Min replicas:\|Max replicas:\|Current Replicas:"
```

HPA hitting max replicas frequently → max is too low, or node capacity is the bottleneck.
HPA stuck at min replicas with high latency → metric selection may be wrong.

### Step 4: Model growth

For a workload currently using `X` CPU and expecting `G%` traffic growth:
- Expected usage: `X * (1 + G/100)`
- Add 30% headroom for spikes
- Target: `requests = expected_usage * 0.7`, `limits = expected_usage * 1.5`

### Step 5: Node pool sizing

```
Total requested CPU across all pods / Average node allocatable CPU = Minimum node count
Add 20% buffer for rolling updates and node failures
```

## Output format

```
Workload: <name>/<namespace>
Current: CPU req=X actual=Y (Z% utilized) | Mem req=A actual=B (C% utilized)
Status: <Overprovisioned / Rightsized / Throttled / OOM Risk>
Recommendation:
  CPU: requests=<new> limits=<new>
  Memory: requests=<new> limits=<new>
  HPA: min=<N> max=<M> target CPU=<P>%
Expected outcome: <cost change>, <risk reduction>
```

## Safety checks

- Never reduce limits below 120% of observed peak usage
- Do not reduce requests below observed average usage
- Apply changes during low-traffic periods with rollout monitoring active
