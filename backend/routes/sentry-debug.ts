import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  console.log("⚠️ Triggering Sentry Test Error...");
  const err = new Error(
    "🚀 Sentry Test Error: Zyeute V5 is reporting for duty!",
  );
  try {
    // Optional Sentry import - only capture if available
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Optional dependency, may not be installed
      const Sentry = await import("@sentry/node");
      Sentry.captureException(err);
    } catch (sentryError) {
      // Sentry not installed or not configured - log to console instead
      console.error("Sentry not available:", sentryError);
    }
    res.status(500).json({
      success: false,
      message: "Test error triggered and sent to Sentry.",
      error_id: (res as any).sentry,
    });
  } catch (_) {
    // @sentry/node not installed or Sentry not configured
    console.warn("Sentry not available:", err.message);
    res.status(503).json({
      success: false,
      message: "Sentry not configured. Install @sentry/node to enable.",
    });
  }
});

export default router;
