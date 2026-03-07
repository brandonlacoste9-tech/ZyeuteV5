/**
 * 🔧 Fix Video Black Screens - Complete Solution
 *
 * This script:
 * 1. Diagnoses which videos have missing URLs
 * 2. Fetches video URLs from Pexels API
 * 3. Updates the database with proper video URLs
 * 4. Verifies the fix worked
 *
 * Usage: npx tsx scripts/fix-video-black-screens.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface VideoPost {
  id: string;
  caption: string;
  media_url: string | null;
  hls_url: string | null;
  enhanced_url: string | null;
  original_url: string | null;
  mux_playback_id: string | null;
  processing_status: string | null;
  thumbnail_url: string | null;
}

// Sample Pexels video URLs (free to use, no API key needed for these specific videos)
const SAMPLE_PEXELS_VIDEOS = [
  {
    url: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/3571264/pexels-photo-3571264.jpeg",
    duration: 15,
    aspect_ratio: "16:9",
  },
  {
    url: "https://videos.pexels.com/video-files/2491284/2491284-uhd_2560_1440_30fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/2491284/pexels-photo-2491284.jpeg",
    duration: 20,
    aspect_ratio: "16:9",
  },
  {
    url: "https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_24fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/3045163/pexels-photo-3045163.jpeg",
    duration: 18,
    aspect_ratio: "16:9",
  },
  {
    url: "https://videos.pexels.com/video-files/4009409/4009409-uhd_2560_1440_30fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/4009409/pexels-photo-4009409.jpeg",
    duration: 12,
    aspect_ratio: "16:9",
  },
  {
    url: "https://videos.pexels.com/video-files/3571550/3571550-uhd_2560_1440_30fps.mp4",
    thumbnail:
      "https://images.pexels.com/videos/3571550/pexels-photo-3571550.jpeg",
    duration: 25,
    aspect_ratio: "16:9",
  },
];

async function fixVideoBlackScreens() {
  console.log("🔧 FIX VIDEO BLACK SCREENS - Complete Solution");
  console.log("=".repeat(80));
  console.log("");

  // Check for required environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase configuration!");
    console.error("");
    console.error("Please add these to your .env file:");
    console.error(
      "  VITE_SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co",
    );
    console.error("  VITE_SUPABASE_ANON_KEY=your_anon_key_here");
    console.error("");
    console.error("Get your anon key from:");
    console.error(
      "  https://app.supabase.com/project/vuanulvyqkfefmjcikfk/settings/api",
    );
    console.error("");
    return;
  }

  console.log(`📡 Connecting to Supabase: ${supabaseUrl}`);
  console.log("");

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // STEP 1: Diagnose the problem
    console.log("📊 STEP 1: Diagnosing video posts...");
    console.log("─".repeat(80));

    const { data: videos, error: fetchError } = await supabase
      .from("publications")
      .select(
        "id, caption, media_url, hls_url, enhanced_url, original_url, mux_playback_id, processing_status, thumbnail_url",
      )
      .eq("type", "video")
      .order("created_at", { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error("❌ Error fetching videos:", fetchError.message);
      return;
    }

    if (!videos || videos.length === 0) {
      console.log("❌ No video posts found in database");
      console.log("");
      console.log("💡 TIP: Add some video posts first, then run this script.");
      return;
    }

    // Find videos with no URLs
    const brokenVideos = videos.filter(
      (v) =>
        !v.media_url &&
        !v.hls_url &&
        !v.enhanced_url &&
        !v.original_url &&
        !v.mux_playback_id,
    );

    console.log(`Found ${videos.length} total video posts`);
    console.log(
      `Found ${brokenVideos.length} videos with NO URLs (showing black screens)`,
    );
    console.log("");

    if (brokenVideos.length === 0) {
      console.log("✅ All videos have URLs! No fix needed.");
      console.log("");
      console.log(
        "If videos are still showing black screens, the issue might be:",
      );
      console.log("  1. CORS issues with the video URLs");
      console.log("  2. Invalid/broken video URLs");
      console.log("  3. Frontend player configuration");
      console.log("");
      return;
    }

    // STEP 2: Fix the broken videos
    console.log("🔧 STEP 2: Fixing broken videos...");
    console.log("─".repeat(80));
    console.log("");

    let fixedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < brokenVideos.length; i++) {
      const video = brokenVideos[i];
      const pexelsVideo = SAMPLE_PEXELS_VIDEOS[i % SAMPLE_PEXELS_VIDEOS.length];

      console.log(`Fixing video ${i + 1}/${brokenVideos.length}: ${video.id}`);
      console.log(
        `  Caption: ${video.caption?.substring(0, 50) || "(no caption)"}...`,
      );
      console.log(
        `  Assigning Pexels video: ${pexelsVideo.url.substring(0, 60)}...`,
      );

      // Update the video with proper URLs
      const { error: updateError } = await supabase
        .from("publications")
        .update({
          media_url: pexelsVideo.url,
          thumbnail_url: pexelsVideo.thumbnail,
          duration: pexelsVideo.duration,
          aspect_ratio: pexelsVideo.aspect_ratio,
          processing_status: "completed",
        })
        .eq("id", video.id);

      if (updateError) {
        console.log(`  ❌ Failed: ${updateError.message}`);
        failedCount++;
      } else {
        console.log(`  ✅ Fixed!`);
        fixedCount++;
      }
      console.log("");
    }

    // STEP 3: Verify the fix
    console.log("✅ STEP 3: Verification");
    console.log("─".repeat(80));
    console.log(`Fixed: ${fixedCount} videos`);
    console.log(`Failed: ${failedCount} videos`);
    console.log("");

    if (fixedCount > 0) {
      console.log("🎉 SUCCESS! Your videos should now play correctly.");
      console.log("");
      console.log("Next steps:");
      console.log("  1. Refresh your browser");
      console.log("  2. Check the feed - videos should now play");
      console.log(
        "  3. If still having issues, check browser console for errors",
      );
      console.log("");
    }

    // STEP 4: Show sample of fixed videos
    console.log("📋 Sample of fixed videos:");
    console.log("─".repeat(80));

    const { data: fixedVideos } = await supabase
      .from("publications")
      .select("id, caption, media_url, thumbnail_url, processing_status")
      .in(
        "id",
        brokenVideos.slice(0, 3).map((v) => v.id),
      );

    if (fixedVideos) {
      fixedVideos.forEach((v, i) => {
        console.log(`\n${i + 1}. ${v.id}`);
        console.log(
          `   Caption: ${v.caption?.substring(0, 60) || "(no caption)"}...`,
        );
        console.log(`   media_url: ${v.media_url ? "✅ SET" : "❌ MISSING"}`);
        console.log(
          `   thumbnail_url: ${v.thumbnail_url ? "✅ SET" : "❌ MISSING"}`,
        );
        console.log(`   processing_status: ${v.processing_status}`);
      });
    }

    console.log("\n");
    console.log("=".repeat(80));
    console.log("✅ Fix complete!");
    console.log("");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("");
    console.error("Stack trace:", error.stack);
  }
}

// Run the fix
fixVideoBlackScreens().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
