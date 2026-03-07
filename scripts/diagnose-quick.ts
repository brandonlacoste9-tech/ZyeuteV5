/**
 * Quick Video Diagnostic - Uses .env file
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

async function diagnose() {
  console.log("🔍 VIDEO DIAGNOSTIC");
  console.log("=".repeat(80));
  console.log("");

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase configuration!");
    console.error("");
    console.error("Please add these to your .env file:");
    console.error("  VITE_SUPABASE_URL=your_supabase_url");
    console.error("  VITE_SUPABASE_ANON_KEY=your_anon_key");
    console.error("");
    return;
  }

  console.log(`📡 Connecting to: ${supabaseUrl}`);
  console.log(`🔑 Using key: ${supabaseKey.substring(0, 20)}...`);
  console.log("");

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: videos, error } = await supabase
      .from("publications")
      .select(
        "id, type, caption, media_url, hls_url, enhanced_url, original_url, mux_playback_id, thumbnail_url, processing_status",
      )
      .eq("type", "video")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("❌ Error:", error.message);
      console.error("Full error:", error);
      return;
    }

    if (!videos || videos.length === 0) {
      console.log("❌ No video posts found");
      return;
    }

    console.log(`📊 Found ${videos.length} videos\n`);

    const broken = videos.filter(
      (v) =>
        !v.media_url &&
        !v.hls_url &&
        !v.enhanced_url &&
        !v.original_url &&
        !v.mux_playback_id,
    );

    console.log(`🚨 ${broken.length} videos have NO URLs (black screens)\n`);

    videos.forEach((v, i) => {
      console.log(`${i + 1}. ${v.id}`);
      console.log(`   Caption: ${v.caption?.substring(0, 50) || "none"}...`);
      console.log(`   media_url: ${v.media_url ? "✅" : "❌"}`);
      console.log(`   hls_url: ${v.hls_url ? "✅" : "❌"}`);
      console.log(`   mux_playback_id: ${v.mux_playback_id ? "✅" : "❌"}`);
      console.log(`   thumbnail: ${v.thumbnail_url ? "✅" : "❌"}`);
      console.log(`   processing_status: ${v.processing_status || "none"}`);
      console.log("");
    });

    if (broken.length > 0) {
      console.log("💡 TO FIX: Run this command:");
      console.log("   npx tsx scripts/fix-video-black-screens.ts");
    } else {
      console.log("✅ All videos have URLs!");
      console.log("");
      console.log("If videos still show black screens, check:");
      console.log("  1. Browser console for errors");
      console.log("  2. CORS issues with video URLs");
      console.log("  3. Video URL validity (try opening in browser)");
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

diagnose();
