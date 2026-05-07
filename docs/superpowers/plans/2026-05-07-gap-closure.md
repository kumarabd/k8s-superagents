# Gap Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close four gaps in the k8s-superagents plugin: wire real npx MCP servers, reference bash scripts in agent prompts, add multi-turn examples, and auto-activate the assistant profile at session start.

**Architecture:** All changes are additive — existing files gain new sections or config blocks. No new directories. The session-start hook gains env-var logic. Agent prompts gain a scripts section. Settings gains mcpServers. Two new example files are created.

**Tech Stack:** Bash, JSON (Claude Code settings), Markdown

**Spec:** `docs/superpowers/specs/2026-05-07-gap-closure-design.md`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `.claude/settings.json` | Modify | Add `mcpServers` block + `Bash(bash plugins/scripts/*)` allow |
| `.claude/agents/cluster-sre.md` | Modify | Add cluster inspection scripts section |
| `.claude/agents/incident-responder.md` | Modify | Add cluster inspection scripts section |
| `.claude/agents/capacity-planner.md` | Modify | Add cluster inspection scripts section |
| `.claude/agents/manifest-engineer.md` | Modify | Add diff.sh reference section |
| `hooks/session-start` | Modify | Add K8S_PROFILE detection + profile injection |
| `examples/incident-escalation.md` | Create | Multi-turn OOMKill incident example |
| `examples/release-with-canary.md` | Create | Multi-turn canary release example |

---

## Task 1: Wire MCP Servers in settings.json

**Files:**
- Modify: `.claude/settings.json`

- [ ] **Step 1: Validate npm package names exist**

Run each to confirm the packages resolve (ctrl-c after "found" or first line of output):

```bash
npm show @modelcontextprotocol/server-kubernetes version 2>/dev/null || echo "NOT FOUND"
npm show @parity/mcp-server-prometheus version 2>/dev/null || echo "NOT FOUND"
npm show @grafana/mcp-server version 2>/dev/null || echo "NOT FOUND"
npm show mcp-server-loki version 2>/dev/null || echo "NOT FOUND"
```

For any package that prints `NOT FOUND`, search for the correct name:

```bash
npm search mcp prometheus --json | python3 -c "import json,sys; [print(p['name']) for p in json.load(sys.stdin)[:5]]"
npm search mcp grafana --json | python3 -c "import json,sys; [print(p['name']) for p in json.load(sys.stdin)[:5]]"
npm search mcp loki --json | python3 -c "import json,sys; [print(p['name']) for p in json.load(sys.stdin)[:5]]"
```

Use the confirmed package names in Step 2.

- [ ] **Step 2: Rewrite .claude/settings.json**

Replace the entire file with the following (substituting confirmed package names):

```json
{
  "permissions": {
    "allow": [
      "Bash(kubectl *)",
      "Bash(bash plugins/scripts/*)"
    ]
  },
  "mcpServers": {
    "kubernetes": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-kubernetes"],
      "env": {
        "KUBECONFIG": "${KUBECONFIG}"
      }
    },
    "prometheus": {
      "command": "npx",
      "args": ["-y", "@parity/mcp-server-prometheus"],
      "env": {
        "PROMETHEUS_URL": "${PROMETHEUS_URL}",
        "PROMETHEUS_TOKEN": "${PROMETHEUS_TOKEN}"
      }
    },
    "grafana": {
      "command": "npx",
      "args": ["-y", "@grafana/mcp-server"],
      "env": {
        "GRAFANA_URL": "${GRAFANA_URL}",
        "GRAFANA_TOKEN": "${GRAFANA_TOKEN}"
      }
    },
    "loki": {
      "command": "npx",
      "args": ["-y", "mcp-server-loki"],
      "env": {
        "LOKI_URL": "${LOKI_URL}",
        "LOKI_TOKEN": "${LOKI_TOKEN}"
      }
    }
  }
}
```

- [ ] **Step 3: Validate JSON**

```bash
python3 -m json.tool .claude/settings.json > /dev/null && echo "JSON valid"
```

Expected: `JSON valid`

- [ ] **Step 4: Commit**

```bash
git add .claude/settings.json
git commit -m "feat: wire npx MCP servers and allow script execution in settings"
```

---

## Task 2: Add Script Section to cluster-sre Agent

**Files:**
- Modify: `.claude/agents/cluster-sre.md`

- [ ] **Step 1: Append the cluster inspection scripts section**

Add the following block at the end of `.claude/agents/cluster-sre.md` (after the "What you do not do" section):

