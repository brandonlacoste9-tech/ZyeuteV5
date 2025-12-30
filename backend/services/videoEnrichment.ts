import { getGeminiModel } from "../ai/google.js";
import fs from "fs/promises";
import { db } from "../storage.js";
import { posts } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export interface VideoScoutResult {
  summary: string;
  tags: string[];
  vibe: string;
  viralScore: number;
  safetyApproved: boolean;
  safetyReason?: string;
}

/**
 * Zyeuté Scouter - Extracts localized Quebec context using Gemini 1.5 Flash.
 * Analyzes video content to generate summaries, tags, and safety/viral metrics.
 */
export async function scoutVideo(
  filePath: string,
  postId: string,
): Promise<VideoScoutResult | null> {
  const model = getGeminiModel("gemini-1.5-flash"); // Flash is perfect for high-speed analysis
  if (!model) {
    console.warn("[Scouter] Gemini model not available.");
    return null;
  }

  try {
    // 1. Read video file
    const videoBuffer = await fs.readFile(filePath);
    const base64Video = videoBuffer.toString("base64");

    const prompt = `
      Tu es Ti-Guy, l'assistant intelligent de Zyeuté, le réseau social 100% Québécois.
      Tu dois analyser cette vidéo pour enrichir l'expérience de l'utilisateur et sécuriser la communauté.
      
      Instructions:
      1. Donne un court résumé "Ti-Guy Style" (en Joual, chaleureux, max 2 phrases). 
      2. Identifie 3 à 5 mots-clés (hashtags) pertinents (Ville, activité, objet, bouffe).
      3. Identifie une 'vibe' principale (Ex: Urbain, Nature, Party, Relax, Foodie).
      4. VIRALITÉ: Donne un score de 0 à 100 sur le potentiel de "Buzz" au Québec.
      5. SÉCURITÉ: Vérifie si le contenu respecte les règles (Pas de haine, violence extrême, ou nudité). 
         Note: Les sacres québécois (Tabarnak, etc.) sont acceptés si utilisés pour l'emphase, sauf si dirigés comme insultes haineuses.
      
      IMPORTANT: Reste 100% dans le contexte du Québec.
      
      Réponds UNIQUEMENT en format JSON:
      {
        "summary": "...", 
        "tags": ["#tag1", "#tag2"],
        "vibe": "...",
        "viralScore": 85,
        "safetyApproved": true,
        "safetyReason": ""
      }
    `;

    // 2. Multimodal Generation
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "video/mp4",
          data: base64Video,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();

    // 3. Parse JSON Result
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Scouter] No valid JSON found in AI response:", text);
      return null;
    }

    const scoutData: VideoScoutResult = JSON.parse(jsonMatch[0]);

    // 4. Persistence
    await db
      .update(posts)
      .set({
        aiDescription: scoutData.summary,
        aiLabels: scoutData.tags,
        viralScore: scoutData.viralScore,
        safetyFlags: {
          approved: scoutData.safetyApproved,
          reason: scoutData.safetyReason,
          checkedAt: new Date().toISOString(),
        },
      })
      .where(eq(posts.id, postId));

    console.log(
      `✅ [Scouter] Vidéo ${postId} analysée par Ti-Guy. Buzz: ${scoutData.viralScore}%, Sécurité: ${scoutData.safetyApproved ? "OK" : "FAIL"}`,
    );
    return scoutData;
  } catch (error: any) {
    console.error(
      `❌ [Scouter] Échec de l'analyse pour le post ${postId}:`,
      error.message,
    );
    return null;
  }
}
