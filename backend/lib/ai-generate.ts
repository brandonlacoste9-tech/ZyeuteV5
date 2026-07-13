/**
 * generateText / streamText wrappers that always enable Sentry AI telemetry.
 * Prefer these over importing from "ai" directly for instrumented LLM calls.
 */
import {
  generateText as baseGenerateText,
  streamText as baseStreamText,
} from "ai";
import { aiTelemetry } from "./sentry-ai.js";

type GenerateArgs = Parameters<typeof baseGenerateText>[0];
type StreamArgs = Parameters<typeof baseStreamText>[0];

export function generateText(options: GenerateArgs) {
  if (options?.experimental_telemetry) {
    return baseGenerateText(options);
  }
  return baseGenerateText({
    ...options,
    ...aiTelemetry(),
  });
}

export function streamText(options: StreamArgs) {
  if (options?.experimental_telemetry) {
    return baseStreamText(options);
  }
  return baseStreamText({
    ...options,
    ...aiTelemetry(),
  });
}

export { aiTelemetry, setAiConversationId } from "./sentry-ai.js";
