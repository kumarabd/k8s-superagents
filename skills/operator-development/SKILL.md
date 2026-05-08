---
name: operator-development
description: Build Kubernetes operators using controller-runtime. Covers project scaffolding, reconcile loop design, error handling, requeue strategy, and testing with envtest.
---

# Skill: Operator Development

## When to use

When implementing a Kubernetes controller or operator: new operator from scratch,
adding a new controller to an existing operator, or extending reconcile logic.

## Inputs needed

- CRD schema (or use `crd-design-review` skill first if not yet designed)
- Target Kubernetes version
- Desired behavior: what should happen when a CR is created/updated/deleted?
- Any external systems the controller must interact with

## Steps

### 1. Scaffold the project

```bash
kubebuilder init --domain example.com --repo github.com/org/operator
kubebuilder create api --group apps --version v1alpha1 --kind MyResource
```

### 2. Design the reconcile loop

Before writing code, answer:
- What is the happy path? (resource created → reconciler runs → desired state achieved)
- What external calls happen? (API calls, DB writes — make them idempotent)
- What errors are transient (requeue) vs permanent (status condition, no requeue)?
- What is the expected requeue interval for steady-state drift detection?

### 3. Implement the reconciler

Reconcile loop pattern:
```go
func (r *MyResourceReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    log := log.FromContext(ctx)

    // 1. Fetch the resource — handle not-found gracefully
    var resource appsv1alpha1.MyResource
    if err := r.Get(ctx, req.NamespacedName, &resource); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    // 2. Handle deletion via finalizer if needed
    if !resource.DeletionTimestamp.IsZero() {
        return r.handleDeletion(ctx, &resource)
    }

    // 3. Reconcile desired state
    if err := r.reconcileChild(ctx, &resource); err != nil {
        // Transient errors: requeue
        return ctrl.Result{}, err
    }

    // 4. Update status
    resource.Status.Phase = "Ready"
    if err := r.Status().Update(ctx, &resource); err != nil {
        return ctrl.Result{}, err
    }

    // 5. Requeue for drift detection
    return ctrl.Result{RequeueAfter: 5 * time.Minute}, nil
}
```

### 4. Write envtest tests

```go
var _ = Describe("MyResource controller", func() {
    It("should create a child resource when MyResource is created", func() {
        resource := &appsv1alpha1.MyResource{...}
        Expect(k8sClient.Create(ctx, resource)).To(Succeed())
        
        Eventually(func() bool {
            var child corev1.ConfigMap
            err := k8sClient.Get(ctx, types.NamespacedName{...}, &child)
            return err == nil
        }, timeout, interval).Should(BeTrue())
    })
})
```

### 5. Run tests

```bash
make test
```

## Tools you may use

- Filesystem tools for all code changes
- Bash for `make`, `go test`, `kubebuilder`, `kind`
- kubectl against local/kind cluster only

## Output

- Working controller with passing envtest tests
- CRD manifests generated via `make manifests`
- RBAC markers on the reconciler struct

## Safety checks

- Never call external APIs without checking resource deletion timestamp first
- Always use `client.IgnoreNotFound` on Get calls
- Status updates use `r.Status().Update()`, not `r.Update()`
- Finalizers must be removed before the reconciler returns on deletion
