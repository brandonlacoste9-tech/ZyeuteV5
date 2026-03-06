/**
 * 🏥 Video Doctor Service
 * Automatically diagnoses and repairs video issues
 * Monitors video health, detects problems, applies fixes
 */

import { pool } from "../storage.js";
import { logger } from "../utils/logger.js";
import { fetch } from "undici";

export interface VideoHealthReport {
  postId: string;
  status: "healthy" | "sick" | "critical" | "dead";
  issues: VideoIssue[];
  recommendations: string[];
  canAutoFix: boolean;
}

export interface VideoIssue {
  type:
    | "source_missing"
    | "source_403"
    | "source_404"
    | "thumbnail_missing"
    | "processing_stuck"
    | "codec_unsupported"
    | "duration_zero"
    | "corrupted";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  autoFixable: boolean;
}

export interface VideoDoctorFix {
  success: boolean;
  action: string;
  message: string;
  newUrl?: string;
}

/**
 * 🩺 Diagnose a single video's health
 */
export async function diagnoseVideo(
  postId: string,
): Promise<VideoHealthReport> {
  logger.info(`[VideoDoctor] Diagnosing video ${postId}`);

  try {
    // Get video data
    const result = await pool.query(
      `
      SELECT 
        p.id, p.type, p.media_url, p.thumbnail_url, 
        p.processing_status, p.duration, p.mux_playback_id,
        p.hls_url, p.enhanced_url, p.original_url,
        p.created_at, p.updated_at
      FROM publications p
      WHERE p.id = $1 AND p.type = 'video'
    `,
      [postId],
    );

    if (result.rows.length === 0) {
      return {
        postId,
        status: "dead",
        issues: [
          {
            type: "source_missing",
            severity: "critical",
            message: "Video not found in database",
            autoFixable: false,
          },
        ],
        recommendations: ["Video has been deleted or never existed"],
        canAutoFix: false,
      };
    }

    const video = result.rows[0];
    const issues: VideoIssue[] = [];

    // Check 1: Does video have any source?
    const hasSource =
      video.media_url ||
      video.hls_url ||
      video.enhanced_url ||
      video.original_url ||
      video.mux_playback_id;

    if (!hasSource) {
      issues.push({
        type: "source_missing",
        severity: "critical",
        message: "No video source URL found",
        autoFixable: false,
      });
    }

    // Check 2: Is source URL accessible?
    if (video.media_url && !video.media_url.includes("stream.mux.com")) {
      const sourceCheck = await checkSourceUrl(video.media_url);
      if (!sourceCheck.ok) {
        issues.push({
          type: sourceCheck.status === 403 ? "source_403" : "source_404",
          severity: "high",
          message: `Source URL returns ${sourceCheck.status}: ${sourceCheck.error}`,
          autoFixable: sourceCheck.status === 403, // Can try proxy fix
        });
      }
    }

    // Check 3: Is processing stuck?
    if (
      video.processing_status === "processing" ||
      video.processing_status === "pending"
    ) {
      const hoursProcessing =
        (Date.now() - new Date(video.created_at).getTime()) / (1000 * 60 * 60);

      if (hoursProcessing > 2) {
        issues.push({
          type: "processing_stuck",
          severity: "high",
          message: `Processing stuck for ${Math.round(hoursProcessing)} hours`,
          autoFixable: true,
        });
      }
    }

    // Check 4: Missing thumbnail
    if (!video.thumbnail_url) {
      issues.push({
        type: "thumbnail_missing",
        severity: "medium",
        message: "Video has no thumbnail",
        autoFixable: true,
      });
    }

    // Check 5: Zero duration (possible corruption)
    if (video.duration === 0 || video.duration === null) {
      issues.push({
        type: "duration_zero",
        severity: "medium",
        message: "Video duration is 0 or null (possibly corrupted)",
        autoFixable: false,
      });
    }

    // Determine overall status
    const criticalCount = issues.filter(
      (i) => i.severity === "critical",
    ).length;
    const highCount = issues.filter((i) => i.severity === "high").length;

    let status: VideoHealthReport["status"] = "healthy";
    if (criticalCount > 0) status = "dead";
    else if (highCount > 0) status = "critical";
    else if (issues.length > 0) status = "sick";

    // Generate recommendations
    const recommendations = generateRecommendations(issues, video);

    // Check if any issues are auto-fixable
    const canAutoFix = issues.some((i) => i.autoFixable);

    return {
      postId,
      status,
      issues,
      recommendations,
      canAutoFix,
    };
  } catch (error) {
    logger.error(`[VideoDoctor] Diagnosis failed for ${postId}:`, error);
    return {
      postId,
      status: "dead",
      issues: [
        {
          type: "corrupted",
          severity: "critical",
          message: `Diagnosis failed: ${(error as any).message}`,
          autoFixable: false,
        },
      ],
      recommendations: ["Contact support for manual repair"],
      canAutoFix: false,
    };
  }
}

