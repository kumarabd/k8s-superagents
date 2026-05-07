# Example: Design a Platform Feature

**Profile:** Architect
**Agents:** architect
**Skills:** architecture-plan + task-decomposition
**Playbook:** playbooks/architect/platform-feature-design.md

## Scenario

The platform team needs to add multi-tenancy to the cluster: each team gets an isolated
namespace with resource quotas, RBAC, and network policies automatically provisioned
when a `Tenant` CR is created.

## Session walkthrough

### Step 1: Load the Architect profile

```
Load the Architect profile. I need to design a multi-tenancy system for our cluster.
Each engineering team should get an isolated namespace automatically.
```

### Step 2: Architect clarifies the goal

One question: "Should tenants be isolated only from each other, or also from the platform system namespace?"

Answer: "Isolated from each other. Platform components in `kube-system` and `platform-system` are trusted."

### Step 3: Architecture plan output

```
Goal:
Automatically provision isolated namespaces with quotas, RBAC, and network policies
when a Tenant CR is created.

Assumptions:
- Network isolation is namespace-scoped (NetworkPolicy, not separate node pools)
- RBAC: each team gets admin in their namespace, no cross-namespace access
- Quotas: configurable per tenant, with platform-level defaults

Architecture:
A namespace-provisioning operator watches Tenant CRs and reconciles a namespace,
ResourceQuota, LimitRange, RoleBinding, and NetworkPolicy for each tenant.
The operator uses a ClusterRole to manage these resources cluster-wide.

Phased plan:
1. CRD design — Agent: operator-developer | Skill: crd-design-review
   Output: Tenant CRD schema with spec (quotas, team, labels) and status (phase, conditions)

2. Controller implementation — Agent: operator-developer | Skill: operator-development
   Output: working controller with envtest tests, managing Namespace + RBAC + Quota + NetworkPolicy

3. RBAC and manifests — Agent: manifest-engineer + security-auditor | Skill: rbac-design + manifest-authoring
   Output: minimal ClusterRole for the operator, Helm chart

4. Security review — Agent: security-auditor | Skill: policy-enforcement
   Output: Kyverno policy ensuring tenants cannot escalate beyond their namespace

5. Staging rollout — Agent: release-manager | Skill: rollout-risk-assessment + release-strategy
   Output: staged rollout with validation gates

Risks:
- Operator ClusterRole is broad by necessity — security-auditor must review
- Existing namespaces not managed by the operator — migration plan needed

Validation gates:
- After phase 2: create 3 test tenants on kind cluster, verify isolation
- After phase 4: security-auditor approves RBAC and policies
- After phase 5: 1 week on staging before production

Rollback:
- Phases 1-3: delete CRD and controller, namespaces remain (safe)
- Phase 5: rollout undo; tenant namespaces are not deleted automatically

Next concrete action:
operator-developer begins CRD design using crd-design-review skill
```
