# k8s-superagents Gap Closure Design

**Date:** 2026-05-07
**Status:** Approved

## Overview

Four gaps identified in the initial repo review. This spec covers the design
for closing all four in a single implementation cycle.

---

## Gap 1: MCP Server Wiring (npx)

### Problem

`plugins/mcp/*.json` files are capability descriptors, not runnable MCP server
configs. Claude Code cannot connect to any real cluster or observability stack.

### Design

Add a `mcpServers` block to `.claude/settings.json`. Each server runs via
`npx -y <package>` — no install step required, npx fetches on first use.

**Servers:**

| Name | Package | Required env vars |
|---|---|---|
| `kubernetes` | `@modelcontextprotocol/server-kubernetes` | `KUBECONFIG` |
| `prometheus` | `@parity/mcp-server-prometheus` | `PROMETHEUS_URL`, `PROMETHEUS_TOKEN` |
| `grafana` | `@grafana/mcp-server` | `GRAFANA_URL`, `GRAFANA_TOKEN` |
| `loki` | `mcp-server-loki` | `LOKI_URL`, `LOKI_TOKEN` |

**Settings structure:**

```json
{
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

The existing `plugins/mcp/*.json` files remain as capability reference docs —
they describe what each server can do, which agents use it, and what guardrail
tier applies to each operation.

---

## Gap 2: Script Wiring

### Problem

`plugins/scripts/*.sh` are solid read-only inspection scripts but agents have
no knowledge of them. Agents declare `tools: Bash, Read` but never use the
scripts.

### Design

**Agent prompt changes** — add a "Cluster inspection scripts" section to each
relevant agent:

| Agent | Scripts referenced |
|---|---|
| `cluster-sre` | `audit.sh`, `cluster-reader.sh` |
| `incident-responder` | `cluster-reader.sh`, `log-fetcher.sh` |
| `capacity-planner` | `cluster-reader.sh` (top-pods, top-nodes, hpa) |
| `manifest-engineer` | `diff.sh` |

Section template added to each agent:

```markdown
## Cluster inspection scripts

Prefer these read-only scripts over raw kubectl for routine inspection:
- `plugins/scripts/audit.sh` — full cluster health snapshot (nodes, pods,
  events, HPAs, PVCs, RBAC)
- `plugins/scripts/cluster-reader.sh <cmd>` — targeted reads: nodes, pods,
  top-pods, top-nodes, events, hpa, pvc, endpoints
- `plugins/scripts/log-fetcher.sh` — structured log retrieval
- `plugins/scripts/diff.sh` — kubectl diff wrapper

Run with: `bash plugins/scripts/<script>.sh <args>`
```

**Settings change** — add script allow entry to `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(kubectl *)",
      "Bash(bash plugins/scripts/*)"
    ]
  }
}
```

---

## Gap 3: Multi-turn Examples

### Problem

Existing examples show single-session walkthroughs. There are no examples of
multi-agent handoffs, escalation chains, or `CONFIRM:` gates across turns.

### Design

Two new example files:

**`examples/incident-escalation.md`**

Scenario: OOMKill on api-gateway → cluster-sre detects → incident-responder
remediates → postmortem follows.

Turn structure:
1. User reports restarts, loads SRE profile
2. cluster-sre runs `audit.sh`, finds high-restart pods
3. cluster-sre reads logs via `log-fetcher.sh`, identifies OOMKill
4. cluster-sre hands off to incident-responder
5. incident-responder proposes memory limit increase, waits for `CONFIRM:`
6. User confirms: `CONFIRM: increase api-gateway memory limit to 384Mi`
7. incident-responder applies fix, verifies rollout stability
8. incident-responder invokes `postmortem-writing` skill

**`examples/release-with-canary.md`**

Scenario: v2.4.0 of payments-api has a DB migration — needs sequenced canary.

Turn structure:
1. User: "Release v2.4.0 of payments-api to production"
2. release-manager invokes `rollout-risk-assessment`, finds DB migration
3. release-manager escalates to architect for migration sequencing
4. architect produces phased plan: migrate → canary 10% → monitor SLIs → full
5. release-manager applies canary, watches SLIs via `observability-investigation`
6. SLIs clean → release-manager promotes to 100%, confirms with user

---

## Gap 4: Profile Auto-Activation

### Problem

The session-start hook injects the entry-point SKILL.md but does not activate
any profile. Users must explicitly say "Load the SRE profile" every session.

### Design

Extend `hooks/session-start` with:

1. **Env-var check with assistant as default**

```bash
PROFILE="${K8S_PROFILE:-assistant}"
profile_content=$(cat "${PLUGIN_ROOT}/profiles/${PROFILE}.md" 2>/dev/null \
  || cat "${PLUGIN_ROOT}/profiles/assistant.md")
```

2. **Profile content injected alongside the entry-point skill**

The hook injects a second `<system-reminder>` block containing the active
profile content. Claude enters every session with both the routing skill and
the active profile already loaded.

**User experience:**

| Scenario | Result |
|---|---|
| No `K8S_PROFILE` set | assistant profile loads silently; k8s-assistant routing active from turn 1 |
| `export K8S_PROFILE=sre` in shell | SRE profile auto-loads every session |
| `export K8S_PROFILE=developer` | Developer profile auto-loads |
| Mid-session override | "Load the architect profile" still works as before |

**Valid values for `K8S_PROFILE`:** `assistant`, `sre`, `kubernetes-developer`,
`architect`, `security-engineer`, `release-engineer`

No changes to `hooks/hooks.json` — the existing `SessionStart` entry already
runs the script.

---

## Files Changed

| File | Change |
|---|---|
| `.claude/settings.json` | Add `mcpServers` block + `Bash(bash plugins/scripts/*)` allow |
| `.claude/agents/cluster-sre.md` | Add cluster inspection scripts section |
| `.claude/agents/incident-responder.md` | Add cluster inspection scripts section |
| `.claude/agents/capacity-planner.md` | Add cluster inspection scripts section |
| `.claude/agents/manifest-engineer.md` | Add diff.sh reference |
| `hooks/session-start` | Add env-var profile detection + profile injection |
| `examples/incident-escalation.md` | New multi-turn incident example |
| `examples/release-with-canary.md` | New multi-turn release example |
