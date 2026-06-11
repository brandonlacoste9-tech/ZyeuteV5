import * as Sentry from "@sentry/node";

/**
 * Initialize Sentry for the Express backend.
 *
 * Reads the DSN from `SENTRY_DSN`. If the var is absent the SDK is a no-op,
 * so this is safe to call unconditionally in every environment.
 *
 * Must run before Express/HTTP modules are imported elsewhere so the
 * auto-instrumentation can patch them — `backend/index.ts` imports this first.
 */
let initialized = false;

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

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    // Keep a low trace rate on the server to limit performance event volume.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    release: process.env.RENDER_GIT_COMMIT || undefined,
  });

  console.log(
    `✅ [Sentry] Initialized for backend (env: ${process.env.NODE_ENV || "development"}).`,
  );
}

// Initialize on import so this module can be loaded first (before Express/HTTP)
// to let Sentry's auto-instrumentation patch them. `backend/preload.ts` loads
// the .env files, and is imported before this module in `backend/index.ts`.
initSentry();

export { Sentry };
