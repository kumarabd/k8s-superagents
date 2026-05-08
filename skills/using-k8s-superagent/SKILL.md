# k8s-superagent

You have a virtual Kubernetes engineering organization installed. It provides
role-based profiles, specialized sub-agents, cognitive skills, guardrails,
playbooks, and MCP plugin configs for Kubernetes work.

## How to activate

The user tells you which role they are working in. When they do, read the
matching profile file from the plugin and activate it:

| What the user says | Profile to load |
|---|---|
| "I'm a developer" / "Load the developer profile" | `${PLUGIN_ROOT}/profiles/kubernetes-developer.md` |
| "I'm SRE" / "Load the SRE profile" | `${PLUGIN_ROOT}/profiles/sre.md` |
| "Load the architect profile" | `${PLUGIN_ROOT}/profiles/architect.md` |
| "I'm a security engineer" | `${PLUGIN_ROOT}/profiles/security-engineer.md` |
| "Load the release engineer profile" | `${PLUGIN_ROOT}/profiles/release-engineer.md` |

When a profile is activated:
1. Read the profile file — it defines the permitted agents, skills, tools, and guardrail tier
2. Announce which profile is active and which agents are in scope
3. For any complex or ambiguous task, engage the **architect** agent first

## Available agents

These sub-agents are available in any session once a profile is activated:

| Agent | Responsibility |
|---|---|
| `architect` | Decompose complex tasks, produce phased plans, route to other agents |
| `operator-developer` | Build controllers, operators, CRDs, admission webhooks |
| `manifest-engineer` | Author and validate Kubernetes YAML, Helm charts, Kustomize |
| `cluster-sre` | Steady-state cluster ops — audit, health, utilization |
| `incident-responder` | Active incident triage and remediation |
| `capacity-planner` | Resource modeling, HPA/VPA config, node pool sizing |
| `security-auditor` | RBAC audit, admission policy review, secret hygiene |
| `release-manager` | Rollout strategy, progressive delivery, rollback |

## Guardrail tiers

Every agent operates within a permission tier. Never violate the tier without the
user explicitly escalating the profile:

- **readonly** — inspect only, no confirmation needed
- **controlled-write** — show diff/plan, require confirmation before mutating
- **privileged** — typed `CONFIRM: <reason>` required before destructive ops

## Skills available

Skills are cognitive workflows agents use. Each skill is at:
`${PLUGIN_ROOT}/skills/<skill-name>/SKILL.md`

Read the relevant skill before starting a class of work. Key skills by domain:

**Architect:** `architecture-plan`, `task-decomposition`
**Developer:** `operator-development`, `crd-design-review`, `controller-runtime-debug`, `manifest-authoring`, `helm-kustomize`
**SRE:** `cluster-audit`, `pod-failure-triage`, `node-pressure-debug`, `observability-investigation`, `capacity-planning`, `postmortem-writing`
**Security:** `rbac-design`, `policy-enforcement`
**Release:** `release-strategy`, `rollout-risk-assessment`

## Playbooks

Step-by-step runbooks for known scenarios are at:
`${PLUGIN_ROOT}/playbooks/<role>/<scenario>.md`

## The Architect rule

For any task that is complex, ambiguous, cross-cutting, or risky:
**always engage the architect agent first.** It will produce a phased plan
before any implementation begins.
