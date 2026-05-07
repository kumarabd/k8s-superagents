# Example: Debug a CrashLoopBackOff

**Profile:** SRE
**Agents:** cluster-sre → incident-responder
**Skills:** pod-failure-triage
**Playbook:** playbooks/sre/pod-crashloop.md

## Scenario

The `api-gateway` deployment in the `production` namespace is in CrashLoopBackOff.
Alert fired at 14:23 UTC. On-call SRE activates the SRE profile.

## Session walkthrough

### Step 1: Load the SRE profile

```
Load the SRE profile. We have an active incident — api-gateway is CrashLoopBackOff in production.
```

### Step 2: Initial triage (cluster-sre)

```bash
kubectl describe pod -n production -l app=api-gateway | tail -30
```

Output shows: `Exit Code: 137` — OOMKilled.

### Step 3: Engage incident-responder

The cluster-sre hands off to the incident-responder agent for active remediation.

```bash
# Check memory limits
kubectl get pod -n production -l app=api-gateway -o jsonpath='{.items[0].spec.containers[0].resources}'
# Output: {"limits":{"memory":"128Mi"},"requests":{"memory":"64Mi"}}

# Check recent memory usage
# Prometheus: container_memory_working_set_bytes{app="api-gateway", namespace="production"}
# Shows: memory was growing from 80Mi to 128Mi over 30 minutes before OOMKill
```

### Step 4: Determine cause

Memory was growing steadily — likely a connection pool leak introduced in the latest deploy.

Immediate fix (controlled-write): increase limit to buy time.
Long-term fix: fix the memory leak (escalate to developer team).

### Step 5: Apply temporary fix

```
CONFIRM: Increase api-gateway memory limit to 384Mi to stabilize while the memory leak is fixed
```

```bash
kubectl set resources deployment/api-gateway -n production --limits=memory=384Mi
kubectl rollout status deployment/api-gateway -n production
```

### Step 6: Verify stability

Monitor for 15 minutes. Memory stabilized at ~180Mi after the restart. No further OOMKills.

### Step 7: Postmortem

Use `postmortem-writing` skill. File a bug against the api-gateway team for the connection pool leak.