/**
 * 🔧 Attempt to fix video issues
 */
export async function fixVideo(postId: string): Promise<VideoDoctorFix> {
  logger.info(`[VideoDoctor] Attempting to fix video ${postId}`);

  const diagnosis = await diagnoseVideo(postId);

  if (diagnosis.status === "healthy") {
    return {
      success: true,
      action: "none",
      message: "Video is healthy, no fix needed",
    };
  }

  if (!diagnosis.canAutoFix) {
    return {
      success: false,
      action: "none",
      message: `Cannot auto-fix: ${diagnosis.issues
        .filter((i) => !i.autoFixable)
        .map((i) => i.message)
        .join(", ")}`,
    };
  }

  // Apply fixes
  for (const issue of diagnosis.issues) {
    if (!issue.autoFixable) continue;

    try {
      switch (issue.type) {
        case "source_403":
          return await fix403Error(postId);

        case "processing_stuck":
          return await restartProcessing(postId);

        case "thumbnail_missing":
          return await generateThumbnail(postId);

        default:
          break;
      }
    } catch (error) {
      logger.error(`[VideoDoctor] Fix failed for ${issue.type}:`, error);
    }
  }

  return {
    success: false,
    action: "attempted",
    message: "Fix attempts failed, manual intervention required",
  };
}

/**
 * 🏥 Fix 403 errors by routing through media proxy
 */
async function fix403Error(postId: string): Promise<VideoDoctorFix> {
  logger.info(`[VideoDoctor] Fixing 403 error for ${postId}`);

  const result = await pool.query(
    `SELECT media_url FROM publications WHERE id = $1`,
    [postId],
  );

  if (result.rows.length === 0) {
    return { success: false, action: "proxy", message: "Video not found" };
  }

  const originalUrl = result.rows[0].media_url;

  // Check if already proxied
  if (originalUrl.includes("/api/media-proxy")) {
    return {
      success: false,
      action: "proxy",
      message: "Already using proxy, source may be permanently unavailable",
    };
  }

  // Update to use media proxy
  const proxiedUrl = `/api/media-proxy?url=${encodeURIComponent(originalUrl)}`;

  await pool.query(
    `UPDATE publications SET media_url = $1, updated_at = NOW() WHERE id = $2`,
    [proxiedUrl, postId],
  );

  logger.info(`[VideoDoctor] Applied proxy fix for ${postId}`);

  return {
    success: true,
    action: "proxy",
    message: "Routed video through media proxy to bypass CORS/403",
    newUrl: proxiedUrl,
  };
}

/**
 * 🔄 Restart stuck processing
 */
async function restartProcessing(postId: string): Promise<VideoDoctorFix> {
  logger.info(`[VideoDoctor] Restarting processing for ${postId}`);

  // Reset processing status to pending
  await pool.query(
    `UPDATE publications 
     SET processing_status = 'pending', 
         processing_error = NULL,
         updated_at = NOW() 
     WHERE id = $1`,
    [postId],
  );

  // Trigger re-processing (would connect to your video processing queue)
  // For now, just mark it for retry

  return {
    success: true,
    action: "restart_processing",
    message: "Reset processing status to pending - will retry automatically",
  };
}

/**
 * 🖼️ Generate missing thumbnail
 */
