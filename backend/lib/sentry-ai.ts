/**
 * Sentry AI monitoring helpers for Zyeuté.
 *
 * - Vercel AI SDK (`ai` package) is auto-instrumented via vercelAIIntegration
 *   when experimental_telemetry is enabled on generateText/streamText.
 * - DeepSeek/custom fetch clients use startGenAiChatSpan manual spans.
 *
 * Prompt/output capture is OFF by default (PII). Enable only after product OK.
 */

import { Sentry } from "../sentry.js";

/** Whether to send prompts/completions to Sentry (PII). Default false. */
export function shouldRecordAiContent(): boolean {
  return process.env.SENTRY_AI_RECORD_CONTENT === "true";
}

/**
 * Spread into generateText / streamText for Sentry Vercel AI integration.
 * Does not record message bodies unless SENTRY_AI_RECORD_CONTENT=true.
 */
export function aiTelemetry(
  metadata?: Record<string, string | number | boolean>,
) {
  const record = shouldRecordAiContent();
  return {
    experimental_telemetry: {
      isEnabled: true,
      recordInputs: record,
      recordOutputs: record,
      metadata: metadata ?? {},
    },
  } as const;
}

/**
 * Group multi-turn Ti-Guy / agent sessions in Sentry Conversations.
 * Safe no-op if SDK/API unavailable.
 */
export function setAiConversationId(conversationId: string | undefined | null) {
  if (!conversationId) return;
  try {
    const anySentry = Sentry as typeof Sentry & {
      setConversationId?: (id: string) => void;
    };
    anySentry.setConversationId?.(conversationId);
  } catch {
    /* ignore */
  }
}

export type GenAiChatParams = {
  model: string;
  operationName?: string;
  agentName?: string;
  /** Only attached when SENTRY_AI_RECORD_CONTENT=true */
  inputMessages?: unknown;
};

/**
 * Wrap a raw LLM HTTP call (e.g. DeepSeek fetch) in a gen_ai.chat span.
 */
export async function startGenAiChatSpan<T>(
  params: GenAiChatParams,
  fn: () => Promise<T>,
  extractUsage?: (result: T) => {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    outputText?: string;
  },
): Promise<T> {
  const opName = params.operationName || "chat";
  const model = params.model || "unknown";

  return Sentry.startSpan(
    {
      op: `gen_ai.${opName}`,
      name: `${opName} ${model}`,
      attributes: {
        "gen_ai.request.model": model,
        "gen_ai.operation.name": opName,
        ...(params.agentName ? { "gen_ai.agent.name": params.agentName } : {}),
        ...(shouldRecordAiContent() && params.inputMessages
          ? {
              "gen_ai.input.messages": JSON.stringify(params.inputMessages),
            }
          : {}),
      },
    },
    async (span) => {
      const result = await fn();
      try {
        const usage = extractUsage?.(result);
        if (usage?.inputTokens != null) {
          span.setAttribute("gen_ai.usage.input_tokens", usage.inputTokens);
        }
        if (usage?.outputTokens != null) {
          span.setAttribute("gen_ai.usage.output_tokens", usage.outputTokens);
        }
        if (usage?.totalTokens != null) {
          span.setAttribute("gen_ai.usage.total_tokens", usage.totalTokens);
        }
        if (shouldRecordAiContent() && usage?.outputText != null) {
          span.setAttribute(
            "gen_ai.output.messages",
            JSON.stringify([
              {
                role: "assistant",
                parts: [{ type: "text", content: usage.outputText }],
              },
            ]),
          );
        }
      } catch {
        /* ignore attribute failures */
      }
      return result;
    },
  );
}
