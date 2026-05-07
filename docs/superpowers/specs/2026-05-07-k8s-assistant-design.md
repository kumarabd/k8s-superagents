# Design: k8s-assistant — Kubernetes Entrypoint Skill

**Date:** 2026-05-07
**Status:** Approved

## Problem

Users working with the k8s-superagents repo must know which profile, agent, or skill to load before asking a Kubernetes question. This creates friction and leads to skills being skipped entirely. There is no single conversational entrypoint that handles routing automatically.

## Goal

A single invokable skill (`/k8s-assistant`) that classifies any Kubernetes question or task, announces its routing decision transparently, and chains to the appropriate domain skill. An optional thin profile wrapper (`profiles/assistant.md`) enables session-level activation so routing is automatic for the entire session.

## Artifacts

| Artifact | Path | Purpose |
|---|---|---|
| Routing skill | `.claude/skills/k8s-assistant` | Primary artifact — classifies, routes, chains |
| Profile wrapper | `profiles/assistant.md` | Optional session-level activation |

## Skill Design

### Invocation

```
/k8s-assistant
```

Or via the Skill tool with any Kubernetes question or task as the argument.

### Behavior

1. **Classify** the request into one of the domains below
2. **Announce** the route in one line (e.g., "Routing to SRE → `cluster-audit` skill (cluster health query)")
3. **Invoke** the appropriate skill via the Skill tool
4. **Surface** results back to the user in plain language

### Routing Table

| Domain | Trigger examples | Skill invoked |
|---|---|---|
| Cluster health, nodes, pods, events | "how many nodes", "what pods are failing", "check cluster health" | `cluster-audit` |
| Active incident | "pod is crash looping", "node not ready", "service is down" | `pod-failure-triage` or `node-pressure-debug` |
| Manifests, Helm, Kustomize | "write a deployment", "review this manifest", "structure helm chart" | `manifest-authoring` or `helm-kustomize` |
| RBAC, policies, secrets | "audit rbac", "write a network policy", "check secret hygiene" | `rbac-design` or `policy-enforcement` |
| Rollouts, releases | "deploy version 2.0", "canary rollout", "rollback" | `release-strategy` or `rollout-risk-assessment` |
| Operators, CRDs, controllers | "build a controller", "design a CRD", "debug reconciler" | `operator-development` or `crd-design-review` |
| Observability | "high latency", "error rate spike", "correlate logs and metrics" | `observability-investigation` |
| Capacity, scaling | "rightsize pods", "model HPA", "project node needs" | `capacity-planning` |
| Complex, ambiguous, multi-domain | spans multiple domains or unclear scope | `task-decomposition` → routes further |

### Transparency

Every routing decision is announced before the skill is invoked. The user always knows:
- Which domain the request was classified as
- Which skill is being invoked
- Why (one phrase)

### Guardrail tier

The `k8s-assistant` skill itself is **readonly** — it only classifies and routes. Mutations are handled by the downstream skill/agent with its own guardrail tier (controlled-write or privileged as appropriate).

## Profile Wrapper Design

`profiles/assistant.md` is a thin profile that:

- Declares the session default as the `k8s-assistant` skill entrypoint
- Sets **readonly** as the base guardrail tier
- Has no agents or tools of its own
- Elevates guardrail tier only when dispatching to a profile that requires it

### Activation

```
Load the assistant profile.
```

Once loaded, every question in the session is automatically routed through `k8s-assistant` without explicit invocation.

## What This Does Not Do

- The skill does not execute kubectl commands directly
- The skill does not make capacity or architecture decisions
- The profile does not override guardrail tiers of dispatched agents
- Neither artifact replaces the specialized profiles — they remain the authority for their domains
