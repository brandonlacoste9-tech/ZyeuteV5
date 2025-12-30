/**
 * DeepSeek API Client (Fetch-based)
 * Replaces OpenAI SDK to reduce dependencies and potential conflicts.
 */

const API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = "https://api.deepseek.com/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
}

interface DeepSeekResponse {
  id: string;
  choices: Array<{
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string;
    index: number;
    logprobs: null;
  }>;
  created: number;
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const deepseek = {
  chat: {
    completions: {
      create: async (options: CompletionOptions): Promise<DeepSeekResponse> => {
        if (!API_KEY) throw new Error("Missing DEEPSEEK_API_KEY");

        const maxRetries = 3;
        let lastError: any;

        for (let i = 0; i < maxRetries; i++) {
          try {
            const response = await fetch(BASE_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
              },
              body: JSON.stringify({
                model: options.model || "deepseek-chat",
                messages: options.messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens,
                response_format: options.response_format,
                stream: false,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `DeepSeek API Error ${response.status}: ${errorText}`,
              );
            }

            return await response.json();
          } catch (err) {
            lastError = err;
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, i)),
            ); // Exponential backoff
          }
        }

        throw lastError;
      },
    },
  },
};
