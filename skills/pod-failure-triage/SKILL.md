---
name: pod-failure-triage
description: Diagnose and resolve pod failures — CrashLoopBackOff, OOMKill, ImagePullBackOff, Eviction, and Pending scheduling failures. Systematic root cause identification before any remediation.
---

# Skill: Pod Failure Triage

## When to use

When a pod is not running as expected: CrashLoopBackOff, OOMKilled, Evicted,
ImagePullBackOff, Pending, or Terminating (stuck).

## Inputs needed

- Pod name and namespace
- How long has it been failing?
- Was this working before? What changed?

## Triage by failure type

### CrashLoopBackOff

```bash
# Get current state
kubectl describe pod <pod> -n <ns>

# Get last crash logs
kubectl logs <pod> -n <ns> --previous --tail=100

# Check exit code (OOMKilled = 137, segfault = 139, app error = 1/2)
kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[0].lastState.terminated}'
```

Root causes by exit code:
- `137` → OOMKilled (increase memory limit or fix memory leak)
- `1` or `2` → Application error (read the logs)
- `139` → Segfault (likely a bug in native code or corrupted binary)

### OOMKilled

```bash
kubectl describe pod <pod> -n <ns> | grep -A5 "OOMKilled\|Limits\|Requests"
kubectl top pod <pod> -n <ns> --containers
```

Fix: increase memory limit, or use VPA to right-size, or fix memory leak.

### ImagePullBackOff

```bash
kubectl describe pod <pod> -n <ns> | grep -A10 "Events:"
```

Root causes:
- Wrong image tag → fix the image reference
- Private registry, missing imagePullSecret → add imagePullSecret to pod spec
- Registry unreachable → check node network egress

### Pending (scheduling failure)

```bash
kubectl describe pod <pod> -n <ns> | grep -A20 "Events:"
```

Root causes:
- Insufficient CPU/memory → `kubectl top nodes`, scale the cluster or lower requests
- Node selector / affinity not matched → check `nodeSelector` and `affinity` in pod spec
- PVC not bound → check `kubectl get pvc -n <ns>`
- Taints/tolerations mismatch → `kubectl describe nodes | grep Taint`

### Evicted pods

```bash
kubectl get pods -A --field-selector=status.reason=Evicted
kubectl describe pod <evicted-pod> -n <ns> | grep "Message:"
```

Root causes:
- Node memory pressure → reduce pod density or add nodes
- Node disk pressure → clean up images or expand disk
- QoS class BestEffort → set resource requests to get Burstable or Guaranteed QoS

## Output

- Root cause identified
- Remediation applied or recommended
- Playbook referenced if applicable (`playbooks/sre/`)

## Safety checks

- Always read logs BEFORE making any changes
- Check if the failure is cluster-wide (node issue) or workload-specific before targeting the pod
- For OOMKilled: do not just increase limits without understanding why memory grew
