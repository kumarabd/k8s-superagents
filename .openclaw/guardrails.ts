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
