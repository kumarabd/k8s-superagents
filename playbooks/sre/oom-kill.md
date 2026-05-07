# Playbook: OOMKilled Container

**Skill:** pod-failure-triage
**Guardrail tier:** readonly (diagnosis) → controlled-write (remediation)

## When

A container has exit code 137 (OOMKilled) or `kubectl describe pod` shows `OOMKilled`.

## Steps

1. Confirm OOMKill:
   ```bash
   kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason}'
   # Should return: OOMKilled
   ```

2. Check current limits:
   ```bash
   kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[0].resources}'
   ```

3. Check actual memory usage trend (Prometheus):
   ```promql
   container_memory_working_set_bytes{pod="<pod>", namespace="<ns>"}
   ```
   If usage was growing over time → likely a memory leak.
   If usage hit the limit suddenly → limit may be too low for normal load.

4. For limit too low — increase limit (controlled-write, show diff):
   ```bash
   kubectl set resources deployment/<name> -n <ns> \
     --requests=memory=256Mi --limits=memory=512Mi
   ```

5. For suspected memory leak:
   - Do not just increase limits indefinitely
   - Enable heap profiling if the app supports it (language-specific)
   - Check for goroutine/thread leaks, unclosed connections, unbounded caches
   - File a bug with the developer team
   - Set a higher temporary limit as a stopgap while the leak is fixed

6. Verify stability:
   ```bash
   kubectl rollout status deployment/<name> -n <ns>
   ```
   Monitor for 30 minutes:
   ```promql
   container_memory_working_set_bytes{pod=~"<name>-.*", namespace="<ns>"}
   ```

## Escalate if

- Memory grows unboundedly even after limit increase → confirmed leak, escalate to developer
- OOMKill is on a system component (kubelet, coredns, etc.) → escalate to infra team
