import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for the browser (Vite SPA).
 *
 * Reads the DSN from `VITE_SENTRY_DSN`. Vite inlines `import.meta.env.VITE_*`
 * at BUILD time, so this var must be present in the Vercel build environment
 * (a redeploy is required after changing it). No-op when the DSN is absent.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.warn(
        "[Sentry] VITE_SENTRY_DSN not set — frontend error reporting disabled.",
      );
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
  });
}

/**
 * Dev/verification helper: when the URL contains `?sentry-test=1`, send a test
 * message to Sentry to confirm the browser integration is wired up.
 */
export function maybeRunSentryTest(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("sentry-test") !== "1") return;

  Sentry.captureMessage(
    "[sentry-test] Frontend verification message from ?sentry-test=1",
    "info",
  );
  console.info("[Sentry] Test message captured (?sentry-test=1).");
}

export { Sentry };
