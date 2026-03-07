/**
 * 🔍 Video URL Diagnostic Script (Supabase REST API)
 *
 * Checks all video posts using Supabase REST API (no DATABASE_URL needed).
 * This helps diagnose why videos show black screens in the feed.
 *
 * Usage: npx tsx scripts/diagnose-video-urls-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface VideoPost {
  id: string;
  type: string;
  caption: string;
  media_url: string | null;
  hls_url: string | null;
  enhanced_url: string | null;
  original_url: string | null;
  mux_playback_id: string | null;
  processing_status: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  aspect_ratio: string | null;
  created_at: string;
}

async function diagnoseVideoUrls() {
  console.log("🔍 VIDEO URL DIAGNOSTIC SCRIPT (Supabase REST API)");
  console.log("=".repeat(80));
  console.log("");

  // Check for required environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase configuration!");
    console.error("");
    console.error("Please set these environment variables in your .env file:");
    console.error("  VITE_SUPABASE_URL=https://your-project.supabase.co");
    console.error("  VITE_SUPABASE_ANON_KEY=your_anon_key_here");
    console.error("");
    console.error("Or:");
    console.error("  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here");
    console.error("");
    return;
  }

  console.log(`📡 Connecting to Supabase: ${supabaseUrl}`);
  console.log("");

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Query all video posts
    const { data: videos, error } = await supabase
      .from("publications")
      .select(
        "id, type, caption, media_url, hls_url, enhanced_url, original_url, mux_playback_id, processing_status, thumbnail_url, duration, aspect_ratio, created_at",
      )
      .eq("type", "video")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ Error querying database:", error.message);
      console.error("");
      console.error("Details:", error);
      return;
    }

    if (!videos || videos.length === 0) {
      console.log("❌ No video posts found in database");
      console.log("");
      console.log("💡 TIP: You may need to add video posts first.");
      console.log("   Try running: npx tsx scripts/populate-quebec-feed.ts");
      return;
    }

    console.log(`📊 Found ${videos.length} video posts. Analyzing...\n`);

    // Statistics
    const totalVideos = videos.length;
    let videosWithNoUrls = 0;
    let videosWithMediaUrl = 0;
    let videosWithHlsUrl = 0;
    let videosWithEnhancedUrl = 0;
    let videosWithOriginalUrl = 0;
    let videosWithMuxId = 0;
    let videosWithThumbnail = 0;
    let videosWithDuration = 0;
    let videosWithAspectRatio = 0;
    const videosByStatus: Record<string, number> = {};

    // Detailed analysis
    const problematicVideos: VideoPost[] = [];

    videos.forEach((video) => {
      // Count URL fields
      if (video.media_url) videosWithMediaUrl++;
      if (video.hls_url) videosWithHlsUrl++;
      if (video.enhanced_url) videosWithEnhancedUrl++;
      if (video.original_url) videosWithOriginalUrl++;
      if (video.mux_playback_id) videosWithMuxId++;
      if (video.thumbnail_url) videosWithThumbnail++;
      if (video.duration) videosWithDuration++;
      if (video.aspect_ratio) videosWithAspectRatio++;

      // Count by processing status
      const status = video.processing_status || "unknown";
      videosByStatus[status] = (videosByStatus[status] || 0) + 1;

      // Check if video has NO playable URLs
      const hasNoUrls =
        !video.media_url &&
        !video.hls_url &&
        !video.enhanced_url &&
        !video.original_url;

      if (hasNoUrls) {
        videosWithNoUrls++;
        problematicVideos.push(video);
      }
    });

    // Print summary
    console.log("📈 SUMMARY");
    console.log("─".repeat(80));
    console.log(`Total video posts: ${totalVideos}`);
    console.log("");
    console.log("URL Field Population:");
    console.log(
      `  ✓ media_url:      ${videosWithMediaUrl}/${totalVideos} (${Math.round((videosWithMediaUrl / totalVideos) * 100)}%)`,
    );
    console.log(
      `  ✓ hls_url:        ${videosWithHlsUrl}/${totalVideos} (${Math.round((videosWithHlsUrl / totalVideos) * 100)}%)`,
    );
    console.log(
      `  ✓ enhanced_url:   ${videosWithEnhancedUrl}/${totalVideos} (${Math.round((videosWithEnhancedUrl / totalVideos) * 100)}%)`,
    );
    console.log(
      `  ✓ original_url:   ${videosWithOriginalUrl}/${totalVideos} (${Math.round((videosWithOriginalUrl / totalVideos) * 100)}%)`,
    );
    console.log(
      `  ✓ mux_playback_id: ${videosWithMuxId}/${totalVideos} (${Math.round((videosWithMuxId / totalVideos) * 100)}%)`,
    );
    console.log("");
    console.log("Metadata Population:");
    console.log(
      `  ✓ thumbnail_url:  ${videosWithThumbnail}/${totalVideos} (${Math.round((videosWithThumbnail / totalVideos) * 100)}%)`,
    );
    console.log(
      `  ✓ duration:       ${videosWithDuration}/${totalVideos} (${Math.round((videosWithDuration / totalVideos) * 100)}%)`,
    );
    console.log(
      `  ✓ aspect_ratio:   ${videosWithAspectRatio}/${totalVideos} (${Math.round((videosWithAspectRatio / totalVideos) * 100)}%)`,
    );
    console.log("");
    console.log("Processing Status:");
    Object.entries(videosByStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    console.log("");

    // Critical issues
    if (videosWithNoUrls > 0) {
      console.log("🚨 CRITICAL ISSUE FOUND!");
      console.log("─".repeat(80));
      console.log(`${videosWithNoUrls} video(s) have NO playable URLs!`);
      console.log("These videos will show BLACK SCREENS in the feed.\n");
      console.log("Problematic videos:");
      console.log("");

      problematicVideos.slice(0, 10).forEach((video, index) => {
        console.log(`${index + 1}. ID: ${video.id}`);
        console.log(
          `   Caption: ${video.caption?.substring(0, 60) || "(no caption)"}...`,
        );
        console.log(`   Status: ${video.processing_status || "unknown"}`);
        console.log(
          `   Created: ${new Date(video.created_at).toLocaleString()}`,
        );
        console.log("");
      });

      if (problematicVideos.length > 10) {
        console.log(`   ... and ${problematicVideos.length - 10} more\n`);
      }
    } else {
      console.log("✅ All videos have at least one playable URL!");
      console.log("");
    }

    // Recommendations
    console.log("💡 RECOMMENDATIONS");
    console.log("─".repeat(80));

    if (videosWithNoUrls > 0) {
      console.log("1. FIX MISSING URLs:");
      console.log(
        "   The root cause is that video posts have NO video URLs populated.",
      );
      console.log("   ");
      console.log(
        "   SOLUTION: Run the fix script to populate URLs from Pexels:",
      );
      console.log("   npx tsx scripts/fix-video-urls-supabase.ts");
      console.log("");
    }

    if (videosWithMediaUrl < totalVideos * 0.5) {
      console.log("2. POPULATE media_url:");
      console.log(
        "   Most videos are missing media_url (the primary video source).",
      );
      console.log("   Check your video upload/processing pipeline.");
      console.log("");
    }

    if (videosWithThumbnail < totalVideos * 0.5) {
      console.log("3. ADD THUMBNAILS:");
      console.log("   Many videos are missing thumbnail_url.");
      console.log("   This affects feed preview quality.");
      console.log("");
    }

    if (videosByStatus["pending"] || videosByStatus["processing"]) {
      console.log("4. CHECK PROCESSING PIPELINE:");
      console.log(
        `   ${(videosByStatus["pending"] || 0) + (videosByStatus["processing"] || 0)} video(s) stuck in processing.`,
      );
      console.log("   These may need manual intervention.");
      console.log("");
    }

    // Sample video details
    console.log("\n📋 SAMPLE VIDEO DETAILS (First 3)");
    console.log("─".repeat(80));
    videos.slice(0, 3).forEach((video, index) => {
      console.log(`\n${index + 1}. Video ID: ${video.id}`);
      console.log(
        `   Caption: ${video.caption?.substring(0, 60) || "(no caption)"}...`,
      );
      console.log(`   Type: ${video.type}`);
      console.log(`   Status: ${video.processing_status || "unknown"}`);
      console.log(`   URLs:`);
      console.log(
        `     media_url:      ${video.media_url ? video.media_url.substring(0, 60) + "..." : "❌ MISSING"}`,
      );
      console.log(
        `     hls_url:        ${video.hls_url ? video.hls_url.substring(0, 60) + "..." : "❌ MISSING"}`,
      );
      console.log(
        `     enhanced_url:   ${video.enhanced_url ? video.enhanced_url.substring(0, 60) + "..." : "❌ MISSING"}`,
      );
      console.log(
        `     original_url:   ${video.original_url ? video.original_url.substring(0, 60) + "..." : "❌ MISSING"}`,
      );
      console.log(`   Metadata:`);
      console.log(
        `     mux_playback_id: ${video.mux_playback_id || "❌ MISSING"}`,
      );
      console.log(
        `     thumbnail_url:   ${video.thumbnail_url ? "✓" : "❌ MISSING"}`,
      );
      console.log(
        `     duration:        ${video.duration ? `${video.duration}s` : "❌ MISSING"}`,
      );
      console.log(
        `     aspect_ratio:    ${video.aspect_ratio || "❌ MISSING"}`,
      );
    });

    console.log("\n");
    console.log("=".repeat(80));
    console.log("✅ Diagnostic complete!");
    console.log("");
  } catch (error: any) {
    console.error("❌ Error running diagnostic:", error.message);
    console.error("");
    console.error("Stack trace:", error.stack);
  }
}

// Run diagnostic
diagnoseVideoUrls().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
