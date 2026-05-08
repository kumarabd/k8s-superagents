---
name: manifest-authoring
description: Write correct, minimal, production-ready Kubernetes manifests. Covers Deployments, StatefulSets, Services, ConfigMaps, Secrets, ServiceAccounts, and PodDisruptionBudgets.
---

# Skill: Manifest Authoring

## When to use

When writing new Kubernetes manifests or reviewing existing ones for correctness
and production readiness.

## Inputs needed

- Workload type (Deployment, StatefulSet, DaemonSet, Job, CronJob)
- Image and tag
- Resource requirements (CPU/memory)
- Environment variables and config
- Exposed ports and service type
- Storage requirements (if any)

## Required fields checklist

Every workload manifest must have:

- [ ] `resources.requests` and `resources.limits` on every container
- [ ] `readinessProbe` — gates traffic routing
- [ ] `livenessProbe` — gates container restart
- [ ] `securityContext` — at minimum: `runAsNonRoot: true`
- [ ] Pinned image tag (never `latest`)
- [ ] `labels` with at least `app` and `version`

## Deployment template

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: myns
  labels:
    app: myapp
    version: v1.2.0
spec:
  replicas: 2
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
        version: v1.2.0
    spec:
      serviceAccountName: myapp
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: myapp
          image: myrepo/myapp:v1.2.0
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: /healthz/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /healthz/live
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
```

## Validation steps (always run before apply)

```bash
# 1. Schema validation
kubeconform -strict -kubernetes-version 1.28.0 manifest.yaml

# 2. Server-side dry run
kubectl apply --dry-run=server -f manifest.yaml

# 3. Diff against live state
kubectl diff -f manifest.yaml
```

## Output

- Valid, production-ready manifest file
- Passing dry-run and diff output shown

## Safety checks

- Never use `hostNetwork: true` or `hostPID: true` without explicit approval
- Never mount the Docker socket
- Secrets must be referenced via `secretKeyRef` or a secrets manager, never hardcoded in env vars
- PodDisruptionBudget should accompany any Deployment with `replicas > 1`
