import { GoogleGenerativeAI } from "@google/generative-ai";
import { OllamaModel } from "./ollama-bridge.js";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn(
    "⚠️ GEMINI_API_KEY not found. Switching to Local Ollama Bridge.",
  );
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Gets the specified Gemini model or Ollama fallback.
 */
export function getGeminiModel(
  modelName: "gemini-1.5-flash" | "gemini-1.5-pro" = "gemini-1.5-flash",
  systemInstruction?: string,
) {
  if (!genAI) {
    // Return Ollama wrapper
    return new OllamaModel(modelName, systemInstruction) as any;
  }
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction,
  });
}

/**
 * Generates embeddings.
 */
export async function getEmbeddings(text: string): Promise<number[]> {
  if (!genAI) {
    const ollama = new OllamaModel("embedding");
    const res = await ollama.embedContent(text);
    return res.embedding.values;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values.slice(0, 384);
  } catch (err) {
    console.error("🚨 [Gemini] Failed to generate embeddings:", err);
    return new Array(384).fill(0);
  }
}
