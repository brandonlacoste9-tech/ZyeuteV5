import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

// Fix for TLS issues if needed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || "https://vuanulvyqkfefmjcikfk.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TIKTOK_SCRAPER_API_KEY = process.env.TIKTOK_SCRAPER_API_KEY;

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const OMKAR_DETAILS_API =
  "https://tiktok-scraper.omkar.cloud/tiktok/videos/details";
const TIKWM_DETAILS_API = "https://www.tikwm.com/api/";

async function fetchVideoDetails(videoUrl: string) {
  if (TIKTOK_SCRAPER_API_KEY) {
    try {
      console.log(`[TikTok] Fetching details via Omkar for: ${videoUrl}...`);
      const response = await axios.get(OMKAR_DETAILS_API, {
        params: { video_url: videoUrl },
        headers: { "API-Key": TIKTOK_SCRAPER_API_KEY },
      });

      return { ...response.data, provider: "omkar" };
    } catch (error: any) {
      console.warn(
        `[TikTok] Omkar details failed, trying TikWM:`,
        error.message,
      );
      if (error.response) {
        console.warn(`[TikTok] Omkar API Error Details:`, error.response.data);
      }
    }
  }

  try {
    console.log(`[TikTok] Fetching details via TikWM for: ${videoUrl}...`);
    const body = new URLSearchParams({ url: videoUrl, hd: "1" });
    const response = await axios.post(TIKWM_DETAILS_API, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    });

    const data = response.data?.data;
    if (response.data?.code !== 0 || !data?.id) {
      console.error("[TikTok] TikWM error:", response.data);
      return null;
    }

    return {
      video_id: data.id,
      caption: data.title || "",
      author: {
        handle: data.author?.unique_id || data.author?.nickname || "unknown",
        nickname: data.author?.nickname || data.author?.unique_id || "unknown",
        avatar: data.author?.avatar || "",
      },
      media: {
        video_url: data.play || data.hdplay,
        hd_video_url: data.hdplay || undefined,
      },
      thumbnails: {
        cover_url: data.cover || data.origin_cover || "",
      },
      stats: {
        likes: data.digg_count || 0,
        views: data.play_count || 0,
        shares: data.share_count || 0,
        comments: data.comment_count || 0,
      },
      provider: "tikwm",
    };
  } catch (error: any) {
    console.error(`[TikTok] TikWM error fetching details:`, error.message);
    return null;
  }
}

async function getAuthorUserId() {
  // Try ti_guy_bot as default for imports
  const { data: bot } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", "ti_guy_bot")
    .single();
  if (bot) return bot.id;

  // Fallback to any user
  const { data: fallback } = await supabase
    .from("user_profiles")
    .select("id")
    .limit(1)
    .single();

  return fallback?.id || null;
}

async function run() {
  const videoUrl =
    "https://www.tiktok.com/@remmitheshihtzu/video/7404161461565623582";
  console.log("🎬 Single Video Import Test");
  console.log("===============================");

  const userId = await getAuthorUserId();
  if (!userId) {
    console.error("❌ No user profile found.");
    return;
  }

  const v = await fetchVideoDetails(videoUrl);
  if (!v) {
    console.error("❌ Failed to fetch video details.");
    return;
  }

  console.log(`📥 Importing: ${v.caption?.substring(0, 40)}...`);

  const { data, error: insertError } = await supabase
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
        source: v.provider || "tiktok-url-import",
        stats: v.stats,
        original_url: videoUrl,
      },
    })
    .select();

  if (insertError) {
    console.error(`❌ Error inserting:`, insertError.message);
  } else {
    console.log(`✅ Success! Video ID: ${data[0].id}`);
  }
}

run().catch(console.error);
