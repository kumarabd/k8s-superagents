# Playbook: RBAC Audit

**Skill:** rbac-design
**Guardrail tier:** readonly

## When

Quarterly security review, post-incident review, or onboarding to an unfamiliar cluster.

## Steps

1. List all ClusterRoleBindings to cluster-admin:
   ```bash
   kubectl get clusterrolebindings -o json | \
     python3 -c "import json,sys; [print(i['metadata']['name'], i.get('subjects','')) for i in json.load(sys.stdin)['items'] if i['roleRef']['name']=='cluster-admin']"
   ```

2. Find workloads using the default service account:
   ```bash
   kubectl get pods -A -o json | \
     python3 -c "import json,sys; [print(i['metadata']['namespace']+'/'+i['metadata']['name']) for i in json.load(sys.stdin)['items'] if not i['spec'].get('serviceAccountName') or i['spec']['serviceAccountName']=='default']"
   ```

3. List service accounts with ClusterRole bindings:
   ```bash
   kubectl get clusterrolebindings -o json | \
     python3 -c "import json,sys; [print(i['metadata']['name'], i['roleRef']['name'], i.get('subjects','')) for i in json.load(sys.stdin)['items'] if any(s.get('kind')=='ServiceAccount' for s in i.get('subjects') or [])]"
   ```

4. Check what a specific service account can do:
   ```bash
   kubectl auth can-i --list --as=system:serviceaccount:<ns>:<sa>
   ```

5. For each finding, assess:
   - Is cluster-admin binding necessary? If not, replace with a namespaced Role
   - Is the default service account used? If so, create a dedicated SA with minimal permissions

6. Produce findings report using format from `rbac-design` skill.

7. For remediation: use `rbac-design` skill to write minimal Role manifests, then hand to manifest-engineer for application.
