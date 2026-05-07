---
name: observability-investigation
description: Correlate metrics (Prometheus), logs (Loki), and events (Kubernetes) to identify the root cause of latency, error rate, or throughput degradation.
---

# Skill: Observability Investigation

## When to use

When a service is degraded but the cause is not obvious from pod state alone:
elevated error rate, increased latency, throughput drop, or unusual resource consumption.

## Inputs needed

- Affected service and namespace
- Symptom: what is degraded? (error rate, p99 latency, throughput, CPU/memory)
- Time window: when did it start?
- Recent changes: deployments, config changes, traffic spikes?

## Investigation sequence

### Step 1: Establish the symptom baseline

Query Prometheus for the affected SLI:
```promql
# Error rate
rate(http_requests_total{namespace="myns", status=~"5.."}[5m])
  / rate(http_requests_total{namespace="myns"}[5m])

# p99 latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{namespace="myns"}[5m]))

# Throughput
rate(http_requests_total{namespace="myns"}[5m])
```

Note: when did the metric deviate from baseline? Correlate with deployment times.

### Step 2: Check for resource saturation

```promql
# CPU throttling
rate(container_cpu_cfs_throttled_seconds_total{namespace="myns"}[5m])

# Memory usage vs limit
container_memory_working_set_bytes{namespace="myns"}
  / container_spec_memory_limit_bytes{namespace="myns"}
```

If CPU throttling > 5%: the pod is CPU-constrained. Increase limit or optimize.
If memory ratio > 0.85: OOMKill risk. Increase limit or investigate leak.

### Step 3: Correlate with logs

```logql
# Loki: errors in the affected service
{namespace="myns", app="myapp"} |= "error" | logfmt | level="error" | line_format "{{.msg}}"

# Look for patterns: same error message recurring? Different pod? After a specific event?
{namespace="myns", app="myapp"} | logfmt | status >= 500
```

### Step 4: Check downstream dependencies

```bash
# Are downstream services healthy?
kubectl get pods -n <downstream-ns>
kubectl get endpoints -n <downstream-ns>
```

```promql
# Downstream error rate
rate(http_requests_total{namespace="downstream-ns", status=~"5.."}[5m])
```

### Step 5: Correlate timeline

Build a timeline:
- T-0: symptom started
- T-N: what changed before T-0? (deployments, HPA events, node events)
- T+N: what happened after? (auto-remediation, alerts fired, manual changes)

```bash
kubectl get events -n <ns> --sort-by=.lastTimestamp | tail -30
```

## Output

- Root cause with evidence (metric graph description + log excerpt)
- Timeline of events
- Recommended fix with expected outcome

## Safety checks

- Do not remediate before confirming root cause — treating symptoms masks the real issue
- Check if the issue is isolated to one pod or all replicas (pod vs deployment problem)
