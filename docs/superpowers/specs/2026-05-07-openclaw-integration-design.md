# OpenClaw Integration Design

**Date:** 2026-05-07
**Status:** Approved

## Summary

Add OpenClaw harness support to k8s-superagents as a two-phase change:

1. **Phase 1 — Skills centralization:** Move `.claude/skills/` to `skills/` at the repo root, making skill content framework-agnostic.
2. **Phase 2 — OpenClaw plugin:** Add `.openclaw/` with a manifest, package.json, and TypeScript entry point exposing a single `k8s_superagent` routing tool.

---

## Phase 1 — Skills centralization

### What changes

All skill content moves from `.claude/skills/` to `skills/` at the repo root, sitting alongside the existing Superpowers entry point `skills/using-k8s-superagent/`.

### What stays

`.claude/agents/` is Claude Code-native and does not move. `.claude/settings.json` stays. Only the `skills/` subdirectory moves.

### File moves

| From | To |
|---|---|
| `.claude/skills/architecture-plan/` | `skills/architecture-plan/` |
| `.claude/skills/capacity-planning/` | `skills/capacity-planning/` |
| `.claude/skills/cluster-audit/` | `skills/cluster-audit/` |
| `.claude/skills/controller-runtime-debug/` | `skills/controller-runtime-debug/` |
| `.claude/skills/crd-design-review/` | `skills/crd-design-review/` |
| `.claude/skills/helm-kustomize/` | `skills/helm-kustomize/` |
| `.claude/skills/k8s-assistant/` | `skills/k8s-assistant/` |
| `.claude/skills/manifest-authoring/` | `skills/manifest-authoring/` |
| `.claude/skills/node-pressure-debug/` | `skills/node-pressure-debug/` |
| `.claude/skills/observability-investigation/` | `skills/observability-investigation/` |
| `.claude/skills/operator-development/` | `skills/operator-development/` |
| `.claude/skills/pod-failure-triage/` | `skills/pod-failure-triage/` |
| `.claude/skills/policy-enforcement/` | `skills/policy-enforcement/` |
| `.claude/skills/postmortem-writing/` | `skills/postmortem-writing/` |
| `.claude/skills/rbac-design/` | `skills/rbac-design/` |
| `.claude/skills/release-strategy/` | `skills/release-strategy/` |
| `.claude/skills/rollout-risk-assessment/` | `skills/rollout-risk-assessment/` |
| `.claude/skills/task-decomposition/` | `skills/task-decomposition/` |

### Reference updates

`skills/using-k8s-superagent/SKILL.md` — update the skill path reference:

```
- `${PLUGIN_ROOT}/.claude/skills/<skill-name>/SKILL.md`
+ `${PLUGIN_ROOT}/skills/<skill-name>/SKILL.md`
```

`CLAUDE.md` — update the structure table entry for `.claude/skills/` to `skills/`.

### Why this does not break Claude Code

Claude Code does not natively auto-load `.claude/skills/`. Agents read skill files explicitly via `${PLUGIN_ROOT}` paths. Updating the one path reference in `using-k8s-superagent/SKILL.md` is the only change required for Claude Code to continue working.

### Bonus effect

Superpowers scans `skills/` for registered skills. Moving domain skills there makes them directly invocable via the `Skill` tool (e.g. `pod-failure-triage`, `rbac-design`) without needing to go through an agent first.

---

## Phase 2 — OpenClaw plugin

### File structure

```
.openclaw/
├── openclaw.plugin.json
├── package.json
└── index.ts
```

### `.openclaw/openclaw.plugin.json`

```json
{
  "id": "k8s-superagent",
  "name": "Kubernetes Superagent",
  "description": "Virtual Kubernetes engineering org — Developer, SRE, Architect, Security, and Release Engineer profiles with skills and guardrails.",
  "contracts": {
    "tools": ["k8s_superagent"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

### `.openclaw/package.json`

```json
{
  "name": "@k8s-superagent/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    }
  }
}
```

### `.openclaw/index.ts`

Single exported `definePluginEntry` with one registered tool: `k8s_superagent`.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | yes | The Kubernetes question or task |
| `profile` | string | no | One of: developer, sre, architect, security, release |
| `confirm` | string | no | `"CONFIRM: <reason>"` — required for privileged operations |

**Routing table** — keyword/intent matching maps query to skill:

| Query keywords | Skill |
|---|---|
| crashloop, pending, evicted, OOMKill, ImagePullBackOff | `pod-failure-triage` |
| node pressure, NotReady, disk pressure, PID pressure | `node-pressure-debug` |
| rbac, role, permission, serviceaccount, clusterrole | `rbac-design` |
| canary, rollout, blue-green, progressive delivery | `release-strategy` |
| hpa, vpa, resource, sizing, capacity | `capacity-planning` |
| operator, controller, CRD, webhook, reconcile | `operator-development` |
| helm, kustomize, chart, overlay, values | `helm-kustomize` |
| manifest, deployment, statefulset, service, configmap | `manifest-authoring` |
| audit, health, utilization, drift | `cluster-audit` |
| metrics, latency, logs, loki, prometheus, grafana | `observability-investigation` |
| policy, kyverno, opa, gatekeeper, admission | `policy-enforcement` |
| postmortem, incident, timeline | `postmortem-writing` |
| architecture, design, plan, decompose | `architecture-plan` |
| task, phase, breakdown | `task-decomposition` |
| CRD schema, version, field naming | `crd-design-review` |
| controller-runtime, reconciler, requeue, watch | `controller-runtime-debug` |
| rollout risk, blast radius, change risk | `rollout-risk-assessment` |

Matching is first-match-wins, evaluated top-to-bottom in the routing table. If no keyword matches, load the profile file for the declared role, or `profiles/assistant.md` if no profile is set.

**Guardrail enforcement:**

Write/destructive intent is detected from query keywords: `delete`, `patch`, `apply`, `drain`, `cordon`, `restart`, `scale`, `force`.

| Tier | Trigger | Behaviour |
|---|---|---|
| `readonly` | No write keywords | Return skill content directly |
| `controlled-write` | Write keywords present | Prefix response with diff/plan prompt; append `CONFIRM: required` |
| `privileged` | Destructive keywords + `confirm` param absent | Return gate message only; block skill content |
| `privileged` | Destructive keywords + valid `confirm` param | Return skill content |

**Path resolution:**

`PLUGIN_ROOT` is resolved as `resolve(__dirname, "..")` — one level up from `.openclaw/`. All reads use `PLUGIN_ROOT` to locate `skills/`, `profiles/`, and `guardrails/`, making the plugin location-independent after installation.

### What the tool does NOT do

- Does not execute `kubectl` or shell commands — it is a knowledge router, not an executor
- Does not maintain session state between calls
- Does not read from `.claude/` — only from `skills/`, `profiles/`, `guardrails/`

---

## Directory layout after both phases

```
k8s-superagents/
├── .claude/
│   ├── agents/           ← unchanged (Claude-native)
│   └── settings.json     ← unchanged
├── .openclaw/            ← new
│   ├── openclaw.plugin.json
│   ├── package.json
│   └── index.ts
├── skills/               ← expanded (was only using-k8s-superagent/)
│   ├── using-k8s-superagent/
│   ├── pod-failure-triage/
│   ├── rbac-design/
│   └── ... (all 18 skills)
├── profiles/             ← unchanged
├── guardrails/           ← unchanged
├── playbooks/            ← unchanged
└── plugins/              ← unchanged
```
