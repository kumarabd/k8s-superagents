# Example: Cluster Health Audit

**Profile:** SRE
**Agents:** cluster-sre
**Skills:** cluster-audit
**Scripts:** plugins/scripts/audit.sh

## Scenario

Weekly cluster health review for the production cluster.

## Session walkthrough

### Step 1: Load the SRE profile

```
Load the SRE profile. I need to run the weekly cluster audit for production.
```

### Step 2: Run the audit script

```bash
./plugins/scripts/audit.sh > audit-2026-05-06.txt
```

### Step 3: cluster-sre reviews findings using cluster-audit skill

**Nodes:** 12 healthy, 0 warning
**Workloads:** 3 pods with high restart counts, 1 pending pod

**Finding [WARNING]: high restarts**
```
Pod: worker-7f4d2 (restarts: 12)
Namespace: batch-processing
```
→ Investigate with `pod-failure-triage` skill

**Finding [WARNING]: pending pod**
```
Pod: ml-trainer-0 (Pending)
Reason: "0/12 nodes are available: 12 Insufficient memory"
```
→ Investigate with `capacity-planning` skill

**Finding [INFO]: HPA at max replicas**
```
HPA: api-gateway — current: 10, max: 10 (hitting ceiling)
```
→ Recommend increasing max replicas or adding capacity

### Step 4: Produce audit report

The cluster-sre produces a structured report:

```
Cluster Audit Report — 2026-05-06 — production

NODES: 12 healthy
WORKLOADS: 3 degraded (high restarts), 1 pending

Priority actions:
1. [HIGH] Investigate worker-7f4d2 restarts — pod-failure-triage
2. [MEDIUM] ml-trainer-0 cannot schedule — increase node capacity or reduce requests
3. [LOW] api-gateway HPA at max — review scaling ceiling
```
