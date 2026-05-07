# Kubernetes Superagents — Design Spec

**Date:** 2026-05-06
**Status:** Approved

---

## Goal

Build a Claude Code plugin that acts as a virtual Kubernetes engineering organization — covering the Developer, SRE, Architect, Security Engineer, and Release Engineer roles — through a layered system of profiles, agents, skills, plugins, playbooks, and guardrails.

---

## Mental Model

```
Human-ish capability = Role + Judgment + Workflow + Tools + Memory + Guardrails
```

| Layer | What it is | Example |
|---|---|---|
| **Profile** | Role intent + permitted agents + permitted skills + guardrail tier | `sre.md` |
| **Agent** | Responsibility owner with a focused cognitive scope | `incident-responder.md` |
| **Skill** | Repeatable cognitive workflow (when, inputs, steps, tools, output, safety) | `pod-failure-triage/SKILL.md` |
| **Playbook** | Step-by-step runbook a skill references for known scenarios | `sre/pod-crashloop.md` |
| **Plugin/MCP** | Raw capability the agent can physically invoke | `kubectl.json` |
| **Guardrail** | Permission boundary — what must be confirmed or refused | `controlled-write.md` |

The organizing principle: **organize by human capability, not technology**.

- Bad: `kubectl/`, `helm/`, `yaml/`, `prometheus/`
- Good: `design`, `build`, `observe`, `debug`, `scale`, `secure`, `recover`

---

## Platform

Claude Code only. This repo is a Claude Code project — `.claude/agents/` and `.claude/skills/` are loaded automatically. Profiles are activated by referencing them in the conversation or CLAUDE.md.

---

## Profiles

Profiles are the human-facing entry points. Each profile defines:
- Purpose (what role this activates)
- Default agents (which agents are in scope)
- Allowed skills (which cognitive workflows apply)
- Preferred tools/MCP servers
- Guardrail tier (readonly / controlled-write / privileged)

| Profile | Agents | Guardrail Tier |
|---|---|---|
| `kubernetes-developer` | architect, operator-developer, manifest-engineer, release-manager | controlled-write (to local/kind only) |
| `sre` | cluster-sre, incident-responder, capacity-planner, release-manager | controlled-write (cluster), privileged (drain/delete) |
| `architect` | architect | readonly |
| `security-engineer` | security-auditor, architect | readonly + controlled-write for policy |
| `release-engineer` | release-manager, cluster-sre, architect | controlled-write |

---

## Agents

Agents are responsibility owners. Each agent owns a domain and has a clear scope of what it does and does not do.

### Architect
**When:** Any complex, ambiguous, or multi-agent task.
**Responsibilities:** Clarify goal, assess complexity, decompose into phases, assign agent/skill combinations, define validation gates and rollback strategy, produce a structured execution plan.
**Tools:** Read, Glob, Grep, WebSearch (planning only — no cluster mutation)
**Output format:** Goal → Assumptions → Architecture → Phased plan → Agent routing → Risks → Validation → Rollback → Next action

### Operator Developer
**When:** Building controllers, operators, CRDs, admission webhooks.
**Responsibilities:** Scaffold controller-runtime projects, implement reconcile loops, design CRD schemas, write unit and integration tests.
**Tools:** Filesystem, Shell, GitHub MCP, kubectl (readonly, against kind/local)

### Manifest Engineer
**When:** Authoring or reviewing Kubernetes YAML, Helm charts, Kustomize overlays, RBAC manifests.
**Responsibilities:** Write correct, minimal, well-structured manifests; validate before apply; lint and dry-run.
**Tools:** Filesystem, Shell, kubectl MCP (dry-run), Helm

### Cluster SRE
**When:** Steady-state cluster operations — auditing health, checking workload state, capacity review.
**Responsibilities:** Full cluster audit, resource utilization review, workload health check, identifying drift.
**Tools:** kubectl MCP (read + controlled write), Prometheus, Grafana, Loki

### Incident Responder
**When:** Active failure — pod crashes, node pressure, service degradation.
**Responsibilities:** Triage with blast-radius reasoning, identify root cause, remediate safely, document timeline.
**Tools:** kubectl MCP (controlled write + privileged with confirmation), Prometheus, Loki

