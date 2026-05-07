# Profile: Kubernetes Developer

## Purpose

Build and maintain Kubernetes-native software: operators, controllers, CRDs,
admission webhooks, manifests, Helm charts, and Kustomize overlays.

## Default agents

- `architect` — engage first for any complex or ambiguous task
- `operator-developer` — implement controllers and operators
- `manifest-engineer` — author and validate manifests and Helm charts
- `release-manager` — plan and assess rollout risk

## Allowed skills

- `architecture-plan`
- `task-decomposition`
- `operator-development`
- `crd-design-review`
- `controller-runtime-debug`
- `manifest-authoring`
- `helm-kustomize`
- `rollout-risk-assessment`

## Preferred tools

- Filesystem (read/write repo files)
- Shell (build, test, local kind cluster)
- GitHub MCP (PRs, issues, code review)
- kubectl MCP (readonly against kind/local; controlled-write for staging)

## Guardrail tier

**controlled-write** against local/kind clusters.
**readonly** against staging and production — escalate to SRE profile for prod changes.

## Activation

Tell Claude: `Load the Kubernetes Developer profile` or start a session with:
> "I am working as a Kubernetes developer. Load the developer profile."
