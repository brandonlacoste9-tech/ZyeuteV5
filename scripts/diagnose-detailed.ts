/**
 * Detailed Video Diagnostic - Shows actual URLs
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

async function diagnose() {
  console.log("🔍 DETAILED VIDEO DIAGNOSTIC");
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

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: videos, error } = await supabase
      .from("publications")
      .select(
        "id, type, caption, media_url, hls_url, enhanced_url, original_url, mux_playback_id, thumbnail_url, processing_status",
      )
      .eq("type", "video")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("❌ Error:", error.message);
      return;
    }

    if (!videos || videos.length === 0) {
      console.log("❌ No video posts found");
      return;
    }

    console.log(`📊 Found ${videos.length} videos\n`);

    videos.forEach((v, i) => {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`VIDEO ${i + 1}: ${v.id}`);
      console.log(`${"=".repeat(80)}`);
      console.log(`Caption: ${v.caption?.substring(0, 60) || "none"}...`);
      console.log(`\nURL Fields:`);
      console.log(`  media_url: ${v.media_url || "❌ EMPTY"}`);
      console.log(`  hls_url: ${v.hls_url || "❌ EMPTY"}`);
      console.log(`  enhanced_url: ${v.enhanced_url || "❌ EMPTY"}`);
      console.log(`  original_url: ${v.original_url || "❌ EMPTY"}`);
      console.log(`  mux_playback_id: ${v.mux_playback_id || "❌ EMPTY"}`);
      console.log(`\nOther Fields:`);
      console.log(`  thumbnail_url: ${v.thumbnail_url || "❌ EMPTY"}`);
      console.log(`  processing_status: ${v.processing_status || "none"}`);

      // Check if URL is valid
      if (v.media_url) {
        const isValidUrl = v.media_url.startsWith("http");
        const isPexels = v.media_url.includes("pexels.com");
        const isMux = v.media_url.includes("mux.com");
        const isCloudflare = v.media_url.includes("cloudflare");

        console.log(`\nURL Analysis:`);
        console.log(`  Valid HTTP(S): ${isValidUrl ? "✅" : "❌"}`);
        console.log(
          `  Source: ${isPexels ? "Pexels" : isMux ? "Mux" : isCloudflare ? "Cloudflare" : "Unknown"}`,
        );
      }
    });

    console.log(`\n${"=".repeat(80)}`);
    console.log("\n💡 NEXT STEPS:");
    console.log("1. Check if these URLs work in your browser");
    console.log("2. Open browser DevTools Console while viewing the feed");
    console.log("3. Look for CORS errors or video loading errors");
    console.log("4. Check if VideoCard component is rendering correctly");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

diagnose();
