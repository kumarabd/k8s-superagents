---
name: postmortem-writing
description: Write a blameless postmortem after a Kubernetes incident. Captures timeline, root cause, impact, and action items in a structured, actionable format.
---

# Skill: Postmortem Writing

## When to use

Within 24 hours of resolving any incident that caused user-visible impact,
data loss risk, or significant operational disruption.

## Inputs needed

- Incident timeline (from kubectl events, logs, Prometheus, and responder notes)
- Root cause (from the investigation)
- Impact duration and blast radius
- Remediation steps taken
- On-call responders involved

## Structure

### 1. Summary (3-5 sentences)

What happened, when, for how long, and what the user impact was.
Do not assign blame. Do not speculate about cause in this section.

### 2. Timeline

```
HH:MM UTC — <what happened or was observed>
HH:MM UTC — <alert fired / responder paged>
HH:MM UTC — <hypothesis formed>
HH:MM UTC — <action taken>
HH:MM UTC — <impact resolved>
```

Reconstruct from:
```bash
kubectl get events -n <ns> --sort-by=.lastTimestamp
# + Prometheus alert history
# + Loki logs with timestamps
```

### 3. Root cause

One clear paragraph. Answer: what was the proximate cause, and what was the
contributing cause that allowed the proximate cause to have impact?

Example:
> Proximate cause: the HPA was configured with a CPU threshold of 80%, but the metric
> server was unavailable for 4 minutes, causing HPA to scale down to min replicas
> during a traffic spike. Contributing cause: no minimum replica floor was enforced
> independent of HPA, and the readiness probe timeout was too short.

### 4. Impact

- Duration: HH:MM to HH:MM UTC (X minutes)
- Affected services: list
- User impact: error rate %, latency increase, data unavailability
- SLO impact: was the error budget burned?

### 5. What went well

- Alerts fired within N minutes
- Runbook was available and accurate
- On-call had context from recent changes

### 6. What could have been better

- Detection was slow because X
- Runbook did not cover Y scenario
- Rollback took longer than expected because Z

### 7. Action items

| Action | Owner | Due |
|---|---|---|
| Add metric server redundancy | infra team | YYYY-MM-DD |
| Update HPA runbook for metric server failure | on-call | YYYY-MM-DD |
| Set minReplicas floor policy via Kyverno | platform team | YYYY-MM-DD |

## Safety checks

- Blameless: describe what systems did, not what people did wrong
- Action items must have an owner and a due date — no orphaned TODOs
- Share draft with all responders before publishing for factual accuracy
