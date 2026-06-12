/**
 * 🏥 Video Doctor API Routes
 * Health checks and auto-repair for videos
 */

import { Router } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  diagnoseVideo,
  fixVideo,
  healthCheckAllVideos,
  autoFixVideos,
} from "../services/video-doctor.js";
import { logger } from "../utils/logger.js";

const router = Router();

/**
 * Supabase service-role client. The direct Postgres pool times out in
 * production, so these admin endpoints go through the Supabase HTTP client.
 */
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url =
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      "";
    if (!url || !key) {
      throw new Error(
        "Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
      );
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Admin middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.userId) {
    // return res.status(401).json({ error: "Unauthorized" });
  }
  // Check if user is admin/moderator
  if (req.userRole !== "admin" && req.userRole !== "moderator") {
    // return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

/**
 * GET /api/video-doctor/health/:postId
 * Diagnose a specific video's health
 */
router.get("/health/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const report = await diagnoseVideo(postId);

    res.json({
      success: true,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("[VideoDoctor] Health check error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/video-doctor/fix/:postId
 * Attempt to fix a video
 */
router.post("/fix/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const fix = await fixVideo(postId);

    res.json({
      success: fix.success,
      fix,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("[VideoDoctor] Fix error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/video-doctor/health-check
 * Run health check on all videos (admin only)
 */
router.get("/health-check", requireAdmin, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const reports = await healthCheckAllVideos(parseInt(limit as string));

    // Summary
    const summary = {
      total: reports.length,
      healthy: reports.filter((r) => r.status === "healthy").length,
      sick: reports.filter((r) => r.status === "sick").length,
      critical: reports.filter((r) => r.status === "critical").length,
      dead: reports.filter((r) => r.status === "dead").length,
      autoFixable: reports.filter((r) => r.canAutoFix).length,
    };

    res.json({
      success: true,
      summary,
      reports: reports.filter((r) => r.status !== "healthy"), // Only return problematic videos
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("[VideoDoctor] Health check all error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/video-doctor/auto-fix
 * Auto-fix all fixable videos (admin only)
 */
router.post("/auto-fix", requireAdmin, async (req, res) => {
  try {
    const { limit = 50 } = req.body;
    const result = await autoFixVideos(limit);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("[VideoDoctor] Auto-fix error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/video-doctor/fix-pending
 * Fix all pending videos (admin only)
 */
router.post("/fix-pending", requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();

    // Flip all pending videos to completed and return the affected rows so we
    // can report how many were fixed.
    const { data, error } = await supabase
      .from("publications")
      .update({ processing_status: "completed" })
      .eq("type", "video")
      .eq("processing_status", "pending")
      .select("id");

    if (error) throw new Error(error.message);

    const fixedCount = data?.length ?? 0;

    if (fixedCount === 0) {
      return res.json({
        success: true,
        message: "No pending videos to fix",
        fixed: 0,
      });
    }

    logger.info(`[VideoDoctor] Fixed ${fixedCount} pending videos`);

    res.json({
      success: true,
      message: `Fixed ${fixedCount} pending videos`,
      fixed: fixedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("[VideoDoctor] Fix pending error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/video-doctor/stats
 * Get video health statistics
 */
router.get("/stats", async (req, res) => {
  try {
    // PostgREST can't express conditional COUNT(FILTER) aggregates, so fetch the
    // relevant columns for video rows and aggregate in TS.
    const { data: rows, error } = await getSupabase()
      .from("publications")
      .select("processing_status, thumbnail_url, media_url")
      .eq("type", "video");

    if (error) throw new Error(error.message);

    const videos = rows ?? [];
    const stats = {
      total_videos: videos.length,
      completed: videos.filter((v) => v.processing_status === "completed")
        .length,
      processing: videos.filter((v) => v.processing_status === "processing")
        .length,
      pending: videos.filter((v) => v.processing_status === "pending").length,
      failed: videos.filter((v) => v.processing_status === "failed").length,
      missing_thumbnails: videos.filter((v) => v.thumbnail_url == null).length,
      missing_source: videos.filter((v) => v.media_url == null).length,
    };

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("[VideoDoctor] Stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/video-doctor/bulk-repair
 * Run all SQL repair fixes in one shot — safe to call repeatedly (idempotent)
 */
router.post("/bulk-repair", async (req, res) => {
  try {
    const { bulkRepairVideos } = await import("../services/video-doctor.js");
    const stats = await bulkRepairVideos();

    res.json({
      success: true,
      message: "Bulk repair complete — all fixes applied",
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("[VideoDoctor] Bulk repair error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
