# Playbook: Pod CrashLoopBackOff

**Skill:** pod-failure-triage
**Guardrail tier:** readonly (diagnosis) → controlled-write (remediation)

## When

A pod is in `CrashLoopBackOff` state.

## Steps

1. Get pod details:
   ```bash
   kubectl describe pod <pod> -n <ns>
   ```

2. Get crash logs:
   ```bash
   kubectl logs <pod> -n <ns> --previous --tail=100
   ```

3. Check exit code:
   ```bash
   kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[0].lastState.terminated}'
   ```

4. Diagnose by exit code:
   - `137` → OOMKilled: check memory limits, look for leak
   - `1` / `2` → App error: read the logs for the error message
   - `139` → Segfault: check for corrupted image or native code bug

5. For OOMKilled — patch memory limit (controlled-write, show diff first):
   ```bash
   kubectl set resources deployment/<name> -n <ns> --limits=memory=512Mi
   ```

6. For app error — check if config or secret is missing:
   ```bash
   kubectl get configmap,secret -n <ns>
   kubectl describe pod <pod> -n <ns> | grep -A5 "Environment\|Mounts"
   ```

7. Verify fix:
   ```bash
   kubectl rollout status deployment/<name> -n <ns>
   ```

## Escalate if

- Exit code is 137 repeatedly despite increased limits → memory leak, escalate to developer
- Logs are empty after `--previous` → possible init container failure, check `kubectl describe`
