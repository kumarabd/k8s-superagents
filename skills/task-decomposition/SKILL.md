---
name: task-decomposition
description: Break a complex or ambiguous engineering request into concrete, agent-routable phases. Use before any multi-step implementation to prevent scope creep and missed dependencies.
---

# Skill: Task Decomposition

## When to use

Use when a request is:
- Vague ("improve our operator", "fix the cluster performance")
- Large ("build a full platform feature")
- Cross-cutting (touches developer, SRE, and security concerns)
- Risky (production changes, data migration, API breaks)

## Inputs needed

- The raw user request
- Current system state (read relevant code and cluster state first)
- Available agents in scope (check the active profile)

## Steps

1. **Clarify the goal** — if ambiguous, ask one focused question. Do not ask more than one.
2. **Identify the work units** — each unit is a thing that can be done by one agent with one skill
3. **Identify dependencies** — which units must complete before others start?
4. **Check for parallelism** — which units have no dependency and can run concurrently?
5. **Assign agent + skill** to each unit
6. **Estimate complexity** — simple (< 1 hour), medium (half day), complex (multi-day)
7. **Output the decomposition**

## Decomposition heuristics

- If a unit involves both writing code AND applying to a cluster, split it
- If a unit requires both a readonly and a write guardrail tier, split it
- If a unit touches both application logic AND infrastructure, split it
- Each unit should be completable and committable independently

## Output format

```
Original request: <restate>

Decomposed work units:

1. [Unit name]
   Agent: <agent>
   Skill: <skill>
   Depends on: <none | unit N>
   Can run parallel with: <none | units N, M>
   Complexity: simple / medium / complex
   Output: <what this unit produces>

2. ...

Suggested execution order:
Phase 1 (parallel): units N, M
Phase 2 (sequential): unit P (depends on N)
...

Open questions before starting:
- <any clarification still needed>
```

## Safety checks

- Every unit must have exactly one responsible agent
- No unit should span more than one guardrail tier
- If you cannot identify a rollback for a unit, mark it as requiring architect review
