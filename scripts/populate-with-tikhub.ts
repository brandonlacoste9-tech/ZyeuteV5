#!/usr/bin/env tsx
/**
 * 🚀 Populate Feed with Real TikToks via TikHub (Self-Contained)
 * Searches for Quebec-related content and imports it into the Zyeuté feed.
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
config({ path: join(__dirname, "../.env") });

const SUPABASE_URL = "https://vuanulvyqkfefmjcikfk.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TIKHUB_API_KEY = process.env.TIKHUB_API_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required in .env");
  process.exit(1);
}

if (!TIKHUB_API_KEY) {
  console.error("❌ TIKHUB_API_KEY is required in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function populate() {
  console.log("🔍 Fetching Quebec TikToks via TikHub...");
  
  try {
    const response = await axios.get("https://api.tikhub.io/api/v1/tiktok/web/fetch_search_video", {
      headers: {
        "Authorization": `Bearer ${TIKHUB_API_KEY}`
      },
      params: {
        keyword: "quebec",
        count: 15,
        offset: 0
      }
    });

    const data = response.data;
    if (data.code !== 200 && data.status !== "success") {
      throw new Error(data.message_en || data.msg || "TikHub API error");
    }

    const videos = data.data?.aweme_list || data.aweme_list || [];
    console.log(`✅ Found ${videos.length} videos.`);

    for (const item of videos) {
      const videoId = item.aweme_id || item.id;
      const desc = item.desc || "";
      const video = item.video || {};
      const author = item.author || {};
      const stats = item.statistics || {};
      
      const handle = author.unique_id || "unknown";
      const nickname = author.nickname || handle;
      const avatar = author.avatar_thumb?.url_list?.[0] || "";
      const videoUrl = video.play_addr?.url_list?.[0] || "";
      const cover = video.cover?.url_list?.[0] || "";
      const originalUrl = `https://www.tiktok.com/@${handle}/video/${videoId}`;

      console.log(`📥 Processing: @${handle} - ${desc.substring(0, 50)}...`);

      // 1. Ensure author exists
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("username", handle)
        .single();

      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const id = randomUUID();
        const { data: newUser } = await supabase
          .from("user_profiles")
          .insert([{
            id,
            username: handle,
            display_name: nickname,
            avatar_url: avatar,
            bio: `Imported from TikTok (@${handle})`,
            hive_id: "quebec",
            role: "citoyen"
          }])
          .select("id")
          .single();
        userId = newUser?.id || id;
      }

      // 2. Insert publication
      const { error: insertError } = await supabase
        .from("publications")
        .insert([{
          id: randomUUID(),
          user_id: userId,
          media_url: videoUrl || `/api/media-proxy?url=${encodeURIComponent(originalUrl)}`,
          original_url: originalUrl,
          thumbnail_url: cover,
          caption: desc,
          content: desc,
          type: "video",
          hive_id: "quebec",
          visibility: "public",
          processing_status: "completed",
          reactions_count: stats.digg_count || 0,
          view_count: stats.play_count || 0,
          shares_count: stats.share_count || 0,
          comments_count: stats.comment_count || 0,
          moderation_approved: true,
          video_source: "tiktok_tikhub"
        }]);

      if (insertError) {
        if (insertError.code === "23505") {
          console.log(`  ⏩ Skipping duplicate video.`);
        } else {
          console.error(`  ❌ Insert error:`, insertError.message);
        }
      } else {
        console.log(`  ✅ Imported successfully!`);
      }
    }

    console.log("\n✨ Feed population complete!");
    
  } catch (err: any) {
    const msg = err.response?.data?.message_en || err.response?.data?.msg || err.message;
    console.error("💥 Population failed:", msg);
    if (err.response?.data) {
      console.error("📄 Error details:", JSON.stringify(err.response.data, null, 2));
    }
  }
}

populate();
