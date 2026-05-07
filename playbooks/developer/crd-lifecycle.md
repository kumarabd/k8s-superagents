# Playbook: CRD Version Migration

**Skill:** crd-design-review
**Guardrail tier:** controlled-write (staging) → release-manager for production

## When

Adding a new version to an existing CRD (e.g., v1alpha1 → v1beta1) with schema changes.

## Steps

1. Assess whether a conversion webhook is needed:
   - If you are only adding optional fields: no webhook needed (set defaults)
   - If you are renaming, removing, or restructuring fields: webhook required

2. Create the new API version:
   ```bash
   kubebuilder create api --group apps --version v1beta1 --kind MyResource --resource --controller=false
   ```

3. Define the hub version (the canonical internal representation):
   ```go
   // In api/v1beta1/myresource_types.go
   // +kubebuilder:storageversion
   ```

4. Implement conversion functions in v1alpha1:
   ```go
   func (src *MyResource) ConvertTo(dstRaw conversion.Hub) error { ... }
   func (dst *MyResource) ConvertFrom(srcRaw conversion.Hub) error { ... }
   ```

5. If conversion webhook needed, scaffold it:
   ```bash
   kubebuilder create webhook --group apps --version v1alpha1 --kind MyResource --conversion
   ```

6. Generate manifests:
   ```bash
   make manifests generate
   ```

7. Test conversion:
   ```bash
   # Apply a v1alpha1 CR, read it back as v1beta1
   kubectl apply -f config/samples/v1alpha1_sample.yaml
   kubectl get myresource sample -o yaml --api-version=apps.example.com/v1beta1
   ```

8. Hand off to release-manager for staging and production rollout.

## Escalate if

- Existing v1alpha1 CRs in production have data that cannot be losslessly converted → data migration needed, engage architect
