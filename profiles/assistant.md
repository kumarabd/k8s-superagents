# Profile: Assistant

## Purpose

Single conversational entrypoint for all Kubernetes questions and tasks.
Routes every request through the `k8s-assistant` skill, which classifies
and dispatches to the appropriate domain skill automatically.

Use this profile when you want to ask any Kubernetes question without
knowing which profile or skill to load.

## How it works

Every question or task in this session is routed through the `k8s-assistant`
skill. The skill announces its routing decision transparently, then chains
to the appropriate domain skill (cluster-audit, pod-failure-triage,
manifest-authoring, etc.).

## Default behaviour

- Invoke the `k8s-assistant` skill for every user request
- Do not bypass routing by invoking domain skills directly
- Trust the routing decision — if it routes to `task-decomposition`, let it

## Guardrail tier

**readonly** — this profile never mutates cluster state directly.
Mutations flow through the dispatched domain skill and its agent,
which enforce their own guardrail tier (controlled-write or privileged).

## Activation

```
Load the assistant profile.
```

Or reference this file directly:

```
Read profiles/assistant.md and activate it.
```

## When to use a specific profile instead

Load a domain profile directly when you know the exact role you need and
want full access to that profile's agent roster and tools:

| Need | Load instead |
|---|---|
| Deep cluster operations | `Load the SRE profile` |
| Building operators or manifests | `Load the Kubernetes Developer profile` |
| Security audit | `Load the Security Engineer profile` |
| Release execution | `Load the Release Engineer profile` |
| Complex architecture design | `Load the Architect profile` |
