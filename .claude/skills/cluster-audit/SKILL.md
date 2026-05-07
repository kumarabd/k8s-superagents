---
name: cluster-audit
description: Run a holistic Kubernetes cluster health assessment. Covers node health, workload state, resource utilization, configuration drift, and policy compliance.
---

# Skill: Cluster Audit

## When to use

- Routine weekly/monthly cluster health review
- Before a major release or cluster upgrade
- After an incident to assess cluster-wide impact
- When onboarding to an unfamiliar cluster

## Inputs needed

- Target cluster context (`kubectl config current-context`)
- Namespaces in scope (all, or specific set)
- Any known issues or recent changes to be aware of

## Audit sequence

### Phase 1: Node health

```bash
kubectl get nodes -o wide
kubectl describe nodes | grep -A10 "Conditions:"
kubectl top nodes
```

Look for: NotReady nodes, high memory/disk/PID pressure, version skew between nodes.

### Phase 2: Workload state

```bash
# Non-running pods
kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded

# Pods with high restart counts
kubectl get pods -A | awk '$5 > 5 {print}'

# Pending pods (possible scheduling issues)
kubectl get pods -A --field-selector=status.phase=Pending
```

### Phase 3: Resource utilization

```bash
kubectl top pods -A --sort-by=memory | head -20
kubectl top pods -A --sort-by=cpu | head -20
kubectl get hpa -A
```

### Phase 4: Configuration drift

```bash
# Deployments with unavailable replicas
kubectl get deployments -A | awk '$4 != $3 {print}'

# PVCs not bound
kubectl get pvc -A | grep -v Bound

# Services with no endpoints
kubectl get endpoints -A | awk 'NF < 3 {print}'
```

### Phase 5: Recent events

```bash
kubectl get events -A --sort-by=.lastTimestamp | grep Warning | tail -30
```

### Phase 6: Policy and security posture

```bash
# Service accounts with cluster-admin
kubectl get clusterrolebindings -o json | jq '.items[] | select(.roleRef.name=="cluster-admin") | .subjects'

# Pods running as root
kubectl get pods -A -o json | jq '.items[] | select(.spec.securityContext.runAsNonRoot != true) | .metadata | "\(.namespace)/\(.name)"'
```

## Output format

```
Cluster Audit Report — <date> — Context: <context>

NODES: <N> healthy, <N> warning, <N> critical
WORKLOADS: <N> healthy, <N> degraded, <N> failing
EVENTS: <N> warnings in last hour

Findings:
[CRITICAL] <description>
[WARNING]  <description>
[INFO]     <description>

Recommendations:
1. <action>
```

## Safety checks

- This skill is read-only — no mutations
- Capture full output before making any recommendations
- Do not alarm on transient pod restarts — look for patterns over time