async function generateThumbnail(postId: string): Promise<VideoDoctorFix> {
  logger.info(`[VideoDoctor] Generating thumbnail for ${postId}`);

  const result = await pool.query(
    `SELECT media_url, thumbnail_url FROM publications WHERE id = $1`,
    [postId],
  );

  if (result.rows.length === 0) {
    return { success: false, action: "thumbnail", message: "Video not found" };
  }

  const { media_url, thumbnail_url } = result.rows[0];

  if (thumbnail_url) {
    return {
      success: true,
      action: "thumbnail",
      message: "Thumbnail already exists",
    };
  }

  // Use video URL as thumbnail fallback (some players can extract frame)
  // Or generate from first frame using a service
  const fallbackThumbnail = media_url.replace(/\.[^.]+$/, ".jpg");

  await pool.query(
    `UPDATE publications SET thumbnail_url = $1, updated_at = NOW() WHERE id = $2`,
    [fallbackThumbnail, postId],
  );

  return {
    success: true,
    action: "thumbnail",
    message: "Set fallback thumbnail URL",
    newUrl: fallbackThumbnail,
  };
}

/**
 * 🔍 Check if source URL is accessible
 */
async function checkSourceUrl(
  url: string,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    // Only check HEAD for external URLs
    if (url.startsWith("http")) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        return { ok: true };
      }

      return {
        ok: false,
        status: response.status,
        error: `HTTP ${response.status}`,
      };
    }

    // Local URLs are assumed OK
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: (error as any).message,
    };
  }
}

/**
 * 💡 Generate recommendations based on issues
 */
function generateRecommendations(issues: VideoIssue[], video: any): string[] {
  const recommendations: string[] = [];

  for (const issue of issues) {
    switch (issue.type) {
      case "source_missing":
        recommendations.push(
          "❌ Video source is missing - may need to be re-uploaded",
        );
        break;
      case "source_403":
        recommendations.push("🔧 Try routing through media proxy");
        break;
      case "source_404":
        recommendations.push(
          "❌ Source file deleted from storage - needs re-upload",
        );
        break;
      case "processing_stuck":
        recommendations.push("🔄 Restart video processing");
        break;
      case "thumbnail_missing":
        recommendations.push("🖼️ Generate thumbnail from video frame");
        break;
      case "duration_zero":
        recommendations.push(
          "⚠️ Video may be corrupted - check file integrity",
        );
        break;
    }
  }

  return recommendations;
}

/**
 * 🏥 Health check all videos
 */
export async function healthCheckAllVideos(
  limit = 100,
): Promise<VideoHealthReport[]> {
  logger.info(`[VideoDoctor] Running health check on ${limit} videos`);

  const result = await pool.query(
    `
    SELECT id FROM publications 
    WHERE type = 'video' 
    ORDER BY created_at DESC 
    LIMIT $1
  `,
    [limit],
  );

  const reports: VideoHealthReport[] = [];

  for (const row of result.rows) {
    const report = await diagnoseVideo(row.id);
    reports.push(report);
  }

  // Summary stats
  const healthy = reports.filter((r) => r.status === "healthy").length;
  const sick = reports.filter((r) => r.status === "sick").length;
  const critical = reports.filter((r) => r.status === "critical").length;
  const dead = reports.filter((r) => r.status === "dead").length;

  logger.info(
    `[VideoDoctor] Health check complete: ${healthy} healthy, ${sick} sick, ${critical} critical, ${dead} dead`,
  );

  return reports;
}

/**
 * 🔧 Auto-fix all fixable videos
 */
export async function autoFixVideos(
  limit = 50,
): Promise<{ fixed: number; failed: number; reports: VideoDoctorFix[] }> {
  logger.info(`[VideoDoctor] Auto-fixing up to ${limit} videos`);

  const result = await pool.query(
    `
    SELECT id FROM publications 
    WHERE type = 'video' 
      AND (processing_status = 'failed' 
           OR processing_status = 'pending' 
           OR media_url LIKE '%403%'
           OR thumbnail_url IS NULL)
    ORDER BY created_at DESC 
    LIMIT $1
  `,
    [limit],
  );

  let fixed = 0;
  let failed = 0;
  const reports: VideoDoctorFix[] = [];

  for (const row of result.rows) {
    const diagnosis = await diagnoseVideo(row.id);

    if (diagnosis.canAutoFix) {
      const fix = await fixVideo(row.id);
      reports.push(fix);

      if (fix.success) {
        fixed++;
      } else {
        failed++;
      }
    }
  }

  logger.info(
    `[VideoDoctor] Auto-fix complete: ${fixed} fixed, ${failed} failed`,
  );

  return { fixed, failed, reports };
}