### Capacity Planner
**When:** Scaling decisions, resource modeling, cost optimization.
**Responsibilities:** Analyze current utilization, model future demand, recommend HPA/VPA/KEDA config, estimate node pool changes.
**Tools:** Prometheus MCP, kubectl MCP (readonly), Cloud Provider MCP

### Security Auditor
**When:** RBAC review, policy enforcement, secret hygiene, compliance checks.
**Responsibilities:** Audit permissions, review PSA/OPA/Kyverno policies, identify overprivileged service accounts, check secret exposure.
**Tools:** kubectl MCP (readonly), GitHub MCP, Filesystem

### Release Manager
**When:** Planning and executing rollouts, promotions, rollbacks.
**Responsibilities:** Assess rollout risk, choose strategy (canary/blue-green/rolling), monitor during rollout, execute rollback if thresholds breached.
**Tools:** kubectl MCP (controlled write), Prometheus MCP, GitHub MCP

---

## Skills

Skills are repeatable cognitive workflows. Every skill answers:
1. When should I use this?
2. What inputs do I need?
3. What steps do I follow?
4. What tools may I use?
5. What output should I produce?
6. What safety checks are required?

### Architect Skills
| Skill | Purpose |
|---|---|
| `architecture-plan` | Produce a structured engineering plan for complex tasks |
| `task-decomposition` | Break ambiguous goals into phases with agent/skill routing |

### Developer Skills
| Skill | Purpose |
|---|---|
| `operator-development` | Scaffold and implement controller-runtime operators |
| `crd-design-review` | Design and review CRD schemas, versioning, validation |
| `controller-runtime-debug` | Debug reconcile loops, watches, and event handling |
| `manifest-authoring` | Write correct, minimal Kubernetes manifests |
| `helm-kustomize` | Structure Helm charts and Kustomize overlays |

### SRE Skills
| Skill | Purpose |
|---|---|
| `cluster-audit` | Holistic cluster health assessment |
| `pod-failure-triage` | Diagnose pod failures (crashloop, OOMKill, eviction) |
| `node-pressure-debug` | Debug node pressure conditions (memory, disk, PID) |
| `observability-investigation` | Correlate metrics, logs, and events to find root cause |
| `capacity-planning` | Model resource demand, recommend scaling config |
| `postmortem-writing` | Write structured postmortems after incidents |

### Security Skills
| Skill | Purpose |
|---|---|
| `rbac-design` | Design minimal-privilege RBAC for workloads and humans |
| `policy-enforcement` | Write and audit OPA/Kyverno/PSA policies |

### Release Skills
| Skill | Purpose |
|---|---|
| `release-strategy` | Choose and execute canary, blue-green, or rolling strategy |

### Shared Skills (cross-role)
| Skill | Purpose |
|---|---|
| `rollout-risk-assessment` | Assess risk of a proposed change before applying |

---

## Plugins / MCP

Capabilities are split into two tiers:

**MCP servers (controlled, structured)** — used for write operations and critical reads:

| Config | Capabilities |
|---|---|
| `kubectl.json` | apply, delete, scale, patch, rollout restart, get, describe |
| `github.json` | issues, PRs, code review, file content |
| `prometheus.json` | PromQL queries, alert state |
| `grafana.json` | dashboards, alert rules |
| `loki.json` | log queries, log streaming |
| `cloud-provider.json` | GCP/AWS/Azure node pools, IAM, networking |

**Bash scripts** (read-only/diagnostic) live in `plugins/scripts/` and are invoked directly for fast inspection tasks. The directory tree includes `plugins/scripts/` alongside `plugins/mcp/`.

---

## Guardrails

Three permission tiers, each defined as a markdown file agents reference:

| Tier | File | What it permits |
|---|---|---|
| **Readonly** | `guardrails/readonly.md` | get, describe, list, logs, events — no confirmation needed |
| **Controlled write** | `guardrails/controlled-write.md` | apply, scale, patch, rollout restart — requires showing the diff and user confirmation |
| **Privileged** | `guardrails/privileged.md` | delete, drain, cordon, force — requires explicit typed confirmation + reason |

Guardrails are referenced in agent files and enforced by the agent's system prompt. No agent bypasses its tier without explicit profile escalation.