```markdown

## Cluster inspection scripts

Prefer these read-only scripts over raw kubectl for routine inspection:
- `plugins/scripts/audit.sh` — full cluster health snapshot (nodes, pods, events, HPAs, PVCs, cluster-admin bindings). Run before any audit.
- `plugins/scripts/cluster-reader.sh <cmd>` — targeted reads: `nodes`, `pods [ns]`, `top-pods`, `top-nodes`, `events [ns]`, `hpa`, `pvc`, `endpoints`

Run with:
```bash
bash plugins/scripts/audit.sh
bash plugins/scripts/cluster-reader.sh top-pods
bash plugins/scripts/cluster-reader.sh events production
```
```

- [ ] **Step 2: Verify file structure**

```bash
grep -n "Cluster inspection scripts" .claude/agents/cluster-sre.md
```

Expected: one match at the end of the file.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/cluster-sre.md
git commit -m "feat: reference cluster inspection scripts in cluster-sre agent"
```

---

## Task 3: Add Script Section to incident-responder Agent

**Files:**
- Modify: `.claude/agents/incident-responder.md`

- [ ] **Step 1: Append the cluster inspection scripts section**

Add the following block at the end of `.claude/agents/incident-responder.md` (after the "Handoff after incident" section):

```markdown

## Cluster inspection scripts

Use these read-only scripts for fast triage — they are faster than composing raw kubectl chains:
- `plugins/scripts/cluster-reader.sh events [ns]` — recent warning events (scoped or cluster-wide)
- `plugins/scripts/cluster-reader.sh pods [ns]` — pod state with node placement
- `plugins/scripts/log-fetcher.sh <pod> <namespace> [--previous] [--tail N] [--grep PATTERN]` — structured log retrieval with previous-container support

Run with:
```bash
bash plugins/scripts/cluster-reader.sh events production
bash plugins/scripts/cluster-reader.sh pods production
bash plugins/scripts/log-fetcher.sh api-gateway production --previous --tail 200 --grep "OOM\|Error\|panic"
```
```

- [ ] **Step 2: Verify file structure**

```bash
grep -n "Cluster inspection scripts" .claude/agents/incident-responder.md
```

Expected: one match at the end of the file.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/incident-responder.md
git commit -m "feat: reference cluster inspection scripts in incident-responder agent"
```

---

## Task 4: Add Script Section to capacity-planner Agent

**Files:**
- Modify: `.claude/agents/capacity-planner.md`

- [ ] **Step 1: Append the cluster inspection scripts section**

Add the following block at the end of `.claude/agents/capacity-planner.md` (after the "What you do not do" section):

```markdown

## Cluster inspection scripts

Use these for the utilization data-gathering phase — faster and more consistent than raw kubectl:
- `plugins/scripts/cluster-reader.sh top-pods` — all pod CPU/memory sorted by memory
- `plugins/scripts/cluster-reader.sh top-nodes` — node resource usage
- `plugins/scripts/cluster-reader.sh hpa` — all HPAs with current/desired/max replicas

Run with:
```bash
bash plugins/scripts/cluster-reader.sh top-pods
bash plugins/scripts/cluster-reader.sh top-nodes
bash plugins/scripts/cluster-reader.sh hpa
```
```

- [ ] **Step 2: Verify file structure**

```bash
grep -n "Cluster inspection scripts" .claude/agents/capacity-planner.md
```

Expected: one match at the end of the file.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/capacity-planner.md
git commit -m "feat: reference cluster inspection scripts in capacity-planner agent"
```

---

## Task 5: Add Script Section to manifest-engineer Agent

**Files:**
- Modify: `.claude/agents/manifest-engineer.md`

- [ ] **Step 1: Append the diff script section**

Add the following block at the end of `.claude/agents/manifest-engineer.md` (after the "What you do not do" section):

```markdown

## Diff script

Always use the diff script instead of raw `kubectl diff` — it adds colored output and a clear summary:

```bash
# Diff a manifest file
bash plugins/scripts/diff.sh -f path/to/manifest.yaml

# Diff a Kustomize directory
bash plugins/scripts/diff.sh -k overlays/production

# Diff a Helm release (requires helm-diff plugin)
bash plugins/scripts/diff.sh -r my-release production
```

Run `bash plugins/scripts/diff.sh` with no args to see usage.
```

- [ ] **Step 2: Verify file structure**

```bash
grep -n "Diff script" .claude/agents/manifest-engineer.md
```

Expected: one match at the end of the file.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/manifest-engineer.md
git commit -m "feat: reference diff script in manifest-engineer agent"
```

---

## Task 6: Profile Auto-Activation in session-start Hook

**Files:**
- Modify: `hooks/session-start`

- [ ] **Step 1: Rewrite the session-start script**

Replace the entire contents of `hooks/session-start` with:

