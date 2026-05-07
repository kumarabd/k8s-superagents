---
name: architecture-plan
description: Create a structured engineering plan for complex Kubernetes tasks before any implementation begins. Use when the task is ambiguous, cross-cutting, or involves multiple systems.
---

# Skill: Architecture Plan

## When to use

Use this skill when the task involves:
- More than one Kubernetes domain (e.g., operator + observability + RBAC)
- Changes to both application code and cluster infrastructure
- Unknown blast radius or unclear rollback path
- Work that will span multiple agents or sessions

Do NOT use for simple, single-domain tasks — just act.

## Inputs needed

- Goal: what is the desired end state?
- Constraints: deadlines, environments, cluster versions, existing tooling
- Current state: what exists today? (read the cluster/codebase first)
- Risk tolerance: production traffic? mission-critical workload?

## Steps

1. **Restate the goal** in one sentence to confirm understanding
2. **Identify domains involved** — list each Kubernetes area touched (compute, networking, storage, security, observability, etc.)
3. **Map dependencies** — which phases must complete before others can start?
4. **Assign phases** — each phase gets one responsible agent and one primary skill
5. **Define validation gates** — what must be true before proceeding to the next phase?
6. **Identify risks** — what could go wrong? What is the mitigation?
7. **Define rollback** — how do you undo each phase if it fails?
8. **Write the plan** using the output format below

## Tools you may use

- Read, Glob, Grep — to understand current state
- WebSearch — to research patterns or upstream constraints
- No cluster mutations during planning

## Output format

```
Goal:
<one sentence>

Assumptions:
- <what you are taking as given>

Architecture:
<2-3 sentences describing the approach and key design decisions>

Phased plan:
1. <Phase name> — Agent: <agent> | Skill: <skill> | Output: <deliverable>
2. ...

Risks:
- <risk>: <mitigation>

Validation gates:
- After phase N: <what to verify before proceeding>

Rollback:
<how to undo if something goes wrong at each phase>

Next concrete action:
<exactly what to do first>
```

## Safety checks

- Do not start any implementation until the plan is reviewed
- Flag any phase that requires privileged cluster access before work begins
- If a phase's rollback path is "unclear", that phase needs more design work
