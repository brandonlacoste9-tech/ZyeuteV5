/**
 * Fix Video Processing Status - Using Service Role Key
 *
 * Updates videos stuck in "pending" status to "completed"
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

async function fixProcessingStatus() {
  console.log("🔧 FIX VIDEO PROCESSING STATUS (Service Role)");
  console.log("=".repeat(80));
  console.log("");

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing Supabase configuration!");
    console.error("");
    console.error("You need the service_role key to update the database.");
    console.error("");
    console.error("Get it from:");
    console.error(
      "  https://app.supabase.com/project/YOUR_PROJECT/settings/api",
    );
    console.error("");
    console.error("Then add to your .env file:");
    console.error("  VITE_SUPABASE_URL=your_supabase_url");
    console.error("  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here");
    console.error("");
    return;
  }

  console.log(`📡 Connecting to: ${supabaseUrl}`);
  console.log(
    `🔑 Using service_role key: ${serviceRoleKey.substring(0, 20)}...`,
  );
  console.log("");

  const supabase = createClient(supabaseUrl, serviceRoleKey);

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

    // Batch update for efficiency
    const { error: updateError } = await supabase
      .from("publications")
      .update({ processing_status: "completed" })
      .eq("type", "video")
      .eq("processing_status", "pending")
      .not("media_url", "is", null);

    if (updateError) {
      console.error(`❌ Failed: ${updateError.message}`);
      return;
    }

    console.log(`✅ Updated ${pendingVideos.length} videos!`);
    console.log("");

    // Step 3: Summary
    console.log("✅ STEP 3: Summary");
    console.log("─".repeat(80));
    console.log(`Fixed: ${pendingVideos.length} videos`);
    console.log("");

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
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

fixProcessingStatus();
