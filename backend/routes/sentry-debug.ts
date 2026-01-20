import { Router } from "express";
import * as Sentry from "@sentry/node";

const router = Router();

router.get("/", (req, res) => {
  console.log("⚠️ Triggering Sentry Test Error...");
  
  try {
    throw new Error("🚀 Sentry Test Error: Zyeute V5 is reporting for duty!");
  } catch (e) {
    Sentry.captureException(e);
    res.status(500).json({ 
      success: false, 
      message: "Test error triggered and sent to Sentry.",
      error_id: res.sentry
    });
  }
});

export default router;