```bash
#!/usr/bin/env bash
# SessionStart hook for k8s-superagent plugin
# Injects entry-point skill + active profile into every Claude Code session.
# Set K8S_PROFILE env var to auto-load a role profile (default: assistant).
# Valid values: assistant, sre, kubernetes-developer, architect,
#               security-engineer, release-engineer

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Determine active profile
PROFILE="${K8S_PROFILE:-assistant}"
profile_file="${PLUGIN_ROOT}/profiles/${PROFILE}.md"
if [ ! -f "$profile_file" ]; then
  profile_file="${PLUGIN_ROOT}/profiles/assistant.md"
  PROFILE="assistant"
fi
profile_content=$(cat "$profile_file")

# Read the entry-point skill
skill_content=$(cat "${PLUGIN_ROOT}/skills/using-k8s-superagent/SKILL.md" 2>&1 || echo "Error reading k8s-superagent skill")
# Replace ${PLUGIN_ROOT} placeholder with actual path
skill_content="${skill_content//\$\{PLUGIN_ROOT\}/${PLUGIN_ROOT}}"

# Escape for JSON embedding
escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

skill_escaped=$(escape_for_json "$skill_content")
profile_escaped=$(escape_for_json "$profile_content")

context="<system-reminder>\nk8s-superagent is installed. When the user mentions Kubernetes work or asks to load a profile, use the information below.\n\n${skill_escaped}\n</system-reminder>\n\n<system-reminder>\nActive profile: ${PROFILE}\n\n${profile_escaped}\n</system-reminder>"

# Emit in the format the current platform expects
if [ -n "${CURSOR_PLUGIN_ROOT:-}" ]; then
    printf '{\n  "additional_context": "%s"\n}\n' "$context"
elif [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -z "${COPILOT_CLI:-}" ]; then
    printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$context"
else
    printf '{\n  "additionalContext": "%s"\n}\n' "$context"
fi

exit 0
```

- [ ] **Step 2: Verify syntax**

```bash
bash -n hooks/session-start && echo "Syntax OK"
```

Expected: `Syntax OK`

- [ ] **Step 3: Smoke-test with default profile**

```bash
bash hooks/session-start 2>/dev/null | python3 -m json.tool > /dev/null && echo "JSON output valid"
```

Expected: `JSON output valid`

- [ ] **Step 4: Smoke-test with env-var override**

```bash
K8S_PROFILE=sre bash hooks/session-start 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
# Find the additionalContext in whichever key it appears
text = str(data)
assert 'Active profile: sre' in text, 'sre profile not injected'
print('sre profile injection OK')
"
```

Expected: `sre profile injection OK`

- [ ] **Step 5: Smoke-test invalid profile falls back to assistant**

```bash
K8S_PROFILE=nonexistent bash hooks/session-start 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
text = str(data)
assert 'Active profile: assistant' in text, 'fallback to assistant failed'
print('fallback to assistant OK')
"
```

Expected: `fallback to assistant OK`

- [ ] **Step 6: Commit**

```bash
git add hooks/session-start
git commit -m "feat: auto-activate profile via K8S_PROFILE env var with assistant default"
```

---

## Task 7: Multi-turn Example — Incident Escalation

**Files:**
- Create: `examples/incident-escalation.md`

- [ ] **Step 1: Create the example file**

Create `examples/incident-escalation.md` with the following content:

```markdown
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
```

- [ ] **Step 2: Verify file was created**

```bash
wc -l examples/incident-escalation.md
```

Expected: 100+ lines.

- [ ] **Step 3: Commit**

```bash
git add examples/incident-escalation.md
git commit -m "docs: add multi-turn incident escalation example"
```

---

## Task 8: Multi-turn Example — Release with Canary

**Files:**
- Create: `examples/release-with-canary.md`

- [ ] **Step 1: Create the example file**

Create `examples/release-with-canary.md` with the following content:

