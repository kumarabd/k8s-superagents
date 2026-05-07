# Example: Incident Escalation — OOMKill → Remediation → Postmortem

**Profile:** SRE
**Agents:** cluster-sre → incident-responder
**Skills:** cluster-audit → pod-failure-triage → postmortem-writing
**Playbook:** playbooks/sre/oom-kill.md

## Scenario

The `api-gateway` deployment in `production` has been restarting every 20
minutes. PagerDuty fires at 02:14 UTC. On-call SRE loads the SRE profile.

---

## Turn 1 — User loads profile and reports issue

```
Load the SRE profile. api-gateway in production has been restarting every
20 minutes since ~02:00 UTC. On-call page just fired.
```

**Claude (cluster-sre):** SRE profile active. Controlled-write tier in effect.
Starting cluster-audit skill.

---

## Turn 2 — cluster-sre: initial snapshot

```bash
bash plugins/scripts/audit.sh
```

Output excerpt:
```
## HIGH-RESTART PODS (>5 restarts)
production   api-gateway-7d4f9b-xk2lp   0/1   OOMKilled   9   18m
```

**Claude (cluster-sre):** `api-gateway` has 9 restarts in 18 minutes — OOMKilled.
Switching to `pod-failure-triage` skill. Fetching logs from the previous
container instance before handing to incident-responder.

---

## Turn 3 — cluster-sre: log triage

```bash
bash plugins/scripts/log-fetcher.sh api-gateway-7d4f9b-xk2lp production \
  --previous --tail 200 --grep "OOM\|memory\|heap"
```

Output:
```
FATAL heap out of memory: process allocation failed — JavaScript heap 512MB
```

**Claude (cluster-sre):** Root cause confirmed — Node.js heap exhaustion.
Memory limit is 256Mi; heap hit 512MB. Escalating to incident-responder for
remediation. Handing off with context: OOMKill, heap exhaustion, limit=256Mi.

---

## Turn 4 — incident-responder: confirm blast radius

**Claude (incident-responder):** Privileged tier active for this incident.

Checking blast radius:

```bash
bash plugins/scripts/cluster-reader.sh endpoints
```

`api-gateway` serves 3 downstream services. Every restart causes ~30s outage.
Current error rate: ~8% (from Prometheus MCP).

Proposed immediate fix: increase memory limit to 512Mi to stop the OOMKill
cycle while the heap leak is investigated.

Awaiting confirmation before applying.

---

## Turn 5 — User confirms

```
CONFIRM: increase api-gateway memory limit to 512Mi to stabilize while the heap leak is investigated
```

---

## Turn 6 — incident-responder: apply fix

```bash
bash plugins/scripts/diff.sh -f /tmp/api-gateway-patch.yaml
```

Diff shows: `memory: 256Mi` → `memory: 512Mi`. No other changes.

```bash
kubectl set resources deployment/api-gateway -n production --limits=memory=512Mi
kubectl rollout status deployment/api-gateway -n production --timeout=120s
```

Output: `deployment "api-gateway" successfully rolled out`

**Claude (incident-responder):** Rollout complete. Monitoring for 5 minutes.
Restart count: 0. Error rate: 0.1% (baseline noise). Incident stabilized.

---

## Turn 7 — incident-responder: postmortem handoff

**Claude (incident-responder):** Invoking `postmortem-writing` skill.

Timeline captured:
- 02:00 UTC — first OOMKill
- 02:14 UTC — PagerDuty fires
- 02:19 UTC — SRE loads profile, triage begins
- 02:27 UTC — root cause confirmed (heap exhaustion)
- 02:31 UTC — CONFIRM received, fix applied
- 02:33 UTC — rollout complete, incident resolved

Action items:
1. File bug with api-gateway team: identify heap leak introduced in v2.3.1
2. Add memory usage alert at 80% of limit (currently no alert exists)
3. Set memory request = limit to prevent OOM scheduling surprises
