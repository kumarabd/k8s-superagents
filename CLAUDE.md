# Kubernetes Superagents

This repo is a virtual Kubernetes engineering organization for Claude Code.
It provides profiles, agents, skills, plugins, and guardrails for operating
as a Developer, SRE, Architect, Security Engineer, or Release Engineer.

## How to activate a profile

Tell Claude which role you want at the start of a session:

```
Load the SRE profile.
```

Or reference the profile file directly:

```
Read profiles/sre.md and activate it.
```

## Structure

| Directory | Purpose |
|---|---|
| `profiles/` | Role entry points — define agents, skills, tools, and guardrail tier |
| `.claude/agents/` | Sub-agents Claude can spawn, each owning a specific responsibility |
| `skills/` | Cognitive workflows — how to think about a class of problem (framework-agnostic) |
| `plugins/mcp/` | MCP server connection configs (structured capability layer) |
| `plugins/scripts/` | Read-only Bash scripts for fast cluster inspection |
| `guardrails/` | Permission tiers — what each agent tier can do without confirmation |
| `playbooks/` | Step-by-step runbooks for known failure patterns |
| `examples/` | End-to-end worked examples for common tasks |

## Guardrail tiers

All agents operate within one of three permission tiers defined in `guardrails/`.
Agents must reference their tier at the top of their system prompt and enforce it.

- **readonly** — inspect only, no confirmation needed
- **controlled-write** — show diff/plan, require confirmation before mutating
- **privileged** — typed confirmation + reason required before destructive ops

## Design principles

- Organize by capability, not technology
- Agents own responsibility, not tools
- Skills encode repeatable judgment
- The Architect agent runs first on complex tasks
- Playbooks handle the known; skills handle the unknown
