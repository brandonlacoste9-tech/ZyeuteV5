#!/usr/bin/env tsx
/**
 * 🚀 Populate Feed with Real TikToks via Apify (Self-Contained)
 * Uses clockworks/free-tiktok-scraper to fetch Quebec content.
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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://[REF].supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APIFY_API_KEY = process.env.APIFY_API_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required in .env");
  process.exit(1);
}

if (!APIFY_API_KEY) {
  console.error("❌ APIFY_API_KEY is required in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function getAuthorUserId() {
  const { data: bot } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", "ti_guy_bot")
    .single();
  if (bot) return bot.id;

  const { data: fallback } = await supabase
    .from("user_profiles")
    .select("id")
    .limit(1)
    .single();
  
  return fallback?.id || null;
}

async function populate() {
  console.log("🔍 Fetching Quebec TikToks via Apify...");
  
  try {
    const userId = await getAuthorUserId();
    if (!userId) {
      console.error("❌ No user profile found to attach imported videos to.");
      return;
    }

    const actorId = process.env.APIFY_TIKTOK_ACTOR_ID || "clockworks/free-tiktok-scraper";
    const actorPath = actorId.replace("/", "~");
    const url = `https://api.apify.com/v2/acts/${actorPath}/run-sync-get-dataset-items?token=${APIFY_API_KEY}`;
    
    // Run the Apify actor synchronously to get the data
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        searchQueries: ["#quebec", "#montreal", "quebec viral"],
        resultsPerPage: 15,
        maxProfilesPerQuery: 1,
        shouldDownloadVideos: true,
        shouldDownloadCovers: false,
        shouldDownloadSlideshowImages: false,
        shouldDownloadAvatars: false,
        shouldDownloadMusicCovers: false,
        downloadSubtitlesOptions: "NEVER_DOWNLOAD_SUBTITLES",
        commentsPerPost: 0,
        scrapeRelatedVideos: false,
        proxyCountryCode: "None",
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Apify returned ${response.status}: ${errBody}`);
    }

    const items = await response.json();
    console.log(`✅ Found ${items.length} videos from Apify.`);

    for (const item of items as any[]) {
      const videoId = item.id;
      const desc = item.text || "";
      const authorMeta = item.authorMeta || {};
      const videoMeta = item.videoMeta || {};
      
      const handle = authorMeta.name || authorMeta.nickName || "unknown";
      
      // Apify key-value store URL for the downloaded MP4
      const rawMp4Url = videoMeta.downloadAddr || item.mediaUrls?.[0];
      if (!rawMp4Url) {
        console.log(`  ⏩ Skipping @${handle} - No raw MP4 downloaded.`);
        continue;
      }

      console.log(`📥 Processing: @${handle} - ${desc.substring(0, 50)}...`);

      // 1. Download video from Apify (which expires)
      let permanentUrl = rawMp4Url;
      try {
        console.log(`   ⬇️ Downloading MP4 from Apify...`);
        const authorizedUrl = `${rawMp4Url}?token=${process.env.APIFY_API_KEY}`;
        const vidResp = await fetch(authorizedUrl);
        if (vidResp.ok) {
          const arrayBuffer = await vidResp.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const fileName = `apify/${videoId}-${randomUUID()}.mp4`;
          
          // 2. Upload to Supabase Storage
          console.log(`   ☁️ Uploading to Supabase Storage (${fileName})...`);
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("zyeute-videos")
            .upload(fileName, buffer, {
              contentType: "video/mp4",
              upsert: true
            });
            
          if (uploadError) {
            console.error(`   ❌ Supabase upload error: ${uploadError.message}`);
          } else if (uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from("zyeute-videos")
              .getPublicUrl(fileName);
            permanentUrl = publicUrl;
            console.log(`   ✅ Saved permanently: ${permanentUrl}`);
          }
        }
      } catch (err: any) {
        console.error(`   ❌ Failed to download/upload video: ${err.message}`);
      }

      const webVideoUrl = item.webVideoUrl || `https://www.tiktok.com/@${handle}/video/${videoId}`;
      const cover = videoMeta.coverUrl || "";

      // 3. Insert publication
      const { error: insertError } = await supabase
        .from("publications")
        .insert([{
          id: randomUUID(),
          user_id: userId,
          media_url: permanentUrl,
          original_url: webVideoUrl,
          tiktok_url: webVideoUrl,
          thumbnail_url: cover,
          caption: desc,
          content: desc,
          type: "video",
          hive_id: "quebec",
          visibility: "public",
          processing_status: "completed",
          reactions_count: item.diggCount || 0,
          view_count: item.playCount || 0,
          shares_count: item.shareCount || 0,
          comments_count: item.commentCount || 0,
          moderation_approved: true,
          video_source: "tiktok",
          media_metadata: {
            author: handle,
            source: "apify-scrape",
            tiktok_id: videoId
          }
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
    console.error("💥 Population failed:", err.message);
  }
}

populate();
