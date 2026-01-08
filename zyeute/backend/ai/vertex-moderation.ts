import { VertexAI } from "@google-cloud/vertexai";
import { logger } from "../utils/logger.js";
import {
  checkModerationCache,
  setModerationCache,
} from "./moderation-cache.js";

const project =
  process.env.GOOGLE_CLOUD_PROJECT_ID || "unique-spirit-482300-s4";
const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";

// Initialize Vertex AI with Auth support for Railway/Production
let vertexAIConfig: any = { project, location };

if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    vertexAIConfig.googleAuthOptions = { credentials };
    logger.info(
      "[VertexModeration] Using service account from environment JSON",
    );
  } catch (err) {
    logger.error(
      "[VertexModeration] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON",
    );
  }
}

const vertex_ai = new VertexAI(vertexAIConfig);

export interface ModerationResult {
  allowed: boolean;
  reasons: string[];
  severity: "low" | "medium" | "high";
}

/**
 * Moderate content using Vertex AI (Gemini)
 * We use safety settings to determine if content should be blocked.
 */
export async function moderateContent(
  content: string,
): Promise<ModerationResult> {
  if (process.env.VERTEX_AI_ENABLED !== "true") {
    return { allowed: true, reasons: [], severity: "low" };
  }

  // 1. Check Cache first
  const cached = await checkModerationCache(content);
  if (cached) return cached;

  try {
    const model = vertex_ai.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `Analyze the following content for moderation according to Quebec community standards. 
    Content: "${content}"
    
    Return a JSON object with:
    - allowed: boolean
    - reasons: array of strings (e.g., 'toxic', 'spam', 'hate_speech')
    - severity: 'low', 'medium', or 'high'
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON response. Note: Gemini might wrap JSON in backticks.
    const jsonStr = text.replace(/```json|```/g, "").trim();
    if (!jsonStr) throw new Error("Empty response from Gemini");
    const moderation = JSON.parse(jsonStr);

    const modResult: ModerationResult = {
      allowed: moderation.allowed ?? true,
      reasons: moderation.reasons ?? [],
      severity: moderation.severity ?? "low",
    };

    // Store in cache
    await setModerationCache(content, modResult);

    return modResult;
  } catch (error: any) {
    logger.error(`[VertexModeration] Error: ${error.message}`);
    // Safe-fail: if AI fails, we might want to flag it for manual review but allow it for now?
    // Or block it? For Zyeute, we usually prefer to keep the Hive buzzing but flag it.
    return { allowed: true, reasons: ["ai_error"], severity: "low" };
  }
}
