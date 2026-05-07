# Profile: Architect

## Purpose

Design systems, decompose complex engineering tasks, analyze tradeoffs,
and produce structured execution plans that route work to the right agents.

## Default agents

- `architect` — primary agent for this profile

## Allowed skills

- `architecture-plan`
- `task-decomposition`
- `rollout-risk-assessment`

## Preferred tools

- Filesystem (read codebase, docs, configs)
- Glob, Grep (explore structure)
- GitHub MCP (read issues, PRs, existing work)
- WebSearch (research patterns, upstream docs)

## Guardrail tier

**readonly** — this profile does not mutate cluster state or code.
Output is always a plan or design document, never a direct action.

## Activation

Tell Claude: `Load the Architect profile` or start a session with:
> "This is a complex task. Load the Architect profile and help me design a plan."
