#!/usr/bin/env node
/**
 * Diagnostic Script: Check Videos in Database
 *
 * Purpose: Diagnose what videos are in the database and why they might not be showing
 *
 * This script:
 * 1. Connects to Supabase using the service role key
 * 2. Queries the publications table for all videos
 * 3. Logs detailed information about each video
 * 4. Provides a summary of video states
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   - SUPABASE_URL or VITE_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideos() {
  console.log("🔍 Checking videos in the database...\n");
  console.log("=".repeat(80));

  // First, get one record to see what columns exist
  console.log("📋 Checking available columns in publications table...\n");

  const { data: sampleData, error: sampleError } = await supabase
    .from("publications")
    .select("*")
    .limit(1);

  if (sampleError) {
    console.error("❌ Error checking schema:", sampleError.message);
    process.exit(1);
  }

  const availableColumns =
    sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [];

  // Define the columns we want to check for video playback
  const videoPlaybackColumns = [
    "media_url",
    "hls_url",
    "enhanced_url",
    "original_url",
    "processing_status",
    "thumbnail_url",
    "duration",
    "aspect_ratio",
    "mux_playback_id",
  ];

  const missingColumns = videoPlaybackColumns.filter(
    (col) => !availableColumns.includes(col),
  );

  if (missingColumns.length > 0) {
    console.log(
      "⚠️  Missing video playback columns (migration may not have been run):",
    );
    missingColumns.forEach((col) => console.log(`   ❌ ${col}`));
    console.log(
      "\n💡 Run the migration to add these columns: npm run migrate\n",
    );
  } else {
    console.log("✅ All video playback columns are present!\n");
  }

  console.log("=".repeat(80));

  // Query all videos - use * to get all available columns
  const {
    data: videos,
    error,
    count,
  } = await supabase
    .from("publications")
    .select("*", { count: "exact" })
    .eq("type", "video")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("❌ Error querying database:", error.message);
    process.exit(1);
  }

  if (!videos || videos.length === 0) {
    console.log("\n⚠️  No videos found in the database!");
    console.log("\nPossible reasons:");
    console.log("  1. No videos have been uploaded yet");
    console.log('  2. Videos have a different "type" value');
    console.log("  3. Database connection issue");
    process.exit(0);
  }

  console.log(
    `\n📊 Found ${count} total videos in database (showing ${videos.length} most recent)\n`,
  );
  console.log("=".repeat(80));

  // Initialize counters for summary
  let videosWithMediaUrl = 0;
  let videosWithHlsUrl = 0;
  let videosWithEnhancedUrl = 0;
  let videosWithOriginalUrl = 0;
  let videosWithNoUrls = 0;
  let videosCompleted = 0;
  let videosPending = 0;
  let videosProcessing = 0;
  let videosFailed = 0;
  let videosWithThumbnail = 0;
  let videosWithDuration = 0;

  const statusCounts: Record<string, number> = {};

  // Log each video
  videos.forEach((video: any, index: number) => {
    console.log(`\n📹 Video ${index + 1}/${videos.length}`);
    console.log("-".repeat(80));
    console.log(`   ID:                 ${video.id}`);
    console.log(`   Type:               ${video.type || "null"}`);
    console.log(`   Created:            ${video.created_at}`);

    // Only show fields if they exist in the schema
    if ("processing_status" in video) {
      console.log(
        `   Processing Status:  ${video.processing_status || "null"}`,
      );
    }
    if ("media_url" in video) {
      console.log(
        `   Media URL:          ${video.media_url ? "✅ " + truncateUrl(video.media_url) : "❌ null"}`,
      );
    }
    if ("hls_url" in video) {
      console.log(
        `   HLS URL:            ${video.hls_url ? "✅ " + truncateUrl(video.hls_url) : "❌ null"}`,
      );
    }
    if ("enhanced_url" in video) {
      console.log(
        `   Enhanced URL:       ${video.enhanced_url ? "✅ " + truncateUrl(video.enhanced_url) : "❌ null"}`,
      );
    }
    if ("original_url" in video) {
      console.log(
        `   Original URL:       ${video.original_url ? "✅ " + truncateUrl(video.original_url) : "❌ null"}`,
      );
    }
    if ("mux_playback_id" in video) {
      console.log(
        `   Mux Playback ID:    ${video.mux_playback_id || "❌ null"}`,
      );
    }
    if ("thumbnail_url" in video) {
      console.log(
        `   Thumbnail URL:      ${video.thumbnail_url ? "✅ " + truncateUrl(video.thumbnail_url) : "❌ null"}`,
      );
    }
    if ("duration" in video) {
      console.log(
        `   Duration:           ${video.duration ? `${video.duration}s` : "❌ null"}`,
      );
    }
    if ("aspect_ratio" in video) {
      console.log(`   Aspect Ratio:       ${video.aspect_ratio || "❌ null"}`);
    }

    // Update counters
    if (video.media_url) videosWithMediaUrl++;
    if (video.hls_url) videosWithHlsUrl++;
    if (video.enhanced_url) videosWithEnhancedUrl++;
    if (video.original_url) videosWithOriginalUrl++;
    if (video.thumbnail_url) videosWithThumbnail++;
    if (video.duration) videosWithDuration++;

    const hasAnyUrl =
      video.media_url ||
      video.hls_url ||
      video.enhanced_url ||
      video.original_url;
    if (!hasAnyUrl) {
      videosWithNoUrls++;
      console.log("   ⚠️  WARNING: No URLs available for this video!");
    }

    const status = video.processing_status || "unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    if (status === "completed") videosCompleted++;
    else if (status === "pending") videosPending++;
    else if (status === "processing") videosProcessing++;
    else if (status === "failed") videosFailed++;
  });

  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 SUMMARY");
  console.log("=".repeat(80));
  console.log(`\n📈 Total Videos: ${count}`);
  console.log(`   Showing: ${videos.length} most recent\n`);

  console.log("🔗 URL Availability:");
  if ("media_url" in videos[0]) {
    console.log(
      `   Videos with media_url:     ${videosWithMediaUrl} (${percentage(videosWithMediaUrl, videos.length)}%)`,
    );
  }
  if ("hls_url" in videos[0]) {
    console.log(
      `   Videos with hls_url:       ${videosWithHlsUrl} (${percentage(videosWithHlsUrl, videos.length)}%)`,
    );
  }
  if ("enhanced_url" in videos[0]) {
    console.log(
      `   Videos with enhanced_url:  ${videosWithEnhancedUrl} (${percentage(videosWithEnhancedUrl, videos.length)}%)`,
    );
  }
  if ("original_url" in videos[0]) {
    console.log(
      `   Videos with original_url:  ${videosWithOriginalUrl} (${percentage(videosWithOriginalUrl, videos.length)}%)`,
    );
  }
  console.log(
    `   Videos with NO URLs:       ${videosWithNoUrls} (${percentage(videosWithNoUrls, videos.length)}%) ${videosWithNoUrls > 0 ? "⚠️" : "✅"}`,
  );

  if ("processing_status" in videos[0]) {
    console.log("\n📊 Processing Status:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      const pct = percentage(count, videos.length);
      const emoji =
        status === "completed"
          ? "✅"
          : status === "failed"
            ? "❌"
            : status === "processing"
              ? "⏳"
              : "⏸️";
      console.log(`   ${emoji} ${status.padEnd(15)}: ${count} (${pct}%)`);
    });
  }

  console.log("\n🖼️  Metadata Availability:");
  if ("thumbnail_url" in videos[0]) {
    console.log(
      `   Videos with thumbnail:     ${videosWithThumbnail} (${percentage(videosWithThumbnail, videos.length)}%)`,
    );
  }
  if ("duration" in videos[0]) {
    console.log(
      `   Videos with duration:      ${videosWithDuration} (${percentage(videosWithDuration, videos.length)}%)`,
    );
  }

  // Diagnosis
  console.log("\n" + "=".repeat(80));
  console.log("🔍 DIAGNOSIS");
  console.log("=".repeat(80));

  if (missingColumns.length > 0) {
    console.log(
      "\n❌ CRITICAL: Video playback columns are missing from the database",
    );
    console.log("   The migration has not been run yet.");
    console.log(
      "   Recommendation: Run `npm run migrate` to add the required columns.",
    );
  }

  if (videosWithNoUrls > 0) {
    console.log("\n⚠️  ISSUE: Some videos have NO URLs available");
    console.log("   This will cause videos to fail to load in the app.");
    console.log(
      "   Recommendation: Check video upload and processing pipeline.",
    );
  }

  if (videosPending > 0 || videosProcessing > 0) {
    console.log(
      `\n⏳ INFO: ${videosPending + videosProcessing} videos are still being processed`,
    );
    console.log("   These videos may show loading states in the app.");
    console.log(
      "   Recommendation: Wait for processing to complete or check processing pipeline.",
    );
  }

  if (videosFailed > 0) {
    console.log(`\n❌ ISSUE: ${videosFailed} videos failed processing`);
    console.log("   These videos will show error states in the app.");
    console.log("   Recommendation: Check processing_error field for details.");
  }

  if (
    videosCompleted === 0 &&
    videos.length > 0 &&
    "processing_status" in videos[0]
  ) {
    console.log("\n⚠️  ISSUE: No videos have completed processing");
    console.log(
      "   This means no videos will have HLS URLs for optimal playback.",
    );
    console.log(
      "   Recommendation: Check video processing pipeline (Mux integration).",
    );
  }

  if (
    videosWithMediaUrl === 0 &&
    videos.length > 0 &&
    "media_url" in videos[0]
  ) {
    console.log("\n❌ CRITICAL: No videos have media_url");
    console.log(
      "   This is the primary fallback URL and should always be populated.",
    );
    console.log("   Recommendation: Check video upload logic.");
  }

  if (
    videosWithThumbnail === 0 &&
    videos.length > 0 &&
    "thumbnail_url" in videos[0]
  ) {
    console.log("\n⚠️  ISSUE: No videos have thumbnails");
    console.log("   This will cause blank placeholders in the feed.");
    console.log(
      "   Recommendation: Check thumbnail generation in processing pipeline.",
    );
  }

  if (
    missingColumns.length === 0 &&
    videosWithNoUrls === 0 &&
    videosCompleted > 0
  ) {
    console.log("\n✅ Everything looks good!");
    console.log("   All required columns exist and videos have URLs.");
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ Diagnostic complete!");
  console.log("=".repeat(80));
}

function truncateUrl(url: string, maxLength: number = 60): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + "...";
}

function percentage(count: number, total: number): string {
  if (total === 0) return "0";
  return ((count / total) * 100).toFixed(1);
}

// Run the diagnostic
checkVideos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
