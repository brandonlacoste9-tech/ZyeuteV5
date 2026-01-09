import "../env-loader.js";

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekConfig {
  apiKey: string;
  model: string;
  temperature?: number;
}

/**
 * NeurosphereClient
 * Direct interface to the DeepSeek V3 Cognitive Engine.
 */
export class NeurosphereClient {
  private config: DeepSeekConfig;
  private endpoint = "https://api.deepseek.com/v1/chat/completions";

  constructor() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.warn(
        "⚠️ [Neurosphere] Warning: DEEPSEEK_API_KEY is not set. The Hive Mind will be limited.",
      );
    }

    this.config = {
      apiKey: apiKey || "",
      model: "deepseek-chat",
      temperature: 0.7,
    };
  }

  /**
   * Performs a cognitive cycle (inference).
   */
  async think(messages: DeepSeekMessage[], context?: string): Promise<string> {
    if (!this.config.apiKey) return "Error: Logic Core Offline (Missing Key)";

    try {
      // In a real biological system, context is injected into short-term memory
      const augmentedMessages = context
        ? [
            { role: "system" as const, content: `Context: ${context}` },
            ...messages,
          ]
        : messages;

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: augmentedMessages,
          temperature: this.config.temperature,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `Neurosphere Synapse Failure: ${response.status} - ${error}`,
        );
      }

      const data: any = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("🔴 [Neurosphere] Cognitive Error:", error);
      return "I am unable to process this thought right now.";
    }
  }
}

export const neurosphere = new NeurosphereClient();
