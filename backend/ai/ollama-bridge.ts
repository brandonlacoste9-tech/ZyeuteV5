import { logger } from "../utils/logger.js";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:12b";

export class OllamaModel {
  private modelName: string;
  private systemInstruction?: string;

  constructor(modelName: string, systemInstruction?: string) {
    this.modelName = OLLAMA_MODEL; // Override with configured local model
    this.systemInstruction = systemInstruction;
  }

  async generateContent(
    prompt: string | { role: string; parts: { text: string }[] }[],
  ) {
    try {
      logger.info(`[OllamaBridge] Generating content with ${this.modelName}`);

      const messages = [];
      if (this.systemInstruction) {
        messages.push({ role: "system", content: this.systemInstruction });
      }

      if (typeof prompt === "string") {
        messages.push({ role: "user", content: prompt });
      } else {
        // Handle Gemini content array format
        // prompt is Content[]
        prompt.forEach((content: any) => {
          const role = content.role === "model" ? "assistant" : content.role;
          const contentParts = content.parts
            .map((p: any) => {
              if (p.text) return { type: "text", text: p.text };
              if (p.inlineData) {
                return {
                  type: "image_url",
                  image_url: {
                    url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`,
                  },
                };
              }
              return null;
            })
            .filter(Boolean);

          // If only text, simplify to string for broader compatibility if needed,
          // but OpenAI Vision expects array. Ollama mostly supports array now.
          messages.push({ role, content: contentParts });
        });
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const apiKey = process.env.OLLAMA_API_KEY || process.env.OPENAI_API_KEY;
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: this.modelName,
          messages: messages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content || "";

      // Mimic Gemini Response structure
      return {
        response: {
          text: () => text,
        },
      };
    } catch (error: any) {
      logger.error("[OllamaBridge] Generation failed:", error);
      throw error;
    }
  }

  async embedContent(text: string) {
    // Basic embedding fallback (or use ollama embedding if needed)
    // For now returning zeros to prevent crash, user said LTX-2 for video, Gemma for logic.
    // Embedding is usually for search.
    return {
      embedding: { values: new Array(384).fill(0) },
    };
  }
}
