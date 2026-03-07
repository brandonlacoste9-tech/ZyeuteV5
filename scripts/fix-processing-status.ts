/**
 * Fix Video Processing Status
 *
 * Updates videos stuck in "pending" status to "completed"
 * so they can play in the VideoCard component
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

async function fixProcessingStatus() {
  console.log("🔧 FIX VIDEO PROCESSING STATUS");
  console.log("=".repeat(80));
  console.log("");

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || "https://vuanulvyqkfefmjcikfk.supabase.co";
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YW51bHZ5cWtmZWZtamNpa2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzczNDIsImV4cCI6MjA3OTg1MzM0Mn0.73euLyOCo-qbQyLZQkaDpzrq8RI_6G3bN_EKY-_RCq8";

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Step 1: Find videos stuck in pending status
    console.log("📊 STEP 1: Finding videos with pending status...");
    console.log("─".repeat(80));

    const { data: pendingVideos, error: fetchError } = await supabase
      .from("publications")
      .select("id, caption, media_url, processing_status")
      .eq("type", "video")
      .eq("processing_status", "pending")
      .not("media_url", "is", null);

    if (fetchError) {
      console.error("❌ Error fetching videos:", fetchError.message);
      return;
    }

    if (!pendingVideos || pendingVideos.length === 0) {
      console.log("✅ No videos stuck in pending status!");
      return;
    }

    console.log(
      `Found ${pendingVideos.length} videos stuck in "pending" status`,
    );
    console.log("");

    // Step 2: Update to completed
    console.log("🔧 STEP 2: Updating processing_status to 'completed'...");
    console.log("─".repeat(80));
    console.log("");

    let successCount = 0;
    let failCount = 0;

    for (const video of pendingVideos) {
      console.log(`Fixing: ${video.id}`);
      console.log(
        `  Caption: ${video.caption?.substring(0, 50) || "(no caption)"}...`,
      );
      console.log(`  URL: ${video.media_url?.substring(0, 60)}...`);

      const { error: updateError } = await supabase
        .from("publications")
        .update({ processing_status: "completed" })
        .eq("id", video.id);

      if (updateError) {
        console.log(`  ❌ Failed: ${updateError.message}`);
        failCount++;
      } else {
        console.log(`  ✅ Fixed!`);
        successCount++;
      }
      console.log("");
    }

    // Step 3: Summary
    console.log("✅ STEP 3: Summary");
    console.log("─".repeat(80));
    console.log(`Fixed: ${successCount} videos`);
    console.log(`Failed: ${failCount} videos`);
    console.log("");

    if (successCount > 0) {
      console.log("🎉 SUCCESS! Your videos should now play.");
      console.log("");
      console.log("Next steps:");
      console.log("  1. Refresh your browser (hard refresh: Ctrl+Shift+R)");
      console.log(
        "  2. Check the feed - videos should now play instead of showing spinner",
      );
      console.log(
        "  3. If still having issues, check browser console for errors",
      );
      console.log("");
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

fixProcessingStatus();
