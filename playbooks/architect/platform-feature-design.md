# Playbook: Platform Feature Design

**Skill:** architecture-plan + task-decomposition
**Guardrail tier:** readonly

## When

Designing a new platform-level capability that affects multiple teams or workloads.

## Steps

1. **Define the problem** — write one sentence: "We need X because Y, and today we cannot Z."

2. **Identify stakeholders** — who is affected? Who must approve? Who must implement?

3. **Survey the current state** — read existing code, configs, and cluster state:
   ```bash
   ./plugins/scripts/cluster-reader.sh nodes
   ./plugins/scripts/audit.sh
   ```

4. **Explore 2-3 implementation options** — for each:
   - How does it work?
   - What does it cost (complexity, infra, maintenance)?
   - What is the rollback path?
   - What are the failure modes?

5. **Apply YAGNI and reversibility** — prefer the simplest option that solves the stated problem. Avoid building for hypothetical future requirements.

6. **Produce the architecture plan** (use `architecture-plan` skill format).

7. **Decompose into phases** (use `task-decomposition` skill):
   - Each phase = one agent, one skill, one deliverable
   - Each phase must be independently committable

8. **Identify risks and validation gates** — what must be true before each phase proceeds?

9. **Review with stakeholders** before any implementation begins.

## Output

A design document in `docs/design/YYYY-MM-DD-<feature>-design.md` with:
- Problem statement
- Chosen approach with rationale
- Phased plan with agent/skill routing
- Risks and mitigations
- Validation gates
