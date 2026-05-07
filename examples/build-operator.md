# Example: Build a Kubernetes Operator

**Profile:** Kubernetes Developer
**Agents:** architect → operator-developer → manifest-engineer → release-manager

## Scenario

Build an operator that provisions PostgreSQL databases on demand via a `Database` CRD.
When a `Database` CR is created, the operator creates a StatefulSet, Service, and Secret.

## Session walkthrough

### Step 1: Load the developer profile

```
Load the Kubernetes Developer profile.
```

### Step 2: Engage the Architect

```
I need to build a Kubernetes operator that provisions PostgreSQL databases.
Teams should be able to create a Database CR and get a running Postgres instance.
```

The Architect will produce a phased plan:
1. Architect: design the CRD schema
2. Operator Developer: scaffold and implement the controller
3. Manifest Engineer: write RBAC, Helm chart
4. Release Manager: assess rollout for staging

### Step 3: CRD design (operator-developer + crd-design-review skill)

The agent will define:
```go
type DatabaseSpec struct {
    Version    string `json:"version"`
    StorageGB  int    `json:"storageGB"`
    Replicas   int    `json:"replicas,omitempty"`
}
type DatabaseStatus struct {
    Phase      string             `json:"phase"`
    Endpoint   string             `json:"endpoint,omitempty"`
    Conditions []metav1.Condition `json:"conditions,omitempty"`
}
```

### Step 4: Implement the reconciler

The operator-developer agent scaffolds the project and implements:
- Create/update StatefulSet with Postgres image
- Create/update Service (ClusterIP)
- Create Secret with generated password
- Set `status.endpoint` and `status.phase`

### Step 5: Manifest authoring

The manifest-engineer agent produces:
- `config/rbac/` — Role with permissions for StatefulSets, Services, Secrets
- `charts/database-operator/` — Helm chart with values for image, replicas

### Step 6: Local testing

```bash
make install && make run
kubectl apply -f config/samples/database_v1alpha1.yaml
kubectl describe database my-db
```

### Step 7: Rollout assessment

The release-manager uses `rollout-risk-assessment` before staging deploy.
Risk: Medium (new CRD, stateful workloads). Strategy: rolling update with readiness gate.
