/**
 * 🎬 Video Player Diagnostic Script
 * Injects a test video with a verified working URL
 * Uses Google's sample videos (no CORS issues)
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

// Google's sample videos - verified CORS-friendly and always available
const TEST_VIDEOS = [
  {
    caption: "⚜️ DIAGNOSTIC TEST: Native HTML5 Player (Big Buck Bunny)",
    media_url:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail_url:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    type: "video",
    reactions_count: 888888, // High count to pin at top
    hive_id: "quebec",
    user_id: "27e6a0ec-4b73-45d7-b391-9e831a210524", // System user from existing script
    content: "DIAGNOSTIC TEST - Native HTML5 Video Player validation",
    processing_status: "ready",
  },
  {
    caption: "🔥 DIAGNOSTIC TEST: Shorter Video (For Bigger Blazes)",
    media_url:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnail_url:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
    type: "video",
    reactions_count: 777777,
    hive_id: "quebec",
    user_id: "27e6a0ec-4b73-45d7-b391-9e831a210524",
    content: "DIAGNOSTIC TEST - Shorter video for quick validation",
    processing_status: "ready",
  },
  {
    caption: "🎥 DIAGNOSTIC TEST: Elephant Dream Sample",
    media_url:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnail_url:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
    type: "video",
    reactions_count: 666666,
    hive_id: "quebec",
    user_id: "27e6a0ec-4b73-45d7-b391-9e831a210524",
    content: "DIAGNOSTIC TEST - Third sample video",
    processing_status: "ready",
  },
];

async function injectTestVideos() {
  console.log("🎬 VIDEO PLAYER DIAGNOSTIC SCRIPT");
  console.log("=".repeat(50));
  console.log("");
  console.log("📋 Test URLs (verified CORS-friendly):");
  TEST_VIDEOS.forEach((v, i) => {
    console.log(`   ${i + 1}. ${v.media_url.split("/").pop()}`);
  });
  console.log("");

  // First, check if test videos already exist
  const { data: existing, error: checkError } = await supabase
    .from("publications")
    .select("id, caption")
    .ilike("caption", "%DIAGNOSTIC TEST%");

  if (existing && existing.length > 0) {
    console.log(`⚠️  Found ${existing.length} existing diagnostic videos.`);
    console.log("   Deleting old test videos...");

    const { error: deleteError } = await supabase
      .from("publications")
      .delete()
      .ilike("caption", "%DIAGNOSTIC TEST%");

    if (deleteError) {
      console.error(`❌ Error deleting old tests: ${deleteError.message}`);
    } else {
      console.log("   ✅ Old test videos deleted.");
    }
  }

  console.log("");
  console.log("🚀 Injecting fresh diagnostic videos...");

  for (const video of TEST_VIDEOS) {
    const { data, error } = await supabase
      .from("publications")
      .insert([video])
      .select();

    if (error) {
      console.error(`❌ Error inserting: ${error.message}`);
      console.error(`   Video: ${video.media_url.split("/").pop()}`);
    } else {
      console.log(`✅ Inserted: ${data[0].id}`);
      console.log(`   Caption: ${video.caption}`);
    }
  }

  console.log("");
  console.log("=".repeat(50));
  console.log("✨ DIAGNOSTIC COMPLETE!");
  console.log("");
  console.log("📍 NEXT STEPS:");
  console.log("   1. Start frontend: npm run dev");
  console.log("   2. Navigate to: http://localhost:5173/feed");
  console.log("   3. Look for videos with '⚜️ DIAGNOSTIC TEST' caption");
  console.log(
    "   4. Check browser console for [VideoPlayer] and [SingleVideoView] logs",
  );
  console.log("");
}

injectTestVideos()
  .then(() => {
    process.stdout.write("\n✅ Script completed successfully\n");
    process.exit(0);
  })
  .catch((err) => {
    process.stderr.write(`\n❌ Script failed: ${err.message}\n`);
    process.exit(1);
  });
