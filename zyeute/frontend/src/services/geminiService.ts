/**
 * Gemini AI Service
 * Handles text generation, captioning, and hashtags
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";

const geminiServiceLogger = logger.withContext("GeminiService");

// Initialize Gemini
const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

/**
 * Generate a caption for an image or topic
 */
export async function generateCaption(
  topic: string,
  tone: string = "fun",
): Promise<string> {
  if (!genAI) {
    geminiServiceLogger.warn(
      "⚠️ No Gemini API Key found. Using mock response.",
    );
    return "Wow! C'est vraiment malade! 🔥 #Quebec #Fun";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const prompt = `Génère une courte légende Instagram amusante en français québécois (joual léger) sur le sujet: "${topic}". Ton: ${tone}. Ajoute 2-3 emojis.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    geminiServiceLogger.error("Caption generation error:", error);
    return "Impossible de générer la légende pour le moment. 😅";
  }
}

/**
 * Generate hashtags for a topic
 */
export async function generateHashtags(topic: string): Promise<string[]> {
  if (!genAI) {
    return ["#Quebec", "#Zyeute", "#Fun", "#Trending"];
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const prompt = `Génère 5 hashtags populaires pour Instagram liés à "${topic}" dans un contexte québécois. Réponds SEULEMENT avec les hashtags séparés par des espaces.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.split(" ").filter((tag) => tag.startsWith("#"));
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
