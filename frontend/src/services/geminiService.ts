/**
 * Gemini AI Service
 * Handles text generation, captioning, and hashtags
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";

const geminiServiceLogger = logger.withContext("GeminiService");

// Initialize Gemini
// Keys removed from client to prevent exposure
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Generate a caption for an image or topic
 */
export async function generateCaption(
  topic: string,
  tone: string = "fun",
): Promise<string> {
  try {
    const prompt = `Génère une courte légende Instagram amusante en français québécois (joual léger) sur le sujet: "${topic}". Ton: ${tone}. Ajoute 2-3 emojis.`;

    const res = await fetch(`${BACKEND_URL}/api/ai/proxy/gemini`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model: "gemini-2.0-flash-exp" }),
    });

    if (!res.ok) throw new Error("Backend proxy failed");

    const result = await res.json();
    return (
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Wow! C'est vraiment malade! 🔥 #Quebec #Fun"
    );
  } catch (error) {
    geminiServiceLogger.error("Caption generation error:", error);
    return "Impossible de générer la légende pour le moment. 😅";
  }
}

/**
 * Generate hashtags for a topic
 */
export async function generateHashtags(topic: string): Promise<string[]> {
  try {
    const prompt = `Génère 5 hashtags populaires pour Instagram liés à "${topic}" dans un contexte québécois. Réponds SEULEMENT avec les hashtags séparés par des espaces.`;

    const res = await fetch(`${BACKEND_URL}/api/ai/proxy/gemini`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model: "gemini-2.0-flash-exp" }),
    });

    if (!res.ok) throw new Error("Backend proxy failed");

    const result = await res.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return (
      text.split(" ").filter((tag: string) => tag.startsWith("#")) || [
        "#Quebec",
        "#Zyeute",
      ]
    );
  } catch (error) {
    geminiServiceLogger.error("Hashtag generation error:", error);
    return ["#Quebec", "#Zyeute"];
  }
}

/**
 * Analyze an image (stub for compatibility)
 */
export async function analyzeImage(file: File): Promise<any> {
  // This functionality is now better handled by moderationService.ts
  // Keeping this stub to prevent breaking changes in legacy code
  return { safe: true, labels: ["image", "content"] };
}
