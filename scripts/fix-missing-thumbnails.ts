/**
 * 🔧 Fix Missing Thumbnails Script
 * Populates thumbnail_url for videos that have Pexels URLs but no thumbnails
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://vuanulvyqkfefmjcikfk.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Extract Pexels video ID from URL and generate thumbnail URL
 * Example: https://videos.pexels.com/video-files/4763824/...
 * Thumbnail: https://images.pexels.com/videos/4763824/pexels-photo-4763824.jpeg
 */
function getPexelsThumbnail(videoUrl: string): string | null {
  // Match Pexels video URL pattern
  const match = videoUrl.match(/videos\.pexels\.com\/video-files\/(\d+)/);
  if (!match) return null;

  const videoId = match[1];
  return `https://images.pexels.com/videos/${videoId}/pexels-photo-${videoId}.jpeg`;
}

/**
 * Alternative thumbnail patterns for Pexels
 */
function getPexelsThumbnailAlt(videoUrl: string): string | null {
  const match = videoUrl.match(/videos\.pexels\.com\/video-files\/(\d+)/);
  if (!match) return null;

  const videoId = match[1];
  // Try alternative thumbnail formats
  return `https://images.pexels.com/videos/${videoId}/free-video-${videoId}.jpg`;
}

async function fixMissingThumbnails() {
  console.log("🔧 FIX MISSING THUMBNAILS SCRIPT");
  console.log("=".repeat(60));
  console.log();

  // Get all videos without thumbnails
  const { data: videos, error } = await supabase
    .from("publications")
    .select("id, media_url, thumbnail_url, caption")
    .eq("type", "video")
    .is("deleted_at", null)
    .is("thumbnail_url", null);

  if (error) {
    console.error("❌ Error fetching videos:", error.message);
    process.exit(1);
  }

  if (!videos || videos.length === 0) {
    console.log("✅ All videos already have thumbnails!");
    return;
  }

  console.log(`📊 Found ${videos.length} videos missing thumbnails`);
  console.log();

  let fixed = 0;
  let failed = 0;
  let skipped = 0;

  for (const video of videos) {
    const thumbnailUrl = getPexelsThumbnail(video.media_url);

    if (!thumbnailUrl) {
      console.log(`⚠️  Skipped: ${video.id} (not a Pexels URL)`);
      console.log(`   URL: ${video.media_url?.substring(0, 60)}...`);
      skipped++;
      continue;
    }

    // Update the video with the thumbnail
    const { error: updateError } = await supabase
      .from("publications")
      .update({ thumbnail_url: thumbnailUrl })
      .eq("id", video.id);

    if (updateError) {
      console.log(`❌ Failed: ${video.id}`);
      console.log(`   Error: ${updateError.message}`);
      failed++;
    } else {
      console.log(`✅ Fixed: ${video.id}`);
      console.log(
        `   Caption: ${video.caption?.substring(0, 50) || "(no caption)"}`,
      );
      console.log(`   Thumb: ${thumbnailUrl}`);
      fixed++;
    }
  }

  console.log();
  console.log("=".repeat(60));
  console.log("📊 SUMMARY:");
  console.log(`   Fixed:    ${fixed}`);
  console.log(`   Failed:   ${failed}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log(`   Total:    ${videos.length}`);
  console.log();

  if (failed > 0) {
    console.log("⚠️  Some videos failed to update. Check errors above.");
  }
}

// Also fix duration and aspect_ratio where possible
async function enrichVideoMetadata() {
  console.log();
  console.log("🎬 ENRICHING VIDEO METADATA");
  console.log("=".repeat(60));
  console.log();

  // Extract dimensions from Pexels URL pattern
  // Example: 4763824-uhd_2560_1440_24fps.mp4 -> width: 2560, height: 1440
  const { data: videos, error } = await supabase
    .from("publications")
    .select("id, media_url, duration, aspect_ratio")
    .eq("type", "video")
    .is("deleted_at", null)
    .or("duration.is.null,aspect_ratio.is.null");

  if (error) {
    console.error("❌ Error fetching videos:", error.message);
    return;
  }

  if (!videos || videos.length === 0) {
    console.log("✅ All videos have complete metadata!");
    return;
  }

  console.log(`📊 Found ${videos.length} videos needing metadata enrichment`);
  console.log();

  let enriched = 0;

  for (const video of videos) {
    const url = video.media_url || "";
    const match = url.match(/(\d+)-[a-z]+_(\d+)_(\d+)_(\d+)fps/);

    if (match) {
      const width = parseInt(match[2]);
      const height = parseInt(match[3]);
      const aspectRatio = width && height ? `${width}:${height}` : null;

      const updates: any = {};
      if (!video.aspect_ratio && aspectRatio) {
        updates.aspect_ratio = aspectRatio;
      }
      // Duration is harder to extract from URL, would need ffprobe

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("publications")
          .update(updates)
          .eq("id", video.id);

        if (!updateError) {
          console.log(`✅ Enriched: ${video.id} -> ${aspectRatio}`);
          enriched++;
        }
      }
    }
  }

  console.log();
  console.log(`📊 Enriched ${enriched} videos with aspect ratio`);
}

// Run both operations
async function main() {
  await fixMissingThumbnails();
  await enrichVideoMetadata();

  console.log();
  console.log("✨ ALL DONE!");
  console.log();
  console.log("📍 NEXT STEPS:");
  console.log("   1. Refresh the Explore page");
  console.log("   2. Videos should now show thumbnails");
  console.log("   3. Click a video to test playback");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Script failed:", err);
    process.exit(1);
  });
