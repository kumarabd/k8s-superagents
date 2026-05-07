# Playbook: Scaffold a New Kubernetes Operator

**Skill:** operator-development
**Guardrail tier:** controlled-write (local/kind only)

## Prerequisites

- Go 1.21+
- kubebuilder v3+ or operator-sdk v1.30+
- kind or a local cluster
- `KUBECONFIG` pointing to a local cluster

## Steps

1. Initialize the project:
   ```bash
   mkdir myoperator && cd myoperator
   kubebuilder init --domain example.com --repo github.com/org/myoperator
   ```

2. Create the API (CRD + controller):
   ```bash
   kubebuilder create api --group apps --version v1alpha1 --kind MyResource --resource --controller
   ```

3. Review generated files:
   - `api/v1alpha1/myresource_types.go` — CRD schema (edit this)
   - `internal/controller/myresource_controller.go` — reconciler (implement this)
   - `config/crd/` — generated CRD manifests (do not edit by hand)

4. Design the CRD schema (use `crd-design-review` skill):
   Edit `api/v1alpha1/myresource_types.go` — add spec fields, status fields, conditions.

5. Generate manifests:
   ```bash
   make manifests generate
   ```

6. Implement the reconciler (use `operator-development` skill for patterns).

7. Install CRDs on local cluster:
   ```bash
   make install
   ```

8. Run the controller locally:
   ```bash
   make run
   ```

9. Apply a test CR:
   ```bash
   kubectl apply -f config/samples/apps_v1alpha1_myresource.yaml
   kubectl describe myresource sample
   ```

10. Write envtest tests:
    ```bash
    make test
    ```

11. Build the container:
    ```bash
    make docker-build IMG=myrepo/myoperator:dev
    ```

## Escalate if

- CRD schema needs conversion webhook (v1alpha1 → v1beta1) → complex, engage architect
- Operator needs to watch cross-namespace resources → RBAC design needed, engage security-auditor
