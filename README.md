# k8s-superagent

A Claude Code plugin that acts as a virtual Kubernetes engineering organization —
giving you a Developer, SRE, Architect, Security Engineer, and Release Engineer
on demand, each with their own agents, skills, and guardrails.

## Installation

### Option 1: Plugin marketplace (recommended)

Install via the Claude Code plugin marketplace using the GitHub shorthand:

```
/plugin marketplace add kumarabd/superagents
```

Once installed, the plugin is active in every new session automatically.

**To update after new releases:**
```
/plugin update k8s-superagent
```

### Option 2: Manual (settings.json)

Add to `~/.claude/settings.json` for user-wide installation, or `.claude/settings.json` for a single project:

```json
{
  "extraKnownMarketplaces": {
    "kumarabd-superagents": {
      "source": {
        "source": "github",
        "repo": "kumarabd/superagents"
      }
    }
  },
  "enabledPlugins": {
    "k8s-superagent@kumarabd-superagents": true
  }
}
```

### Option 3: Clone locally

If you want to modify the plugin or use it without a GitHub remote:

```bash
git clone https://github.com/kumarabd/superagents
cd superagents
```

Claude Code will load `CLAUDE.md` automatically when you work from this directory.

## Requirements

- Claude Code
- `kubectl` configured against your target cluster
- MCP servers configured per `plugins/mcp/` for observability (Prometheus, Grafana, Loki) and cloud infra — optional but recommended for SRE and incident workflows

## Getting started

The fastest way to get started is the `k8s-assistant` skill — a front-facing entrypoint that automatically routes any Kubernetes question or task to the right specialist skill, no profile knowledge required.

**Invoke per question:**
```
/k8s-assistant how many nodes is my cluster running?
```

**Or load the assistant profile for the whole session:**
```
Load the assistant profile.
```

Once the assistant profile is active, just describe your task naturally. It classifies the request, announces its routing decision, and invokes the appropriate domain skill:

```
A pod is crash looping in the payments namespace.
```
```
I need to write a Deployment manifest for a stateless API.
```
```
Audit our RBAC posture before the security review.
```

For complex or multi-domain tasks, it routes to `task-decomposition` which breaks the work into phases before any implementation begins.

## Usage

If you already know which role you need, you can load a domain profile directly for full access to that profile's agent roster and tools:

```
Load the SRE profile.
```
```
Load the Kubernetes Developer profile.
```

This bypasses the assistant routing layer and gives you the full specialist context directly.

## Profiles

| Profile | What it does | Primary agents |
|---|---|---|
| `assistant` | Front-facing entrypoint — routes any question to the right domain skill automatically | routes via `k8s-assistant` skill |
| `kubernetes-developer` | Build operators, controllers, CRDs, manifests, Helm charts | architect, operator-developer, manifest-engineer, release-manager |
| `sre` | Audit clusters, debug failures, manage scaling, write postmortems | cluster-sre, incident-responder, capacity-planner |
| `architect` | Design systems, decompose complex tasks, produce phased plans | architect |
| `security-engineer` | Audit RBAC, enforce admission policies, review secret handling | security-auditor |
| `release-engineer` | Plan rollouts, manage promotions, execute rollbacks | release-manager, cluster-sre |

## Agents

| Agent | Responsibility |
|---|---|
| `architect` | Decompose complex tasks, produce phased plans, route to other agents |
| `operator-developer` | Build controllers, operators, CRDs, admission webhooks |
| `manifest-engineer` | Author and validate Kubernetes YAML, Helm charts, Kustomize |
| `cluster-sre` | Steady-state cluster ops — audit, health, utilization |
| `incident-responder` | Active incident triage and remediation |
| `capacity-planner` | Resource modeling, HPA/VPA config, node pool sizing |
| `security-auditor` | RBAC audit, admission policy review, secret hygiene |
| `release-manager` | Rollout strategy, progressive delivery, rollback |

## Guardrail tiers

Every agent operates within an explicit permission tier. No agent bypasses its tier.

| Tier | What it permits |
|---|---|
| `readonly` | get, describe, list, logs, events — no confirmation needed |
| `controlled-write` | apply, scale, patch — requires showing diff and user confirmation |
| `privileged` | delete, drain, cordon — requires typed `CONFIRM: <reason>` |

## Repository structure

```
.claude-plugin/      → plugin manifest (makes this installable via /add-plugin)
hooks/               → session-start hook (injects context into every session)
skills/              → plugin entry-point skill (using-k8s-superagent)
profiles/            → role definitions (agents + skills + guardrail tier per role)
.claude/agents/      → sub-agents Claude Code can spawn
skills/              → cognitive workflows (how to think about each problem class)
plugins/mcp/         → MCP server connection configs
plugins/scripts/     → read-only Bash scripts for cluster inspection
guardrails/          → permission tier definitions
playbooks/           → step-by-step runbooks for known scenarios
examples/            → end-to-end worked examples
docs/                → design specs and architecture docs
```

## Examples

See `examples/` for end-to-end walkthroughs:

- [`build-operator.md`](examples/build-operator.md) — build a controller from scratch
- [`debug-crashloop.md`](examples/debug-crashloop.md) — triage a CrashLoopBackOff incident
- [`audit-cluster.md`](examples/audit-cluster.md) — run a weekly cluster health audit
- [`design-platform-feature.md`](examples/design-platform-feature.md) — architect a multi-tenant platform feature
