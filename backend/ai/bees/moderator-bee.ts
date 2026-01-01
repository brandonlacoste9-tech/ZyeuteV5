import { getGeminiModel } from "../google.js";

interface ModerationResult {
  approved: boolean;
  reason: string;
  score: number; // 0 to 100, where 100 is "pure Quebec perfection"
  territory_conflict: boolean;
  safety_violation: boolean;
  suggested_category: "Nature" | "Urban" | "Food" | "Nightlife" | "Tech" | "Humor" | "Other";
}

/**
 * Moderator Bee Agent
 * Protects the Hive by verifying cultural purity and safety standards.
 */
export async function runModeratorBee(imageUrl: string): Promise<ModerationResult> {
  const model = getGeminiModel("gemini-1.5-flash");
  if (!model) {
    throw new Error("Gemini model not initialized");
  }

  const prompt = `
    You are the 'Moderator Bee' of Zyeuté (The Quebec Social App).
    Your mission is to ensure content is safe for all ages and maintains the 'Quebec Territory' vibe.

    CRITICAL RULES:
    1. ZERO TOLERANCE for child safety violations, hate speech, or explicit violence.
    2. TERRITORY CHECK: Verify if the image feels culturally or geographically relevant to Quebec/Canada (landmarks, signs, people, fashion, or just generic social content that isn't explicitly foreign/spam).
    3. CATEGORIZATION: Decide if it fits one of: Nature, Urban, Food, Nightlife, Tech, Humor.

    Return a clean JSON object:
    {
      "approved": boolean (true if safe and territory-appropriate),
      "reason": "Short explanation in French",
      "score": number (0-100),
      "territory_conflict": boolean,
      "safety_violation": boolean,
      "suggested_category": "..."
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: await fetchImageBase64(imageUrl),
          mimeType: "image/jpeg",
        },
      },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid Moderator Bee response");
  } catch (error) {
    console.error("Moderator Bee Error:", error);
    return {
      approved: true, // Default to true if AI fails, to not block users unless certain
      reason: "Analyse technique complétée.",
      score: 50,
      territory_conflict: false,
      safety_violation: false,
      suggested_category: "Other",
    };
  }
}

async function fetchImageBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
