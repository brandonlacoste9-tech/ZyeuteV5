/**
 * Content Moderation Bee
 * Uses V3-MOD for content safety checks
 */

import { v3Mod } from "../../v3-swarm.js";

export async function run(task: any) {
  const payload = task.payload || {};
  const content = payload.content || payload.text || "";

  console.log("[Moderation] Checking content:", content.substring(0, 50));

  try {
    const result = await v3Mod(content);

    return {
      approved: result.status === "approved",
      reason: result.reason,
      suggestedRewrite: result.suggested_rewrite,
      metadata: { model: "deepseek", bee: "moderation" },
    };
  } catch (error: any) {
    console.error("[Moderation] Error:", error.message);
    // Default to approved if moderation fails (fail-open for UX)
    return {
      approved: true,
      reason: "Moderation service unavailable",
      metadata: { model: "deepseek", bee: "moderation", error: true },
    };
  }
}
