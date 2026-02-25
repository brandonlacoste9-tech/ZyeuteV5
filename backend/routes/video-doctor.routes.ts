/**
 * 🏥 Video Doctor API Routes
 * Health checks and auto-repair for videos
 */

import { Router } from "express";
import { 
  diagnoseVideo, 
  fixVideo, 
  healthCheckAllVideos,
  autoFixVideos 
} from "../services/video-doctor.js";
import { logger } from "../utils/logger.js";

const router = Router();

// Admin middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Check if user is admin/moderator
  if (req.userRole !== "admin" && req.userRole !== "moderator") {
    return res.status(403).json({ error: "Admin access required" });
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
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error("[VideoDoctor] Health check error:", error);
    res.status(500).json({
      success: false,
      error: error.message
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
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error("[VideoDoctor] Fix error:", error);
    res.status(500).json({
      success: false,
      error: error.message
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
      healthy: reports.filter(r => r.status === "healthy").length,
      sick: reports.filter(r => r.status === "sick").length,
      critical: reports.filter(r => r.status === "critical").length,
      dead: reports.filter(r => r.status === "dead").length,
      autoFixable: reports.filter(r => r.canAutoFix).length
    };
    
    res.json({
      success: true,
      summary,
      reports: reports.filter(r => r.status !== "healthy"), // Only return problematic videos
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error("[VideoDoctor] Health check all error:", error);
    res.status(500).json({
      success: false,
      error: error.message
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
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error("[VideoDoctor] Auto-fix error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/video-doctor/fix-pending
 * Fix all pending videos (admin only)
 */
router.post("/fix-pending", requireAdmin, async (req, res) => {
  try {
    const { pool } = await import("../storage.js");
    
    // Count pending videos
    const countResult = await pool.query(`
      SELECT COUNT(*) as pending_count
      FROM publications 
      WHERE type = 'video' AND processing_status = 'pending'
    `);
    
    const pendingCount = parseInt(countResult.rows[0].pending_count);
    
    if (pendingCount === 0) {
      return res.json({
        success: true,
        message: "No pending videos to fix",
        fixed: 0
      });
    }
    
    // Fix all pending videos
    const result = await pool.query(`
      UPDATE publications 
      SET processing_status = 'completed',
          updated_at = NOW()
      WHERE type = 'video' 
        AND processing_status = 'pending'
      RETURNING id
    `);
    
    const fixedCount = result.rowCount;
    
    logger.info(`[VideoDoctor] Fixed ${fixedCount} pending videos`);
    
    res.json({
      success: true,
      message: `Fixed ${fixedCount} pending videos`,
      fixed: fixedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error("[VideoDoctor] Fix pending error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video-doctor/stats
 * Get video health statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const { pool } = await import("../storage.js");
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_videos,
        COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN processing_status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN processing_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN thumbnail_url IS NULL THEN 1 END) as missing_thumbnails,
        COUNT(CASE WHEN media_url IS NULL THEN 1 END) as missing_source
      FROM publications 
      WHERE type = 'video'
    `);
    
    res.json({
      success: true,
      stats: stats.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error("[VideoDoctor] Stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
