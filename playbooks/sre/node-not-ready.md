# Playbook: Node NotReady

**Skill:** node-pressure-debug
**Guardrail tier:** readonly (diagnosis) → privileged (drain/cordon)

## When

A node shows `NotReady` in `kubectl get nodes`.

## Steps

1. Check node conditions:
   ```bash
   kubectl describe node <node> | grep -A15 "Conditions:"
   ```

2. Check recent node events:
   ```bash
   kubectl get events -A --field-selector=involvedObject.name=<node> --sort-by=.lastTimestamp | tail -20
   ```

3. Check kubelet status (if you have node access):
   ```bash
   kubectl debug node/<node> -it --image=ubuntu -- journalctl -u kubelet --since "15 minutes ago" | tail -50
   ```

4. Identify pressure type:
   - `MemoryPressure=True` → go to memory pressure path
   - `DiskPressure=True` → go to disk pressure path
   - `PIDPressure=True` → go to PID pressure path
   - No pressure but NotReady → kubelet or network issue

5. **Memory pressure** — identify largest consumers and evict:
   ```bash
   kubectl top pods --field-selector=spec.nodeName=<node> --sort-by=memory -A
   ```
   Cordon node (privileged, requires confirmation):
   ```bash
   kubectl cordon <node>
   kubectl drain <node> --ignore-daemonsets --delete-emptydir-data
   ```

6. **Disk pressure** — clean images (privileged):
   ```bash
   kubectl debug node/<node> -it --image=ubuntu -- crictl rmi --prune
   ```

7. Verify recovery:
   ```bash
   kubectl get node <node> --watch
   ```
   Uncordon once conditions clear:
   ```bash
   kubectl uncordon <node>
   ```

8. Clean up debug pod:
   ```bash
   kubectl delete pod -n default -l app=node-debugger
   ```

## Escalate if

- Node remains NotReady after kubelet restart → likely infrastructure issue, escalate to cloud provider or infra team
- Disk pressure but no large images or logs → check for rogue container writing to hostPath
