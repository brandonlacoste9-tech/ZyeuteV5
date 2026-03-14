import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

// Fix for TLS issues if needed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://vuanulvyqkfefmjcikfk.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TIKTOK_SCRAPER_API_KEY = process.env.TIKTOK_SCRAPER_API_KEY;

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`🔑 TikTok Scraper API Key: ${TIKTOK_SCRAPER_API_KEY ? "Present (Starts with " + TIKTOK_SCRAPER_API_KEY.substring(0, 4) + ")" : "MISSING"}`);

const OMKAR_API_BASE = "https://tiktok-scraper.omkar.cloud/tiktok/videos/search";

const QUEBEC_QUERIES = [
  "#quebec",
  "#montreal",
  "#quebecois",
  "vieux quebec",
  "poutine montreal",
  "fleur de lys quebec"
];

async function fetchTikTokVideos(query: string) {
  if (!TIKTOK_SCRAPER_API_KEY) {
    console.warn(`[TikTok] Skipping fetch for "${query}" - TIKTOK_SCRAPER_API_KEY missing.`);
    return [];
  }

  try {
    console.log(`[TikTok] Fetching videos for query: ${query}...`);
    const response = await axios.get(OMKAR_API_BASE, {
      params: {
        search_query: query,
        market: "ca", 
        max_results: 15,
      },
      headers: {
        "API-Key": TIKTOK_SCRAPER_API_KEY,
      },
    });

    return response.data.videos || [];
  } catch (error: any) {
    console.error(`[TikTok] Error fetching for "${query}":`, error.message);
    if (error.response) {
      console.error(`[TikTok] API Error Details:`, error.response.data);
    }
    return [];
  }
}

async function getAuthorUserId() {
  // 1. Try zyeute_scout
  const { data: scout } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", "zyeute_scout")
    .single();
  if (scout) return scout.id;

  // 2. Try ti_guy_bot
  const { data: bot } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", "ti_guy_bot")
    .single();
  if (bot) return bot.id;

  // 3. Fallback to any user
  const { data: fallback } = await supabase
    .from("user_profiles")
    .select("id")
    .limit(1)
    .single();
  
  return fallback?.id || null;
}

async function run() {
  console.log("🍁 Zyeuté TikTok Curation Engine (Supabase Client)");
  console.log("===============================");

  const userId = await getAuthorUserId();
  if (!userId) {
    console.error("❌ No user profile found in database to assign as author.");
    return;
  }

  console.log(`👤 Posts will be authored by User ID: ${userId}`);

  let totalImported = 0;

  for (const query of QUEBEC_QUERIES) {
    const videos = await fetchTikTokVideos(query);
    
    if (!videos || !Array.isArray(videos)) continue;

    console.log(`📦 Found ${videos.length} videos for ${query}`);

    for (const v of videos) {
      // Check if already exists (using tiktok_id in metadata)
      const { data: existing } = await supabase
        .from("publications")
        .select("id")
        .contains("media_metadata", { tiktok_id: v.video_id })
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`⏭️  Skipping existing: ${v.video_id}`);
        continue;
      }

      console.log(`📥 Importing: ${v.caption.substring(0, 40)}...`);

      const { error: insertError } = await supabase
        .from("publications")
        .insert({
          user_id: userId,
          media_url: v.media?.video_url || v.media?.hd_video_url,
          thumbnail_url: v.thumbnails?.cover_url,
          caption: v.caption,
          content: v.caption || "TikTok Import",
          visibility: "public",
          hive_id: "quebec",
          processing_status: "completed",
          reactions_count: v.stats?.likes || 0,
          media_metadata: {
            tiktok_id: v.video_id,
            author: v.author?.handle,
            source: "tiktok-scraper",
            stats: v.stats
          }
        });

      if (insertError) {
        console.error(`❌ Error inserting video ${v.video_id}:`, insertError.message);
      } else {
        totalImported++;
      }
    }
  }

  console.log("");
  console.log(`🎉 Done! Imported ${totalImported} new TikToks.`);
}

run().catch(console.error);
