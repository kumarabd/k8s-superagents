---
name: helm-kustomize
description: Structure Helm charts and Kustomize overlays for multi-environment Kubernetes deployments. Covers chart layout, values hierarchy, Kustomize base/overlay pattern, and validation.
---

# Skill: Helm and Kustomize

## When to use

When packaging Kubernetes manifests for reuse across environments (dev/staging/prod)
or for distribution as a reusable component.

## Inputs needed

- Target environments and how they differ (replicas, image tags, resource limits, ingress hostnames)
- Whether to use Helm (parameterized templates) or Kustomize (overlay patches)
- Existing chart/overlay structure if extending

## Helm chart layout

```
chart/
  Chart.yaml          ← name, version, appVersion
  values.yaml         ← defaults (safe for dev)
  values-staging.yaml ← staging overrides
  values-prod.yaml    ← prod overrides
  templates/
    deployment.yaml
    service.yaml
    serviceaccount.yaml
    hpa.yaml
    _helpers.tpl      ← named templates
  charts/             ← subcharts
```

Use `helm template` to preview rendered output:
```bash
helm template myapp ./chart -f values-prod.yaml | kubectl apply --dry-run=server -f -
```

Validate before release:
```bash
helm lint ./chart
helm template myapp ./chart | kubeconform -strict -
```

## Kustomize overlay layout

```
base/
  kustomization.yaml
  deployment.yaml
  service.yaml

overlays/
  dev/
    kustomization.yaml    ← resources: [../../base], patches below
    replica-patch.yaml
  staging/
    kustomization.yaml
    replica-patch.yaml
    resource-patch.yaml
  prod/
    kustomization.yaml
    replica-patch.yaml
    resource-patch.yaml
    hpa.yaml
```

Preview rendered output:
```bash
kubectl kustomize overlays/prod | kubectl apply --dry-run=server -f -
```

## When to use Helm vs Kustomize

| Helm | Kustomize |
|---|---|
| Distributing to external users | Internal multi-env promotion |
| Complex conditional logic needed | Simple env-specific patches |
| Versioned release management | GitOps with ArgoCD/Flux |

## Output

- Chart or overlay structure with all templates
- Passing `helm lint` or `kubectl kustomize` output
- Dry-run confirmation

## Safety checks

- `values.yaml` defaults must be safe (low replicas, no prod endpoints)
- Never hardcode secrets in values files — use external-secrets or sealed-secrets references
- Pin chart dependencies to exact versions in `Chart.lock`
