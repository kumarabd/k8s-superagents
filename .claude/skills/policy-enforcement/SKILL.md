---
name: policy-enforcement
description: Write and audit Kubernetes admission policies using Kyverno, OPA/Gatekeeper, or Pod Security Admission. Covers policy design, testing, and graduated enforcement.
---

# Skill: Policy Enforcement

## When to use

When enforcing cluster-wide security or operational standards via admission control:
preventing privileged pods, requiring resource limits, enforcing label conventions,
or blocking insecure configurations.

## Inputs needed

- What must be enforced? (the rule in plain English)
- Which namespaces or workloads are in scope?
- Is this audit-only or enforcing? (start with audit)
- What is the exception process?

## Enforcement ladder (always follow this order)

1. **Audit** — log violations, do not block. Run for at least one week.
2. **Warn** — return a warning, do not block. Gives teams time to fix.
3. **Enforce** — block non-compliant resources.

Never jump to enforce on existing clusters without the audit phase.

## Kyverno policy example: require resource limits

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-resource-limits
spec:
  validationFailureAction: Audit  # start here, move to Enforce after audit phase
  background: true
  rules:
    - name: check-container-limits
      match:
        any:
          - resources:
              kinds: [Pod]
      validate:
        message: "CPU and memory limits are required on all containers."
        pattern:
          spec:
            containers:
              - resources:
                  limits:
                    cpu: "?*"
                    memory: "?*"
```

## OPA/Gatekeeper constraint template example: no latest image

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: nolatesttag
spec:
  crd:
    spec:
      names:
        kind: NoLatestTag
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package nolatesttag
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          endswith(container.image, ":latest")
          msg := sprintf("Container %v uses :latest tag", [container.name])
        }
```

## Pod Security Admission (built-in, no CRD)

```bash
# Label a namespace for restricted policy
kubectl label namespace myns pod-security.kubernetes.io/enforce=restricted
kubectl label namespace myns pod-security.kubernetes.io/warn=restricted
kubectl label namespace myns pod-security.kubernetes.io/audit=restricted
```

Levels: `privileged` (no restrictions) → `baseline` (no privileged) → `restricted` (secure defaults)

## Audit existing violations

```bash
# Kyverno
kubectl get policyreport -A
kubectl get clusterpolicyreport

# OPA/Gatekeeper
kubectl get constraints -A
```

## Output

- Policy manifest (Kyverno or OPA) in audit mode
- Audit findings from existing cluster
- Enforcement timeline recommendation

## Safety checks

- Always start in audit mode and review findings with the affected teams
- Provide a clear exception process before enforcing
- Test policies against existing workloads with `kubectl apply --dry-run=server` before applying
