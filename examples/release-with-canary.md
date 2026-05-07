# Example: Release with Canary — DB Migration + Progressive Delivery

**Profile:** Release Engineer
**Agents:** release-manager → architect → release-manager
**Skills:** rollout-risk-assessment → architecture-plan → release-strategy → observability-investigation
**Playbook:** playbooks/architect/platform-feature-design.md

## Scenario

payments-api v2.4.0 is ready to promote from staging to production. The diff
includes a Flyway DB migration that adds a NOT NULL column to the `transactions`
table (50M rows). Release engineer loads the release profile.

---

## Turn 1 — User initiates release

```
Load the release engineer profile. Release payments-api v2.4.0 to production.
Image is payments-api:v2.4.0, currently running v2.3.8 in production.
```

**Claude (release-manager):** Release Engineer profile active. Controlled-write
tier. Starting `rollout-risk-assessment` skill before touching anything.

---

## Turn 2 — release-manager: risk assessment

```bash
kubectl diff -f deployments/payments-api/production.yaml
```

Diff output includes image tag change and a new init-container: `flyway-migrate`.

**Claude (release-manager):** Risk assessment flags a DB migration:
- NOT NULL column on 50M-row table
- Migration runs in an init-container before the new pods start
- If migration fails mid-run, old pods are still serving but the schema is
  partially applied — this is a rollback hazard

Risk level: **HIGH**. Escalating to architect for migration sequencing before
proceeding with the rollout.

---

## Turn 3 — architect: phased plan

**Claude (architect):** Using `architecture-plan` skill.

Recommended sequence:

**Phase 1 — Migration (zero-downtime):**
Run the migration as a standalone Job with `backfill_default=''` first. This
makes the column nullable-compatible. Old pods continue serving. Takes ~8 min
at 50M rows with a batch size of 10k.

**Phase 2 — Canary 10%:**
Deploy v2.4.0 to 10% of pods (2 of 20 replicas). Migration is already done
so init-container is a no-op. Monitor error rate and p99 latency for 15 min.

**Phase 3 — Full rollout:**
If SLIs are clean, promote to 100%.

**Phase 4 — NOT NULL enforcement (next release):**
Once all pods on v2.4.0, add a separate migration to add the NOT NULL
constraint. Ship as v2.4.1.

Handing back to release-manager to execute.

---

## Turn 4 — release-manager: run migration Job

**Claude (release-manager):** Applying migration Job. Controlled-write — showing
diff first.

```bash
bash plugins/scripts/diff.sh -f jobs/payments-api-migrate-v2.4.0.yaml
```

Diff: new Job resource, no existing resources changed.

Awaiting confirmation to apply the migration Job.

---

## Turn 5 — User confirms migration

```
Confirmed — run the migration job.
```

**Claude (release-manager):**

```bash
kubectl apply -f jobs/payments-api-migrate-v2.4.0.yaml -n production
kubectl wait --for=condition=complete job/payments-api-migrate-v2.4.0 \
  -n production --timeout=600s
```

Output: `job.batch/payments-api-migrate-v2.4.0 condition met`

Migration complete in 7m 42s. Proceeding to canary.

---

## Turn 6 — release-manager: canary 10%

```bash
kubectl scale deployment/payments-api -n production --replicas=2
kubectl set image deployment/payments-api -n production \
  payments-api=payments-api:v2.4.0
kubectl rollout status deployment/payments-api -n production --timeout=120s
```

**Claude (release-manager):** 2 canary pods running v2.4.0. 18 pods still on
v2.3.8. Invoking `observability-investigation` skill to monitor SLIs for 15
minutes.

---

## Turn 7 — release-manager: SLI monitoring

Using Prometheus MCP:

```
rate(http_requests_total{app="payments-api",status=~"5.."}[5m]) /
rate(http_requests_total{app="payments-api"}[5m])
```

Result after 15 min:
- Error rate: 0.04% (baseline: 0.03%) — within tolerance
- p99 latency: 142ms (baseline: 138ms) — within tolerance
- No circuit-breaker trips on downstream services

**Claude (release-manager):** SLIs clean. Ready to promote to 100%.
Awaiting confirmation.

---

## Turn 8 — User confirms full rollout

```
Confirmed — promote to 100%.
```

**Claude (release-manager):**

```bash
kubectl scale deployment/payments-api -n production --replicas=20
kubectl rollout status deployment/payments-api -n production --timeout=300s
```

Output: `deployment "payments-api" successfully rolled out`

All 20 pods on v2.4.0. Release complete.

Next step: schedule v2.4.1 to add the NOT NULL constraint once traffic is
stable for 24 hours.
