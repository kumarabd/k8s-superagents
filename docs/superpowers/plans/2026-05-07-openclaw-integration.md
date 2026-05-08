# OpenClaw Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize skill content from `.claude/skills/` into `skills/` and add an OpenClaw plugin under `.openclaw/` exposing a single `k8s_superagent` routing tool with guardrail enforcement.

**Architecture:** Phase 1 moves all 18 skill markdown files to a framework-agnostic `skills/` directory and updates the one path reference in `using-k8s-superagent/SKILL.md`. Phase 2 adds `.openclaw/` with pure-logic modules (`router.ts`, `guardrails.ts`) tested with Vitest, wired together in `index.ts` using the OpenClaw plugin SDK.

**Tech Stack:** TypeScript (ESM), `@sinclair/typebox` for parameter schemas, Vitest for unit tests, OpenClaw Plugin SDK (runtime-provided peer dep).

---

## File map

**Phase 1 — modified:**
- `skills/using-k8s-superagent/SKILL.md` — update `.claude/skills/` path reference
- `CLAUDE.md` — update structure table

**Phase 1 — moved (18 dirs):**
- `.claude/skills/*/` → `skills/*/` for all 18 skill directories

**Phase 2 — created:**
- `.openclaw/openclaw.plugin.json` — OpenClaw manifest
- `.openclaw/package.json` — package config + vitest dev dep
- `.openclaw/tsconfig.json` — TypeScript config
- `.openclaw/router.ts` — pure query→skill classification logic
- `.openclaw/guardrails.ts` — pure tier detection + authorization logic
- `.openclaw/index.ts` — `definePluginEntry` wiring both modules
- `.openclaw/__tests__/router.test.ts` — unit tests for router
- `.openclaw/__tests__/guardrails.test.ts` — unit tests for guardrails

---

## Task 1: Move skill directories to root skills/

**Files:** Move 18 directories from `.claude/skills/` to `skills/`

- [ ] **Step 1: Run git mv for all 18 skill directories**

```bash
git mv .claude/skills/architecture-plan skills/architecture-plan
git mv .claude/skills/capacity-planning skills/capacity-planning
git mv .claude/skills/cluster-audit skills/cluster-audit
git mv .claude/skills/controller-runtime-debug skills/controller-runtime-debug
git mv .claude/skills/crd-design-review skills/crd-design-review
git mv .claude/skills/helm-kustomize skills/helm-kustomize
git mv .claude/skills/k8s-assistant skills/k8s-assistant
git mv .claude/skills/manifest-authoring skills/manifest-authoring
git mv .claude/skills/node-pressure-debug skills/node-pressure-debug
git mv .claude/skills/observability-investigation skills/observability-investigation
git mv .claude/skills/operator-development skills/operator-development
git mv .claude/skills/pod-failure-triage skills/pod-failure-triage
git mv .claude/skills/policy-enforcement skills/policy-enforcement
git mv .claude/skills/postmortem-writing skills/postmortem-writing
git mv .claude/skills/rbac-design skills/rbac-design
git mv .claude/skills/release-strategy skills/release-strategy
git mv .claude/skills/rollout-risk-assessment skills/rollout-risk-assessment
git mv .claude/skills/task-decomposition skills/task-decomposition
```

