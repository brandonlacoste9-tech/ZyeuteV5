import * as Sentry from "@sentry/node";

/**
 * Initialize Sentry for the Express backend.
 *
 * Reads the DSN from `SENTRY_DSN`. If the var is absent the SDK is a no-op,
 * so this is safe to call unconditionally in every environment.
 *
 * Must run before Express/HTTP modules are imported elsewhere so the
 * auto-instrumentation can patch them — `backend/index.ts` imports this first.
 *
 * AI monitoring:
 * - vercelAIIntegration for `ai` package generateText/streamText
 * - tracesSampler keeps gen_ai spans at 100% while other traffic uses SENTRY_TRACES_SAMPLE_RATE
 * - Prompt/output capture only if SENTRY_AI_RECORD_CONTENT=true (PII)
 */
let initialized = false;

function baseSampleRate(): number {
  const n = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1");
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.1;
}

/** Prefer full capture for AI agent trees so child gen_ai spans are not dropped. */
function tracesSampler(samplingContext: {
  name?: string;
  attributes?: Record<string, unknown>;
  parentSampled?: boolean;
  transactionContext?: { name?: string; op?: string };
}): number {
  if (samplingContext.parentSampled === true) return 1;
  if (samplingContext.parentSampled === false) return 0;

  const name =
    samplingContext.name || samplingContext.transactionContext?.name || "";
  const op =
    (samplingContext.attributes?.["sentry.op"] as string | undefined) ||
    samplingContext.transactionContext?.op ||
    "";
  const blob = `${op} ${name}`.toLowerCase();

  if (
    blob.includes("gen_ai") ||
    blob.includes("deepseek") ||
    blob.includes("ti-guy") ||
    blob.includes("tiguy") ||
    blob.includes("vertex") ||
    blob.includes("openai") ||
    blob.includes("gemini")
  ) {
    return 1;
  }

  return baseSampleRate();
}

export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.warn(
      "⚠️ [Sentry] SENTRY_DSN not set — error reporting disabled (no events will be sent).",
    );
    return;
  }

  const recordContent = process.env.SENTRY_AI_RECORD_CONTENT === "true";
  const integrations: ReturnType<typeof Sentry.vercelAIIntegration>[] = [];

  // Vercel AI SDK (`ai` + @ai-sdk/*) — auto spans when experimental_telemetry is on
  try {
    if (typeof Sentry.vercelAIIntegration === "function") {
      integrations.push(
        Sentry.vercelAIIntegration({
          recordInputs: recordContent,
          recordOutputs: recordContent,
        }),
      );
    }
  } catch {
    /* older SDK without integration */
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    release: process.env.RENDER_GIT_COMMIT || undefined,
    tracesSampler,
    // Standalone gen_ai spans (large inputs/outputs won't blow transaction size)
    streamGenAiSpans: true,
    // PII / prompts — OFF unless explicitly opted in
    sendDefaultPii: recordContent,
    integrations: (defaults) => [...defaults, ...integrations],
  });

  console.log(
    `✅ [Sentry] Initialized for backend (env: ${process.env.NODE_ENV || "development"}, AI monitoring on, content=${recordContent}).`,
  );
}

// Initialize on import so this module can be loaded first (before Express/HTTP)
// to let Sentry's auto-instrumentation patch them. `backend/preload.ts` loads
// the .env files, and is imported before this module in `backend/index.ts`.
initSentry();

export { Sentry };
