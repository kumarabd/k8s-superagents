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
  description: "Route any Kubernetes question or task to the right skill with guardrail enforcement",
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
