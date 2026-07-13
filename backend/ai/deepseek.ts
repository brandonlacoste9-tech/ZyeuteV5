/**
 * DeepSeek API Client (Fetch-based)
 * Replaces OpenAI SDK to reduce dependencies and potential conflicts.
 * Instrumented with Sentry gen_ai.chat spans (manual — not OpenAI SDK).
 */

import { startGenAiChatSpan } from "../lib/sentry-ai.js";

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

async function createCompletion(
  options: CompletionOptions,
): Promise<DeepSeekResponse> {
  if (!API_KEY) throw new Error("Missing DEEPSEEK_API_KEY");

  const maxRetries = 3;
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: options.model || "deepseek-v4-flash",
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens,
          response_format: options.response_format,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API Error ${response.status}: ${errorText}`);
      }

      return (await response.json()) as DeepSeekResponse;
    } catch (err) {
      lastError = err;
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, i)),
      );
    }
  }

  throw lastError;
}

export const deepseek = {
  chat: {
    completions: {
      create: async (options: CompletionOptions): Promise<DeepSeekResponse> => {
        const model = options.model || "deepseek-v4-flash";
        return startGenAiChatSpan(
          {
            model,
            operationName: "chat",
            agentName: "deepseek",
            inputMessages: options.messages.map((m) => ({
              role: m.role,
              parts: [{ type: "text", content: m.content }],
            })),
          },
          () => createCompletion(options),
          (result) => ({
            inputTokens: result.usage?.prompt_tokens,
            outputTokens: result.usage?.completion_tokens,
            totalTokens: result.usage?.total_tokens,
            outputText: result.choices?.[0]?.message?.content,
          }),
        );
      },
    },
  },
};
