# Playbook: Secret Hygiene Check

**Skill:** policy-enforcement
**Guardrail tier:** readonly

## When

Security review, compliance audit, or after a suspected secret exposure incident.

## Steps

1. Find secrets mounted as env vars:
   ```bash
   kubectl get pods -A -o json | \
     python3 -c "
   import json, sys
   for pod in json.load(sys.stdin)['items']:
     ns = pod['metadata']['namespace']
     name = pod['metadata']['name']
     for c in pod['spec'].get('containers', []):
       for env in c.get('env', []):
         if env.get('valueFrom', {}).get('secretKeyRef'):
           print(f'{ns}/{name}: {c[\"name\"]} uses secret {env[\"valueFrom\"][\"secretKeyRef\"][\"name\"]}.{env[\"valueFrom\"][\"secretKeyRef\"][\"key\"]}')
   "
   ```

2. Check for secrets mounted as volumes:
   ```bash
   kubectl get pods -A -o json | \
     python3 -c "
   import json, sys
   for pod in json.load(sys.stdin)['items']:
     ns = pod['metadata']['namespace']
     name = pod['metadata']['name']
     for v in pod['spec'].get('volumes', []):
       if v.get('secret'):
         print(f'{ns}/{name}: mounts secret {v[\"secret\"][\"secretName\"]}')
   "
   ```

3. Check for secrets with no associated workload (orphaned secrets):
   ```bash
   kubectl get secrets -A --no-headers | grep -v "kubernetes.io/service-account-token\|helm.sh"
   ```

4. Check for secrets with default service account token auto-mount:
   ```bash
   kubectl get pods -A -o json | \
     python3 -c "import json,sys; [print(i['metadata']['namespace']+'/'+i['metadata']['name']) for i in json.load(sys.stdin)['items'] if i['spec'].get('automountServiceAccountToken', True)]"
   ```

5. Recommendations:
   - Prefer external secrets operator (ESO) over native Kubernetes secrets for sensitive data
   - Set `automountServiceAccountToken: false` on pods that don't need it
   - Rotate any secrets that have been exposed or are unused

6. For remediation: use `policy-enforcement` skill to add a Kyverno policy requiring `automountServiceAccountToken: false`.
