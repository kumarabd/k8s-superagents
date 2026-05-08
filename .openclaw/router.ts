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
  { keywords: ["crashloop", "pod pending", "evicted", "oomkill", "imagepullbackoff"], skill: "pod-failure-triage" },
  { keywords: ["node pressure", "notready", "disk pressure", "pid pressure"], skill: "node-pressure-debug" },
  { keywords: ["controller-runtime", "reconciler", "requeue", "reconcile"], skill: "controller-runtime-debug" },
  { keywords: ["crd schema", "field naming"], skill: "crd-design-review" },
  { keywords: ["rollout risk", "blast radius", "change risk"], skill: "rollout-risk-assessment" },
  { keywords: ["rbac", "rolebinding", "permission", "serviceaccount", "service account", "clusterrole"], skill: "rbac-design" },
  { keywords: ["canary", "rollout", "blue-green", "progressive delivery"], skill: "release-strategy" },
  { keywords: ["hpa", "vpa", "sizing", "capacity"], skill: "capacity-planning" },
  { keywords: ["operator", "crd", "webhook"], skill: "operator-development" },
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