- [ ] **Step 2: Verify all 19 skill directories are now under skills/**

```bash
ls skills/
```

Expected output (19 entries — 18 domain skills + using-k8s-superagent):
```
architecture-plan       helm-kustomize          pod-failure-triage
capacity-planning       k8s-assistant           policy-enforcement
cluster-audit           manifest-authoring      postmortem-writing
controller-runtime-debug node-pressure-debug    rbac-design
crd-design-review       observability-investigation release-strategy
helm-kustomize          operator-development    rollout-risk-assessment
                        task-decomposition      using-k8s-superagent
```

- [ ] **Step 3: Verify .claude/skills/ is now empty and remove it**

```bash
ls .claude/skills/ 2>&1
```

Expected: empty or "No such file or directory". If empty:

```bash
rmdir .claude/skills/
```

- [ ] **Step 4: Commit Phase 1 file moves**

```bash
git add -A
git commit -m "refactor: move skill content from .claude/skills/ to skills/"
```

---

## Task 2: Update path references

**Files:**
- Modify: `skills/using-k8s-superagent/SKILL.md:52`
- Modify: `CLAUDE.md:27`

- [ ] **Step 1: Update the skill path in using-k8s-superagent/SKILL.md**

Find this line in `skills/using-k8s-superagent/SKILL.md`:
```
`${PLUGIN_ROOT}/.claude/skills/<skill-name>/SKILL.md`
```

Replace with:
```
`${PLUGIN_ROOT}/skills/<skill-name>/SKILL.md`
```

- [ ] **Step 2: Update the structure table in CLAUDE.md**

Find this line in `CLAUDE.md`:
```
| `.claude/skills/` | Cognitive workflows — how to think about a class of problem |
```

Replace with:
```
| `skills/` | Cognitive workflows — how to think about a class of problem (framework-agnostic) |
```

- [ ] **Step 3: Verify no remaining stale references**

```bash
grep -r "\.claude/skills" . --include="*.md" --exclude-dir=".git" --exclude-dir="docs"
```

Expected: no output. If any matches appear, update them to use `skills/` instead.

- [ ] **Step 4: Commit reference updates**

```bash
git add skills/using-k8s-superagent/SKILL.md CLAUDE.md
git commit -m "refactor: update skill path references to framework-agnostic skills/ dir"
```

---

## Task 3: Scaffold .openclaw/ package

**Files:**
- Create: `.openclaw/openclaw.plugin.json`
- Create: `.openclaw/package.json`
- Create: `.openclaw/tsconfig.json`

- [ ] **Step 1: Create the OpenClaw manifest**

Create `.openclaw/openclaw.plugin.json`:
```json
{
  "id": "k8s-superagent",
  "name": "Kubernetes Superagent",
  "description": "Virtual Kubernetes engineering org — Developer, SRE, Architect, Security, and Release Engineer profiles with skills and guardrails.",
  "contracts": {
    "tools": ["k8s_superagent"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

- [ ] **Step 2: Create package.json**

Create `.openclaw/package.json`:
```json
{
  "name": "@k8s-superagent/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@sinclair/typebox": "^0.32.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.6.0"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    }
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

Create `.openclaw/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["./**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Install dependencies**

```bash
cd .openclaw && npm install
```

Expected: `node_modules/` created, `package-lock.json` created, no errors.

- [ ] **Step 5: Commit scaffold**

```bash
git add .openclaw/openclaw.plugin.json .openclaw/package.json .openclaw/tsconfig.json .openclaw/package-lock.json
git commit -m "feat: scaffold .openclaw/ plugin package"
```

---

## Task 4: Write failing tests for router.ts

**Files:**
- Create: `.openclaw/__tests__/router.test.ts`

- [ ] **Step 1: Create the test file**

Create `.openclaw/__tests__/router.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { classifyQuery } from "../router.js";

describe("classifyQuery", () => {
  it("routes crashloop to pod-failure-triage", () => {
    expect(classifyQuery("my pod is in CrashLoopBackOff")).toBe("pod-failure-triage");
  });

  it("routes OOMKill to pod-failure-triage", () => {
    expect(classifyQuery("pod was OOMKilled")).toBe("pod-failure-triage");
  });

  it("routes node NotReady to node-pressure-debug", () => {
    expect(classifyQuery("node is NotReady")).toBe("node-pressure-debug");
  });

  it("routes rbac to rbac-design", () => {
    expect(classifyQuery("design RBAC for my service account")).toBe("rbac-design");
  });

  it("routes canary to release-strategy", () => {
    expect(classifyQuery("set up a canary deployment")).toBe("release-strategy");
  });

  it("routes hpa to capacity-planning", () => {
    expect(classifyQuery("configure HPA for my workload")).toBe("capacity-planning");
  });

  it("routes operator to operator-development", () => {
    expect(classifyQuery("build a Kubernetes operator")).toBe("operator-development");
  });

  it("routes helm to helm-kustomize", () => {
    expect(classifyQuery("structure my helm chart")).toBe("helm-kustomize");
  });

  it("routes deployment to manifest-authoring", () => {
    expect(classifyQuery("write a deployment manifest")).toBe("manifest-authoring");
  });

  it("routes audit to cluster-audit", () => {
    expect(classifyQuery("audit the cluster health")).toBe("cluster-audit");
  });

  it("routes prometheus to observability-investigation", () => {
    expect(classifyQuery("check prometheus metrics for latency spike")).toBe("observability-investigation");
  });

  it("routes kyverno to policy-enforcement", () => {
    expect(classifyQuery("write a kyverno policy")).toBe("policy-enforcement");
  });

  it("routes postmortem to postmortem-writing", () => {
    expect(classifyQuery("write a postmortem for last night's incident")).toBe("postmortem-writing");
  });

  it("routes architecture to architecture-plan", () => {
    expect(classifyQuery("design the architecture for this feature")).toBe("architecture-plan");
  });

  it("routes controller-runtime to controller-runtime-debug", () => {
    expect(classifyQuery("my controller-runtime reconciler is missing events")).toBe("controller-runtime-debug");
  });

  it("routes blast radius to rollout-risk-assessment", () => {
    expect(classifyQuery("assess the blast radius of this change")).toBe("rollout-risk-assessment");
  });

  it("returns null for unrecognised queries", () => {
    expect(classifyQuery("what is kubernetes")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(classifyQuery("CRASHLOOP in production")).toBe("pod-failure-triage");
  });

  it("first-match-wins: rbac matched before policy when both keywords present", () => {
    expect(classifyQuery("rbac policy enforcement")).toBe("rbac-design");
  });
});
```

- [ ] **Step 2: Run tests and confirm they fail**

```bash
cd .openclaw && npm test
```

Expected: all tests FAIL with `Cannot find module '../router.js'`

---

## Task 5: Implement router.ts to pass tests

**Files:**
- Create: `.openclaw/router.ts`

- [ ] **Step 1: Create router.ts**

Create `.openclaw/router.ts`:
```typescript
export type SkillName =
  | "pod-failure-triage"
  | "node-pressure-debug"
  | "rbac-design"
  | "release-strategy"
  | "capacity-planning"
  | "operator-development"
  | "helm-kustomize"
  | "manifest-authoring"
  | "cluster-audit"
  | "observability-investigation"
  | "policy-enforcement"
  | "postmortem-writing"
  | "architecture-plan"
  | "task-decomposition"
  | "crd-design-review"
  | "controller-runtime-debug"
  | "rollout-risk-assessment";

export type ProfileName =
  | "developer"
  | "sre"
  | "architect"
  | "security"
  | "release";

// More specific / multi-word entries come first to avoid false matches on
// substrings (e.g. "controller-runtime" before "controller", "rollout risk"
// before "rollout", "crd schema" before "crd").
const ROUTING_TABLE: Array<{ keywords: string[]; skill: SkillName }> = [
  { keywords: ["crashloop", "pending", "evicted", "oomkill", "imagepullbackoff"], skill: "pod-failure-triage" },
  { keywords: ["node pressure", "notready", "disk pressure", "pid pressure"], skill: "node-pressure-debug" },
  { keywords: ["controller-runtime", "reconciler", "requeue"], skill: "controller-runtime-debug" },
  { keywords: ["crd schema", "field naming"], skill: "crd-design-review" },
  { keywords: ["rollout risk", "blast radius", "change risk"], skill: "rollout-risk-assessment" },
  { keywords: ["rbac", "role", "permission", "serviceaccount", "clusterrole"], skill: "rbac-design" },
  { keywords: ["canary", "rollout", "blue-green", "progressive delivery"], skill: "release-strategy" },
  { keywords: ["hpa", "vpa", "sizing", "capacity"], skill: "capacity-planning" },
  { keywords: ["operator", "crd", "webhook", "reconcile"], skill: "operator-development" },
  { keywords: ["helm", "kustomize", "chart", "overlay", "values"], skill: "helm-kustomize" },
  { keywords: ["manifest", "deployment", "statefulset", "service", "configmap"], skill: "manifest-authoring" },
  { keywords: ["audit", "health", "utilization", "drift"], skill: "cluster-audit" },
  { keywords: ["metrics", "latency", "logs", "loki", "prometheus", "grafana"], skill: "observability-investigation" },
  { keywords: ["policy", "kyverno", "opa", "gatekeeper", "admission"], skill: "policy-enforcement" },
  { keywords: ["postmortem", "incident", "timeline"], skill: "postmortem-writing" },
  { keywords: ["architecture", "design", "plan", "decompose"], skill: "architecture-plan" },
  { keywords: ["task", "phase", "breakdown"], skill: "task-decomposition" },
];

export const PROFILE_PATHS: Record<ProfileName, string> = {
  developer: "profiles/kubernetes-developer.md",
  sre: "profiles/sre.md",
  architect: "profiles/architect.md",
  security: "profiles/security-engineer.md",
  release: "profiles/release-engineer.md",
};

export function classifyQuery(query: string): SkillName | null {
  const lower = query.toLowerCase();
  for (const { keywords, skill } of ROUTING_TABLE) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return skill;
    }
  }
  return null;
}
```

- [ ] **Step 2: Run tests and confirm they all pass**

```bash
cd .openclaw && npm test
```

Expected: all 19 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add .openclaw/router.ts .openclaw/__tests__/router.test.ts
git commit -m "feat: add openclaw router with keyword-based skill classification"
```

---

## Task 6: Write failing tests for guardrails.ts

**Files:**
- Create: `.openclaw/__tests__/guardrails.test.ts`

- [ ] **Step 1: Create the test file**

Create `.openclaw/__tests__/guardrails.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { detectTier, isAuthorized } from "../guardrails.js";

describe("detectTier", () => {
  it("returns readonly for a read-only query", () => {
    expect(detectTier("show me all pods in the cluster")).toBe("readonly");
  });

  it("returns readonly for a describe query", () => {
    expect(detectTier("describe the failing pod")).toBe("readonly");
  });

  it("returns controlled-write for apply", () => {
    expect(detectTier("apply this manifest to the cluster")).toBe("controlled-write");
  });

  it("returns controlled-write for scale", () => {
    expect(detectTier("scale the deployment to 3 replicas")).toBe("controlled-write");
  });

  it("returns controlled-write for restart", () => {
    expect(detectTier("restart the deployment")).toBe("controlled-write");
  });

  it("returns controlled-write for cordon", () => {
    expect(detectTier("cordon the node before maintenance")).toBe("controlled-write");
  });

  it("returns privileged for delete", () => {
    expect(detectTier("delete the namespace")).toBe("privileged");
  });

  it("returns privileged for drain", () => {
    expect(detectTier("drain the node for maintenance")).toBe("privileged");
  });

  it("returns privileged for force", () => {
    expect(detectTier("force delete the stuck pod")).toBe("privileged");
  });

  it("privileged takes precedence over write keywords", () => {
    expect(detectTier("delete and apply the resource")).toBe("privileged");
  });
});

describe("isAuthorized", () => {
  it("authorizes readonly without confirm", () => {
    expect(isAuthorized("readonly", undefined)).toBe(true);
  });

  it("authorizes controlled-write when confirm is any string", () => {
    expect(isAuthorized("controlled-write", "CONFIRM: apply reviewed manifest")).toBe(true);
  });

  it("blocks controlled-write when confirm is absent", () => {
    expect(isAuthorized("controlled-write", undefined)).toBe(false);
  });

  it("authorizes privileged when confirm starts with CONFIRM:", () => {
    expect(isAuthorized("privileged", "CONFIRM: draining node-1 for maintenance window")).toBe(true);
  });

  it("blocks privileged when confirm is absent", () => {
    expect(isAuthorized("privileged", undefined)).toBe(false);
  });

  it("blocks privileged when confirm does not start with CONFIRM:", () => {
    expect(isAuthorized("privileged", "yes please go ahead")).toBe(false);
  });

  it("blocks privileged for empty confirm string", () => {
    expect(isAuthorized("privileged", "")).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests and confirm they fail**

```bash
cd .openclaw && npm test
```

Expected: guardrails tests FAIL with `Cannot find module '../guardrails.js'`

---

## Task 7: Implement guardrails.ts to pass tests

**Files:**
- Create: `.openclaw/guardrails.ts`

- [ ] **Step 1: Create guardrails.ts**

Create `.openclaw/guardrails.ts`:
```typescript
export type GuardrailTier = "readonly" | "controlled-write" | "privileged";

const PRIVILEGED_KEYWORDS = ["delete", "drain", "force", "evict", "purge"];
const WRITE_KEYWORDS = ["apply", "patch", "scale", "restart", "cordon", "uncordon"];

export const TIER_FILES: Record<GuardrailTier, string> = {
  readonly: "guardrails/readonly.md",
  "controlled-write": "guardrails/controlled-write.md",
  privileged: "guardrails/privileged.md",
};

export function detectTier(query: string): GuardrailTier {
  const lower = query.toLowerCase();
  if (PRIVILEGED_KEYWORDS.some((kw) => lower.includes(kw))) return "privileged";
  if (WRITE_KEYWORDS.some((kw) => lower.includes(kw))) return "controlled-write";
  return "readonly";
}

export function isAuthorized(tier: GuardrailTier, confirm?: string): boolean {
  if (tier === "readonly") return true;
  if (tier === "controlled-write") return confirm !== undefined;
  return typeof confirm === "string" && confirm.trim().startsWith("CONFIRM:");
}
```

- [ ] **Step 2: Run all tests and confirm they all pass**

```bash
cd .openclaw && npm test
```

Expected: all tests PASS (router + guardrails, ~27 tests total).

- [ ] **Step 3: Commit**

```bash
git add .openclaw/guardrails.ts .openclaw/__tests__/guardrails.test.ts
git commit -m "feat: add openclaw guardrails with tier detection and authorization"
```

---

## Task 8: Implement index.ts and finalize

**Files:**
- Create: `.openclaw/index.ts`

- [ ] **Step 1: Create index.ts**

Create `.openclaw/index.ts`:
```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { classifyQuery, PROFILE_PATHS, type ProfileName } from "./router.js";
import { detectTier, isAuthorized, TIER_FILES } from "./guardrails.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "..");

function readContent(relativePath: string): string {
  return readFileSync(resolve(PLUGIN_ROOT, relativePath), "utf-8");
}

export default definePluginEntry({
  id: "k8s-superagent",
  name: "Kubernetes Superagent",
  description: "Route any Kubernetes question to the right skill with guardrail enforcement",
  register(api) {
    api.registerTool({
      name: "k8s_superagent",
      description: "Route any Kubernetes question or task to the right skill. Enforces guardrail tiers — pass confirm: 'CONFIRM: <reason>' for write or destructive operations.",
      parameters: Type.Object({
        query: Type.String({ description: "The Kubernetes question or task description" }),
        profile: Type.Optional(
          Type.String({ description: "Active role: developer | sre | architect | security | release" })
        ),
        confirm: Type.Optional(
          Type.String({ description: "CONFIRM: <reason> — required for controlled-write or privileged operations" })
        ),
      }),
      async execute(_id, { query, profile, confirm }) {
        const tier = detectTier(query);

        if (!isAuthorized(tier, confirm)) {
          if (tier === "privileged") {
            return {
              content: [{
                type: "text",
                text: `BLOCKED: Privileged operation detected in query.\n\nTo proceed, pass: confirm: "CONFIRM: <your reason>"\n\nQuery: ${query}`,
              }],
            };
          }
          return {
            content: [{
              type: "text",
              text: `CONFIRM REQUIRED: This operation modifies cluster state.\n\nProposed action: ${query}\n\nTo proceed, pass: confirm: "CONFIRM: <reason>"`,
            }],
          };
        }

        const skillName = classifyQuery(query);
        let contentPath: string;

        if (skillName) {
          contentPath = `skills/${skillName}/SKILL.md`;
        } else {
          const profileKey = profile as ProfileName | undefined;
          contentPath =
            profileKey && PROFILE_PATHS[profileKey]
              ? PROFILE_PATHS[profileKey]
              : "profiles/assistant.md";
        }

        const skillContent = readContent(contentPath);
        const tierContent = readContent(TIER_FILES[tier]);
        const label = skillName ? `Skill: ${skillName}` : `Profile: ${profile ?? "assistant"}`;

        return {
          content: [{
            type: "text",
            text: `**${label}** | Guardrail: ${tier}\n\n${skillContent}\n\n---\n\n**Guardrail reference:**\n\n${tierContent}`,
          }],
        };
      },
    });
  },
});
```

- [ ] **Step 2: Run all tests one final time to confirm nothing regressed**

```bash
cd .openclaw && npm test
```

Expected: all tests PASS.

- [ ] **Step 3: Commit index.ts**

```bash
git add .openclaw/index.ts
git commit -m "feat: add openclaw k8s_superagent routing tool entry point"
```

- [ ] **Step 4: Verify final repo structure**

```bash
find . -not -path './.git/*' -not -path './node_modules/*' -not -path './.openclaw/node_modules/*' | sort | grep -E '^\./\.(openclaw|claude)|^\./(skills|profiles|guardrails)' | head -40
```

Expected output includes:
```
./.openclaw/
./.openclaw/__tests__/guardrails.test.ts
./.openclaw/__tests__/router.test.ts
./.openclaw/guardrails.ts
./.openclaw/index.ts
./.openclaw/openclaw.plugin.json
./.openclaw/package.json
./.openclaw/router.ts
./.openclaw/tsconfig.json
./.claude/agents/
./.claude/settings.json
./skills/using-k8s-superagent/
./skills/pod-failure-triage/
... (18 domain skills)
```

`.claude/skills/` must NOT appear in output.
