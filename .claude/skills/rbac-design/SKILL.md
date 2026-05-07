---
name: rbac-design
description: Design minimal-privilege Kubernetes RBAC for workloads and human users. Covers Role vs ClusterRole selection, binding scope, service account design, and audit of existing permissions.
---

# Skill: RBAC Design

## When to use

When creating service accounts for new workloads, designing human access for a team,
auditing existing RBAC for over-privilege, or responding to a security finding.

## Inputs needed

- Who or what needs access? (workload service account, CI system, human user/group)
- What do they need to do? (list the operations, not the role name)
- Which namespaces are in scope?

## Design principles

1. **Start from zero** — list the exact API groups, resources, and verbs needed. Do not copy an existing broad role.
2. **Namespace scope by default** — use `Role` + `RoleBinding`, not `ClusterRole` + `ClusterRoleBinding`, unless cross-namespace access is genuinely needed.
3. **One service account per workload** — never share a service account between workloads.
4. **No wildcards** — `verbs: ["*"]` and `resources: ["*"]` are never acceptable in production.

## RBAC for a workload (example)

An operator that manages ConfigMaps and reads Secrets in its own namespace:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: myoperator
  namespace: myoperator-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: myoperator-role
  namespace: myoperator-system
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: myoperator-rolebinding
  namespace: myoperator-system
subjects:
  - kind: ServiceAccount
    name: myoperator
    namespace: myoperator-system
roleRef:
  kind: Role
  name: myoperator-role
  apiGroup: rbac.authorization.k8s.io
```

## RBAC audit sequence

```bash
# Who has cluster-admin?
kubectl get clusterrolebindings -o json | \
  jq '.items[] | select(.roleRef.name=="cluster-admin") | {name: .metadata.name, subjects: .subjects}'

# What can a specific service account do?
kubectl auth can-i --list --as=system:serviceaccount:<ns>:<sa-name>

# Is any workload using the default service account?
kubectl get pods -A -o json | jq '.items[] | select(.spec.serviceAccountName=="default" or (.spec.serviceAccountName==null)) | "\(.metadata.namespace)/\(.metadata.name)"'
```

## Output

- RBAC manifests (ServiceAccount, Role/ClusterRole, Binding)
- Audit findings with severity if reviewing existing RBAC
- Passing `kubectl apply --dry-run=server`

## Safety checks

- Never grant `escalate` or `bind` verbs — these allow privilege escalation
- Never bind to `system:` service accounts
- All ClusterRoleBindings require security-engineer or architect sign-off
