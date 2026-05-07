# k8s-assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a front-facing routing skill that classifies any Kubernetes question or task and chains to the appropriate domain skill, plus a thin profile wrapper for session-level activation.

**Architecture:** A single `SKILL.md` file contains a routing table and step-by-step dispatch logic. When invoked, the skill classifies the request, announces the route in one line, and invokes the target skill via the Skill tool. A companion `profiles/assistant.md` loads the skill automatically for the whole session.

**Tech Stack:** Markdown skill files following the existing `.claude/skills/<name>/SKILL.md` pattern in this repo.

---

### Task 1: Create the `k8s-assistant` routing skill

**Files:**
- Create: `.claude/skills/k8s-assistant/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p .claude/skills/k8s-assistant
```

- [ ] **Step 2: Write `.claude/skills/k8s-assistant/SKILL.md`**

```markdown
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
```

- [ ] **Step 3: Verify the file exists and has correct frontmatter**

```bash
head -5 .claude/skills/k8s-assistant/SKILL.md
```

Expected output:
```
---
name: k8s-assistant
description: Front-facing entrypoint for any Kubernetes question or task...
---
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/k8s-assistant/SKILL.md
git commit -m "feat: add k8s-assistant routing skill"
```

---

### Task 2: Create the `assistant` profile wrapper

**Files:**
- Create: `profiles/assistant.md`

- [ ] **Step 1: Write `profiles/assistant.md`**

```markdown
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
```

- [ ] **Step 2: Verify the file exists**

```bash
head -5 profiles/assistant.md
```

Expected output:
```
# Profile: Assistant
```

- [ ] **Step 3: Commit**

```bash
git add profiles/assistant.md
git commit -m "feat: add assistant profile wrapper for k8s-assistant skill"
```

---

### Task 3: Smoke test

- [ ] **Step 1: Verify skill appears in the skill list**

Start a new Claude Code session in this repo and run:
```
/k8s-assistant how many nodes is my docker-desktop cluster running?
```

Expected: One routing announcement line, then `cluster-audit` skill executes.

- [ ] **Step 2: Verify profile activation works**

In a new session:
```
Load the assistant profile.
```
Then ask:
```
A pod is crash looping in the default namespace.
```

Expected: Routing announcement to `pod-failure-triage`, then triage begins.

- [ ] **Step 3: Verify multi-domain routing**

In a new session invoke `/k8s-assistant` with:
```
We need to redesign our RBAC and update our release pipeline at the same time.
```

Expected: Routes to `task-decomposition`.
