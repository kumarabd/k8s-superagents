---
name: node-pressure-debug
description: Debug Kubernetes node pressure conditions — MemoryPressure, DiskPressure, PIDPressure, and NotReady. Identify root cause on the node before deciding on remediation.
---

# Skill: Node Pressure Debug

## When to use

When a node is NotReady, or showing MemoryPressure, DiskPressure, or PIDPressure conditions.

## Inputs needed

- Node name
- Which condition is active
- How long has it been in this state?

## Triage sequence

### Step 1: Identify the condition

```bash
kubectl describe node <node-name> | grep -A20 "Conditions:"
kubectl get node <node-name> -o jsonpath='{.status.conditions[*].type} {.status.conditions[*].status}'
```

### Step 2: MemoryPressure

```bash
kubectl top node <node-name>
kubectl get pods --field-selector=spec.nodeName=<node-name> -A | kubectl top pods -A --sort-by=memory
```

Root causes:
- Single pod consuming all memory → OOMKill that pod (controlled-write)
- Workload density too high → cordon node and reschedule (privileged)
- Memory leak in system daemon → escalate to infra team

Immediate relief (controlled-write with confirmation):
```bash
kubectl cordon <node-name>
# Then drain non-critical pods to other nodes
```

### Step 3: DiskPressure

```bash
# SSH or exec into node to check disk
kubectl debug node/<node-name> -it --image=ubuntu -- df -h
kubectl debug node/<node-name> -it --image=ubuntu -- du -sh /var/lib/docker/overlay2 | sort -rh | head -20
```

Root causes:
- Large container images filling overlay2 → prune unused images
- Log files not rotating → check kubelet log config
- Persistent volumes filling up → expand PVC or alert app team

### Step 4: PIDPressure

```bash
kubectl debug node/<node-name> -it --image=ubuntu -- cat /proc/sys/kernel/pid_max
kubectl debug node/<node-name> -it --image=ubuntu -- ps aux | wc -l
```

Root causes:
- Pod spawning too many processes (fork bomb pattern) → evict or kill pod
- PID limit set too low for node density → increase `--pod-max-pids` on kubelet

### Step 5: NotReady (no specific pressure)

```bash
kubectl describe node <node-name> | grep -A5 "KubeletReady\|NetworkReady"
# Check kubelet and kube-proxy status on the node
kubectl debug node/<node-name> -it --image=ubuntu -- journalctl -u kubelet --since "10 minutes ago"
```

## Output

- Condition identified with root cause
- Immediate remediation applied (with confirmation per guardrail tier)
- Longer-term fix recommended

## Safety checks

- Cordon before drain — never drain without cordoning first
- Confirm workloads can reschedule (sufficient capacity on remaining nodes) before draining
- `kubectl debug node/` creates a privileged pod — remove it after debugging (`kubectl delete pod node-debugger-*`)
