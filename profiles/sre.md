# Profile: SRE

## Purpose

Operate, debug, scale, and maintain Kubernetes clusters and the workloads running
on them. Own cluster health, incident response, capacity, and reliability.

## Default agents

- `cluster-sre` — steady-state operations and audit
- `incident-responder` — active failure triage and remediation
- `capacity-planner` — scaling and resource modeling
- `release-manager` — rollout safety and progressive delivery
- `architect` — engage for complex multi-system changes

## Allowed skills

- `cluster-audit`
- `pod-failure-triage`
- `node-pressure-debug`
- `observability-investigation`
- `rollout-risk-assessment`
- `capacity-planning`
- `postmortem-writing`
- `architecture-plan`
- `task-decomposition`

## Preferred tools

- kubectl MCP (controlled-write for cluster ops; privileged for incident response)
- Prometheus MCP (metrics queries)
- Grafana MCP (dashboards and alerts)
- Loki MCP (log queries)
- Cloud Provider MCP (node pools, infra)

## Guardrail tier

**controlled-write** for steady-state operations.
**privileged** during active incidents — incident-responder agent is authorized.

## Activation

Tell Claude: `Load the SRE profile` or start a session with:
> "I am on-call SRE. There is an active incident. Load the SRE profile."
