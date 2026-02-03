import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  console.log("⚠️ Triggering Sentry Test Error...");
  const err = new Error(
    "🚀 Sentry Test Error: Zyeute V5 is reporting for duty!",
  );
  try {
    const Sentry = await import("@sentry/node");
    Sentry.captureException(err);
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
