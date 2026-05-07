# Kubernetes Superagents

A Claude Code project that acts as a virtual Kubernetes engineering organization.

## Roles

| Profile | What it does |
|---|---|
| `kubernetes-developer` | Build operators, controllers, CRDs, manifests, Helm charts |
| `sre` | Audit clusters, debug failures, manage scaling, write postmortems |
| `architect` | Design systems, decompose complex tasks, route to the right agents |
| `security-engineer` | Audit RBAC, enforce policies, review secret handling |
| `release-engineer` | Plan rollouts, manage promotions, execute rollbacks |

## Quick start

1. Open this repo in Claude Code
2. Tell Claude which role to activate: `Load the SRE profile`
3. Describe your task — the Architect agent will engage first if it's complex

## Requirements

- Claude Code
- `kubectl` configured against your target cluster
- MCP servers configured per `plugins/mcp/` (kubectl, prometheus, etc.)

## Structure

```
profiles/        → role entry points
.claude/agents/  → sub-agents (responsibility owners)
.claude/skills/  → cognitive workflows
plugins/mcp/     → MCP server configs
plugins/scripts/ → read-only cluster inspection scripts
guardrails/      → permission tiers
playbooks/       → step-by-step runbooks
examples/        → end-to-end worked examples
```
