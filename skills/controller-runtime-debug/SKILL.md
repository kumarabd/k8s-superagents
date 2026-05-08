---
name: controller-runtime-debug
description: Debug unexpected behavior in controller-runtime reconcilers — missing reconciliations, infinite requeues, watch misses, cache staleness, and status update conflicts.
---

# Skill: Controller Runtime Debug

## When to use

When a reconciler is not behaving as expected:
- Resource created but reconciler never runs
- Reconciler runs but makes no changes
- Reconciler loops infinitely
- Status not updating correctly
- Watches not triggering on related resource changes

## Inputs needed

- Controller logs from the affected pod
- The reconciler code
- The CRD and CR YAML
- Recent events for the affected namespace

## Diagnostic steps

### 1. Check if the reconciler is being called

```bash
kubectl logs -n <operator-ns> <operator-pod> | grep "Reconciling\|reconcile\|<CR-name>"
```

If no logs: the watch is not triggering. Go to step 3.
If logs present but state wrong: the reconciler is running but logic is wrong. Go to step 4.

### 2. Check for requeue loops

```bash
kubectl logs -n <operator-ns> <operator-pod> | grep -c "Reconciling <CR-name>"
```

If count is growing rapidly: the reconciler is requeuing without making progress.
Common cause: status update triggering another reconcile → check for unconditional status updates.

Fix pattern:
```go
// Before updating status, check if it already matches desired state
if resource.Status.Phase != desiredPhase {
    resource.Status.Phase = desiredPhase
    return ctrl.Result{}, r.Status().Update(ctx, resource)
}
```

### 3. Debug missing watch triggers

Check what the controller is watching:
```go
// In SetupWithManager — are all relevant resources listed?
return ctrl.NewControllerManagedBy(mgr).
    For(&appsv1alpha1.MyResource{}).
    Owns(&corev1.ConfigMap{}).      // watches owned resources
    Watches(&corev1.Secret{}, ...). // watches external resources
    Complete(r)
```

For cross-namespace watches, you need a custom `handler.EnqueueRequestsFromMapFunc`.

### 4. Debug cache staleness

controller-runtime uses an informer cache. If you `Get` a resource and see stale data:
```go
// Force a live read bypassing the cache
if err := r.APIReader.Get(ctx, req.NamespacedName, &resource); err != nil { ... }
```

Only use `APIReader` when you need guaranteed freshness — it bypasses the cache and hits the API server directly.

### 5. Debug status update conflicts

If you see `Operation cannot be fulfilled... the object has been modified`:
```go
// Use retry on conflict
if err := retry.RetryOnConflict(retry.DefaultRetry, func() error {
    if err := r.Get(ctx, req.NamespacedName, &resource); err != nil {
        return err
    }
    resource.Status.Phase = "Ready"
    return r.Status().Update(ctx, &resource)
}); err != nil {
    return ctrl.Result{}, err
}
```

## Output

- Root cause identified
- Fix applied with explanation
- Test case added to prevent regression

## Safety checks

- Never use `r.Update()` to modify status — always use `r.Status().Update()`
- Do not bypass the cache in the hot reconcile path — only for specific freshness needs
