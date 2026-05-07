---
name: k8s-assistant
description: Front-facing entrypoint for any Kubernetes question or task. Classifies the request, announces the routing decision, and chains to the appropriate domain skill. Use this when you want automatic routing without knowing which skill to invoke.
---

# Skill: k8s-assistant

## When to use

Invoke this skill for any Kubernetes question or task when you do not want to
choose a domain skill yourself. It classifies the request and routes to the
right skill automatically.

Examples:
- "How many nodes is my cluster running?"
- "A pod is crash looping in production"
- "I need to write a Deployment manifest"
- "Audit our RBAC posture"
- "We're releasing v2.4.0 — is the rollout safe?"
- "Design a CRD for a backup controller"

## Step 1: Classify the request

Read the user's question or task. Match it to exactly one domain from the
routing table below. If it spans multiple domains, classify it as
**multi-domain**.

### Routing table

| Domain | Signals | Skill to invoke |
|---|---|---|
| Cluster health | nodes, pods, events, PVCs, HPAs, "check cluster", "what's running" | `cluster-audit` |
| Active incident | "crash loop", "OOMKill", "not ready", "service down", pod stuck | `pod-failure-triage` or `node-pressure-debug` |
| Manifests / Helm / Kustomize | "write a manifest", "deployment yaml", "helm chart", "kustomize overlay" | `manifest-authoring` or `helm-kustomize` |
| RBAC / Policies / Secrets | "audit rbac", "network policy", "secret hygiene", "OPA", "Kyverno" | `rbac-design` or `policy-enforcement` |
| Rollouts / Releases | "deploy", "canary", "blue/green", "rollback", "release v" | `release-strategy` or `rollout-risk-assessment` |
| Operators / CRDs / Controllers | "operator", "controller", "CRD", "reconciler", "webhook" | `operator-development` or `crd-design-review` |
| Observability | "latency", "error rate", "logs", "metrics", "alert", "dashboard" | `observability-investigation` |
| Capacity / Scaling | "rightsize", "HPA", "VPA", "node pool", "resource limits", "cost" | `capacity-planning` |
| Multi-domain / Ambiguous | spans domains, unclear, architectural | `task-decomposition` |

**Tiebreaker:** If the request mentions an active failure, always prefer the
incident domain over health or release domains.

## Step 2: Announce the route

Before invoking anything, output exactly one line to the user:

```
Routing to <domain> → `<skill>` (<one-phrase reason>)
```

Examples:
- `Routing to Cluster health → cluster-audit (node count query)`
- `Routing to Active incident → pod-failure-triage (CrashLoopBackOff reported)`
- `Routing to Multi-domain → task-decomposition (spans release + observability)`

## Step 3: Invoke the skill

Use the Skill tool to invoke the skill identified in Step 1. Pass the user's
original question or task verbatim as the argument so the target skill has
full context.

## Step 4: Surface results

Present the outcome to the user in plain language. If the target skill produced
structured output (audit report, diff, plan), present it in full. If the user
needs to take a follow-up action (confirm a mutation, load a profile), state
that clearly.

## Guardrail reminder

This skill is read-only. It classifies and routes — it does not run kubectl,
apply manifests, or make any cluster changes. All mutations are handled by the
downstream skill and its agent, which enforce their own guardrail tier.