```markdown
# Example: Release with Canary — DB Migration + Progressive Delivery

**Profile:** Release Engineer
**Agents:** release-manager → architect → release-manager
**Skills:** rollout-risk-assessment → architecture-plan → release-strategy → observability-investigation
**Playbook:** playbooks/architect/platform-feature-design.md

## Scenario

payments-api v2.4.0 is ready to promote from staging to production. The diff
includes a Flyway DB migration that adds a NOT NULL column to the `transactions`
table (50M rows). Release engineer loads the release profile.

---

## Turn 1 — User initiates release

```
Load the release engineer profile. Release payments-api v2.4.0 to production.
Image is payments-api:v2.4.0, currently running v2.3.8 in production.
```

**Claude (release-manager):** Release Engineer profile active. Controlled-write
tier. Starting `rollout-risk-assessment` skill before touching anything.

---

## Turn 2 — release-manager: risk assessment

```bash
kubectl diff -f deployments/payments-api/production.yaml
```

Diff output includes image tag change and a new init-container: `flyway-migrate`.

**Claude (release-manager):** Risk assessment flags a DB migration:
- NOT NULL column on 50M-row table
- Migration runs in an init-container before the new pods start
- If migration fails mid-run, old pods are still serving but the schema is
  partially applied — this is a rollback hazard

Risk level: **HIGH**. Escalating to architect for migration sequencing before
proceeding with the rollout.

---

## Turn 3 — architect: phased plan

**Claude (architect):** Using `architecture-plan` skill.

Recommended sequence:

**Phase 1 — Migration (zero-downtime):**
Run the migration as a standalone Job with `backfill_default=''` first. This
makes the column nullable-compatible. Old pods continue serving. Takes ~8 min
at 50M rows with a batch size of 10k.

**Phase 2 — Canary 10%:**
Deploy v2.4.0 to 10% of pods (2 of 20 replicas). Migration is already done
so init-container is a no-op. Monitor error rate and p99 latency for 15 min.

**Phase 3 — Full rollout:**
If SLIs are clean, promote to 100%.

**Phase 4 — NOT NULL enforcement (next release):**
Once all pods on v2.4.0, add a separate migration to add the NOT NULL
constraint. Ship as v2.4.1.

Handing back to release-manager to execute.

---

## Turn 4 — release-manager: run migration Job

**Claude (release-manager):** Applying migration Job. Controlled-write — showing
diff first.

```bash
bash plugins/scripts/diff.sh -f jobs/payments-api-migrate-v2.4.0.yaml
```

Diff: new Job resource, no existing resources changed.

Awaiting confirmation to apply the migration Job.

---

## Turn 5 — User confirms migration

```
Confirmed — run the migration job.
```

**Claude (release-manager):**

```bash
kubectl apply -f jobs/payments-api-migrate-v2.4.0.yaml -n production
kubectl wait --for=condition=complete job/payments-api-migrate-v2.4.0 \
  -n production --timeout=600s
```

Output: `job.batch/payments-api-migrate-v2.4.0 condition met`

Migration complete in 7m 42s. Proceeding to canary.

---

## Turn 6 — release-manager: canary 10%

```bash
kubectl scale deployment/payments-api -n production --replicas=2
kubectl set image deployment/payments-api -n production \
  payments-api=payments-api:v2.4.0
kubectl rollout status deployment/payments-api -n production --timeout=120s
```

**Claude (release-manager):** 2 canary pods running v2.4.0. 18 pods still on
v2.3.8. Invoking `observability-investigation` skill to monitor SLIs for 15
minutes.

---

## Turn 7 — release-manager: SLI monitoring

Using Prometheus MCP:

```
rate(http_requests_total{app="payments-api",status=~"5.."}[5m]) /
rate(http_requests_total{app="payments-api"}[5m])
```

Result after 15 min:
- Error rate: 0.04% (baseline: 0.03%) — within tolerance
- p99 latency: 142ms (baseline: 138ms) — within tolerance
- No circuit-breaker trips on downstream services

**Claude (release-manager):** SLIs clean. Ready to promote to 100%.
Awaiting confirmation.

---

## Turn 8 — User confirms full rollout

```
Confirmed — promote to 100%.
```

**Claude (release-manager):**

```bash
kubectl scale deployment/payments-api -n production --replicas=20
kubectl rollout status deployment/payments-api -n production --timeout=300s
```

Output: `deployment "payments-api" successfully rolled out`

All 20 pods on v2.4.0. Release complete.

Next step: schedule v2.4.1 to add the NOT NULL constraint once traffic is
stable for 24 hours.
```

- [ ] **Step 2: Verify file was created**

```bash
wc -l examples/release-with-canary.md
```

Expected: 120+ lines.

- [ ] **Step 3: Commit**

```bash
git add examples/release-with-canary.md
git commit -m "docs: add multi-turn canary release example with DB migration sequencing"
```

---

## Final Verification

- [ ] **Confirm all 8 files changed**

```bash
git log --oneline -8
```

Expected: 8 commits, each matching a task above.

- [ ] **Confirm settings.json is valid JSON**

```bash
python3 -m json.tool .claude/settings.json > /dev/null && echo "OK"
```

- [ ] **Confirm hook still runs cleanly**

```bash
bash hooks/session-start 2>/dev/null | python3 -m json.tool > /dev/null && echo "Hook output valid"
```

- [ ] **Confirm all agent script sections are present**

```bash
grep -l "Cluster inspection scripts\|Diff script" .claude/agents/*.md
```

Expected: 4 files — cluster-sre.md, incident-responder.md, capacity-planner.md, manifest-engineer.md
