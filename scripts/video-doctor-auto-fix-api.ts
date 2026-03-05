import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function autoFixVideosAPI() {
  console.log("🏥 Video Doctor: Auto-Fix API Mode...");

  // 1. Fetch problematic videos
  const { data: videos, error } = await supabase
    .from("publications")
    .select("id, media_url, thumbnail_url, processing_status")
    .eq("type", "video")
    .or(
      "processing_status.eq.failed,thumbnail_url.is.null,processing_status.eq.pending",
    )
    .limit(50);

  if (error) {
    console.error("❌ Error fetching videos:", error.message);
    return;
  }

  console.log(`🔍 Found ${videos.length} videos needing attention.\n`);

  let fixedCount = 0;

  for (const video of videos) {
    let needsUpdate = false;
    const updates: any = {};

    // Fix 1: Check for 403 Errors
    if (video.media_url && !video.media_url.includes("/api/media-proxy")) {
      try {
        await axios.head(video.media_url, { timeout: 3000 });
      } catch (err: any) {
        if (err.response?.status === 403) {
          console.log(
            `🔧 Video ${video.id}: Applying Proxy Fix (403 detected)`,
          );
          updates.media_url = `/api/media-proxy?url=${encodeURIComponent(video.media_url)}`;
          needsUpdate = true;
        }
      }
    }

    // Fix 2: Missing thumbnails
    if (!video.thumbnail_url && video.media_url) {
      console.log(`🖼️ Video ${video.id}: Setting fallback thumbnail`);
      // Use the media URL itself or a derived JPG if possible
      updates.thumbnail_url = video.media_url.replace(/\.[^.]+$/, ".jpg");
      needsUpdate = true;
    }

    // Fix 3: Stuck in pending
    if (video.processing_status === "pending") {
      console.log(
        `🔄 Video ${video.id}: Marking as completed (stuck in pending)`,
      );
      updates.processing_status = "completed";
      needsUpdate = true;
    }

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from("publications")
        .update(updates)
        .eq("id", video.id);

      if (updateError) {
        console.error(
          `❌ Failed to update video ${video.id}:`,
          updateError.message,
        );
      } else {
        fixedCount++;
      }
    }
  }

  console.log(`\n✅ Auto-fix complete! Fixed ${fixedCount} issues.`);
}

autoFixVideosAPI();
