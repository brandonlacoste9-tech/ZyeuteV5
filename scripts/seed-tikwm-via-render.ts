/**
 * Seed production via TikWM (no TikAPI quota) → POST /api/seed/custom on Render.
 */
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";
import { collectTikwmFeedSeedCandidates } from "../backend/services/tikwm-feed.js";
import type { FeedSeedCandidate } from "../backend/services/tikapi-hashtag.js";

const API_BASE = process.env.SEED_API_BASE || "https://zyeutev5-1.onrender.com";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://[REF].supabase.co";
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YW51bHZ5cWtmZWZtamNpa2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzczNDIsImV4cCI6MjA3OTg1MzM0Mn0.73euLyOCo-qbQyLZQkaDpzrq8RI_6G3bN_EKY-_RCq8";

function parseArg(name: string, fallback: number): number {
  const arg = process.argv.find((x) => x.startsWith(`--${name}=`));
  const n = arg ? Number(arg.split("=")[1]) : fallback;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function toSeedRow(userId: string, c: FeedSeedCandidate) {
  const v = c.video;
  const mediaUrl = v.media?.video_url;
  if (!mediaUrl) return null;
  const caption = (v.caption || "TikTok").slice(0, 500);
  return {
    user_id: userId,
    type: "video",
    media_url: mediaUrl,
    thumbnail_url: v.thumbnails?.cover_url || null,
    caption,
    content: caption,
    hive_id: "quebec",
    region_id: c.region,
    video_source: "tiktok",
    processing_status: "completed",
    is_moderated: true,
    moderation_approved: true,
    reactions_count: v.stats?.likes ?? 0,
    view_count: v.stats?.views ?? 0,
    comments_count: v.stats?.comments ?? 0,
    shares_count: v.stats?.shares ?? 0,
    media_metadata: {
      tiktok_id: v.video_id,
      author: v.author?.handle ?? null,
      source: c.source,
      provider: v.provider ?? "tikwm",
      original_url: v.original_url,
    },
  };
}

async function getAuthorId(): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
  const { data } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", "ti_guy_bot")
    .maybeSingle();
  if (data?.id) return data.id as string;
  const { data: any } = await supabase
    .from("user_profiles")
    .select("id")
    .limit(1);
  if (!any?.[0]?.id) throw new Error("No user_profiles row");
  return any[0].id as string;
}

async function main() {
  const limit = parseArg("limit", 35);
  console.log(`📡 TikWM collect → ${API_BASE}/api/seed/custom\n`);

  const userId = await getAuthorId();
  const candidates = await collectTikwmFeedSeedCandidates({
    regionalPerTag: 12,
    viralPerTag: 8,
  });
  console.log(`   ${candidates.length} candidates`);

  const videos = candidates
    .map((c) => toSeedRow(userId, c))
    .filter((x): x is NonNullable<typeof x> => x != null)
    .slice(0, limit);

  if (!videos.length) {
    console.error("❌ No importable videos from TikWM");
    process.exit(1);
  }

  const cron = process.env.CRON_SECRET?.trim().replace(/^["']+|["']+$/g, "");
  if (!cron) {
    console.warn(
      "⚠️ CRON_SECRET missing — Render /api/seed/custom will return 401",
    );
  }

  let total = 0;
  const batchSize = 8;
  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (cron) headers["X-Cron-Secret"] = cron;
    const res = await fetch(`${API_BASE}/api/seed/custom`, {
      method: "POST",
      headers,
      body: JSON.stringify({ videos: batch }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(
        `❌ Batch ${i / batchSize + 1}:`,
        res.status,
        text.slice(0, 300),
      );
      continue;
    }
    const json = JSON.parse(text) as { posts?: unknown[] };
    const n = json.posts?.length ?? 0;
    total += n;
    console.log(`✅ Batch ${i / batchSize + 1}: +${n} (total ${total})`);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n📊 Inserted ${total}/${videos.length} TikTok videos`);
  if (total === 0) process.exit(1);
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
