/**
 * Minimal seed when TikAPI search is rate-limited: hashtag API only + Render insert.
 */
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";
import {
  fetchHashtagVideos,
  REGIONAL_HASHTAG_SEEDS,
  VIRAL_HASHTAG_SEEDS,
} from "../backend/services/tikapi-hashtag.js";
import { mapTikApiRawItemToVideo } from "../backend/services/tiktok-scraper-service.js";

const API_BASE =
  process.env.SEED_API_BASE || "https://zyeutev5-1.onrender.com";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://vuanulvyqkfefmjcikfk.supabase.co";
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YW51bHZ5cWtmZWZtamNpa2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzczNDIsImV4cCI6MjA3OTg1MzM0Mn0.73euLyOCo-qbQyLZQkaDpzrq8RI_6G3bN_EKY-_RCq8";

async function getAuthorId(): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
  const { data } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", "ti_guy_bot")
    .maybeSingle();
  if (data?.id) return data.id as string;
  throw new Error("ti_guy_bot not found");
}

async function main() {
  const userId = await getAuthorId();
  const seen = new Set<string>();
  const videos: Record<string, unknown>[] = [];

  const tags = [...REGIONAL_HASHTAG_SEEDS, ...VIRAL_HASHTAG_SEEDS.slice(0, 3)];
  for (const tag of tags) {
    if (!tag.id) continue;
    console.log(`#${tag.name} (${tag.id})...`);
    await new Promise((r) => setTimeout(r, 800));
    const items = await fetchHashtagVideos(tag.id, 12);
    for (const item of items) {
      const mapped = mapTikApiRawItemToVideo(item);
      if (!mapped?.video_id || seen.has(mapped.video_id)) continue;
      seen.add(mapped.video_id);
      const caption = (mapped.caption || `#${tag.name}`).slice(0, 500);
      const mediaUrl = mapped.media?.video_url;
      if (!mediaUrl) continue;
      videos.push({
        user_id: userId,
        type: "video",
        media_url: mediaUrl,
        thumbnail_url: mapped.thumbnails?.cover_url || null,
        caption,
        content: caption,
        hive_id: "quebec",
        region_id: tag.region,
        video_source: "tiktok",
        processing_status: "completed",
        is_moderated: true,
        moderation_approved: true,
        reactions_count: mapped.stats?.likes ?? 0,
        view_count: mapped.stats?.views ?? 0,
        media_metadata: {
          tiktok_id: mapped.video_id,
          source: `tikapi:hashtag:${tag.name}`,
          original_url: mapped.original_url,
        },
      });
    }
    console.log(`  pool size: ${videos.length}`);
    if (videos.length >= 40) break;
  }

  if (!videos.length) {
    console.error("❌ No videos (TikAPI rate limit?). Retry in ~1 hour.");
    process.exit(1);
  }

  const batch = videos.slice(0, 40);
  console.log(`\n📤 Posting ${batch.length} to ${API_BASE}...`);
  const res = await fetch(`${API_BASE}/api/seed/custom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videos: batch }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("❌ Render seed failed:", res.status, text.slice(0, 400));
    process.exit(1);
  }
  console.log("✅", text);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
