---
name: crd-design-review
description: Design and review CRD schemas — field naming, validation rules, versioning strategy, status conditions, and printer columns. Use before implementing any new CRD.
---

# Skill: CRD Design Review

## When to use

Before finalizing any CRD schema — new CRDs, adding fields to existing CRDs,
or planning a version bump.

## Inputs needed

- What the CR represents (what does it provision or manage?)
- Fields the user wants to expose
- Target Kubernetes version (affects CEL validation availability)
- Existing CRD version if doing a migration

## Steps

### 1. Review field naming

- Use camelCase for all field names
- Distinguish spec (desired state) from status (observed state) strictly — never put observed data in spec
- Boolean fields: prefer `disabled: true` over `enabled: false` (avoids zero-value confusion)
- Avoid abbreviations unless they are standard k8s conventions (e.g., `replicas`, `selector`)

### 2. Validate the spec/status split

```yaml
spec:
  # Only user-controlled desired state
  replicas: 3
  image: myapp:v1.2

status:
  # Only controller-observed state
  readyReplicas: 2
  phase: Progressing
  conditions:
    - type: Ready
      status: "False"
      reason: Progressing
      message: "2/3 replicas ready"
```

### 3. Define status conditions

Use standard condition format. Every CRD should have at minimum:
- `Ready` — is the resource fully reconciled?
- `Degraded` — is the resource in an error state?

### 4. Add CEL validation (k8s 1.25+)

```yaml
x-kubernetes-validations:
  - rule: "self.minReplicas <= self.replicas"
    message: "replicas must be >= minReplicas"
```

### 5. Plan versioning

- Start with `v1alpha1` for new CRDs
- `v1beta1` when the schema is stable but not yet GA
- `v1` requires a conversion webhook if the schema changes
- Never remove required fields in a minor version — mark deprecated with `+kubebuilder:deprecatedversion`

### 6. Add printer columns

```go
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
// +kubebuilder:printcolumn:name="Ready",type=string,JSONPath=`.status.conditions[?(@.type=='Ready')].status`
// +kubebuilder:printcolumn:name="Age",type=date,JSONPath=`.metadata.creationTimestamp`
```

## Output

- Reviewed schema with issues annotated
- Final Go type definitions with kubebuilder markers
- Versioning recommendation

## Safety checks

- No business logic in the CRD schema itself (that belongs in the controller)
- Status fields must never be settable by users (use `+kubebuilder:subresource:status`)
- All new required fields must have defaulting if adding to an existing CRD