---

## Playbooks

Playbooks are step-by-step operational runbooks that skills reference for known failure patterns. They are not skills — they don't define how to think, they define what to do in a specific known scenario.

```
playbooks/
  sre/
    pod-crashloop.md         ← CrashLoopBackOff triage steps
    node-not-ready.md        ← node condition debugging
    oom-kill.md              ← OOMKill analysis and remediation
  developer/
    scaffold-operator.md     ← operator-sdk / kubebuilder setup steps
    crd-lifecycle.md         ← CRD versioning and conversion webhook steps
  architect/
    platform-feature-design.md  ← template for designing a new platform capability
  security/
    rbac-audit.md            ← systematic RBAC audit procedure
    secret-hygiene.md        ← secret scanning and rotation checklist
```

---

## Directory Structure

```
superagents/
├── CLAUDE.md
├── README.md
│
├── profiles/
│   ├── kubernetes-developer.md
│   ├── sre.md
│   ├── architect.md
│   ├── security-engineer.md
│   └── release-engineer.md
│
├── .claude/
│   ├── agents/
│   │   ├── architect.md
│   │   ├── operator-developer.md
│   │   ├── manifest-engineer.md
│   │   ├── cluster-sre.md
│   │   ├── incident-responder.md
│   │   ├── capacity-planner.md
│   │   ├── security-auditor.md
│   │   └── release-manager.md
│   │
│   └── skills/
│       ├── architecture-plan/SKILL.md
│       ├── task-decomposition/SKILL.md
│       ├── operator-development/SKILL.md
│       ├── crd-design-review/SKILL.md
│       ├── controller-runtime-debug/SKILL.md
│       ├── manifest-authoring/SKILL.md
│       ├── helm-kustomize/SKILL.md
│       ├── cluster-audit/SKILL.md
│       ├── pod-failure-triage/SKILL.md
│       ├── node-pressure-debug/SKILL.md
│       ├── observability-investigation/SKILL.md
│       ├── capacity-planning/SKILL.md
│       ├── postmortem-writing/SKILL.md
│       ├── rollout-risk-assessment/SKILL.md
│       ├── rbac-design/SKILL.md
│       ├── policy-enforcement/SKILL.md
│       └── release-strategy/SKILL.md
│
├── plugins/
│   ├── mcp/
│   │   ├── kubectl.json
│   │   ├── github.json
│   │   ├── prometheus.json
│   │   ├── grafana.json
│   │   ├── loki.json
│   │   └── cloud-provider.json
│   └── scripts/
│       ├── cluster-reader.sh      ← get, describe, list (read-only)
│       ├── log-fetcher.sh         ← pod/container/event logs
│       ├── audit.sh               ← cluster-wide health snapshot
│       └── diff.sh                ← kubectl diff wrapper
│
├── guardrails/
│   ├── readonly.md
│   ├── controlled-write.md
│   └── privileged.md
│
├── playbooks/
│   ├── sre/
│   │   ├── pod-crashloop.md
│   │   ├── node-not-ready.md
│   │   └── oom-kill.md
│   ├── developer/
│   │   ├── scaffold-operator.md
│   │   └── crd-lifecycle.md
│   ├── architect/
│   │   └── platform-feature-design.md
│   └── security/
│       ├── rbac-audit.md
│       └── secret-hygiene.md
│
├── docs/
│   └── design/
│       └── 2026-05-06-k8s-superagents-design.md
│
└── examples/
    ├── build-operator.md
    ├── debug-crashloop.md
    ├── audit-cluster.md
    └── design-platform-feature.md
```

---

## Design Principles

1. **Organize by capability, not technology** — the structure reflects what an engineer does, not what tool they use
2. **Agents own responsibility, not tools** — an agent's identity comes from its domain, not the CLI it calls
3. **Skills encode experience** — every skill is a transferable cognitive workflow, not a one-off script
4. **Guardrails are explicit** — permission tiers are named, documented, and referenced in agent prompts; never implicit
5. **Playbooks handle the known** — skills handle the unknown (how to think); playbooks handle the known (what to do in this specific situation)
6. **The Architect decides** — for any non-trivial task, the Architect agent runs first, decomposes, and routes; other agents execute
