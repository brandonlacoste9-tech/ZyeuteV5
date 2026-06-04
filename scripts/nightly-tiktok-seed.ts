/**
 * TikTok Feed Seeder — pulls real Quebec TikTok content via TIKAPI
 * and inserts into Supabase publications table.
 *
 * Run manually:  tsx scripts/nightly-tiktok-seed.ts
 * Cron:          registered as "TikAPI Nightly Seed" (3am EDT = 07:00 UTC)
 *
 * Required env vars:
 *   TIKAPI_KEY                — TikAPI key
 *   SUPABASE_URL or VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY — full-access key (never expose to frontend)
 */

import { config } from "dotenv";
import { join } from "path";
import TikAPI from "tikapi";

config({ path: join(__dirname, "../.env") });

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TIKAPI_KEY = process.env.TIKAPI_KEY || "";

// Seed user — comet_test / Brandon's dev account
const SEED_USER_ID = "46db6dc0-060d-4ffd-ba5e-0dfe46878855";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!TIKAPI_KEY) {
  console.error("❌ Missing TIKAPI_KEY");
  process.exit(1);
}

const api = TikAPI(TIKAPI_KEY);

// Quebec-focused hashtags with known IDs
const HASHTAGS = [
  { name: "montreal", id: "36966", region: "montreal" },
  { name: "quebec", id: "13725", region: "quebec_city" },
  { name: "quebecois", id: "4764129", region: "quebec_city" },
  { name: "mtl", id: "84124", region: "montreal" },
  { name: "canada", id: "2703", region: "montreal" },
  { name: "hiver", id: null, region: "quebec_city" },
  { name: "neige", id: null, region: "laval" },
  { name: "foodtiktok", id: null, region: "montreal" },
  { name: "dance", id: null, region: "montreal" },
  { name: "viral", id: null, region: "montreal" },
];

async function getHashtagId(name: string): Promise<string | null> {
  try {
    const res = await (api as any).public.hashtag({ name });
    return res?.json?.challengeInfo?.challenge?.id || null;
  } catch {
    return null;
  }
}

async function fetchHashtagVideos(id: string, count = 20): Promise<any[]> {
  try {
    const res = await (api as any).public.hashtag({ id, count });
    return res?.json?.itemList || res?.json?.item_list || [];
  } catch {
    return [];
  }
}

async function insertBatch(posts: any[]): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/publications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      apikey: SERVICE_ROLE,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(posts),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("\n  ❌ Insert error:", err.slice(0, 200));
    return 0;
  }
  return posts.length;
}

async function main() {
  console.log("🎵 TikTok Feed Seeder\n");

  const allVideos: any[] = [];
  const seenIds = new Set<string>();

  for (const tag of HASHTAGS) {
    const id = tag.id || (await getHashtagId(tag.name));
    if (!id) {
      console.log(`  #${tag.name}: no ID found, skipping`);
      continue;
    }

    const items = await fetchHashtagVideos(id, 20);
    let added = 0;

    for (const item of items) {
      const tiktokId = item.id as string;
      if (!tiktokId || seenIds.has(tiktokId)) continue;

      const v = item.video || {};
      const author = item.author || {};
      const stats = item.stats || item.statistics || {};

      const playUrls: string[] =
        v.playAddr?.urlList || v.bitrateInfo?.[0]?.PlayAddr?.UrlList || [];
      const coverUrl: string = v.cover || v.dynamicCover || v.originCover || "";
      const tiktokUrl = `https://www.tiktok.com/@${author.uniqueId || author.nickname || "user"}/video/${tiktokId}`;

      const plays = stats.playCount || stats.play_count || 0;
      void plays;

      seenIds.add(tiktokId);
      allVideos.push({
        user_id: SEED_USER_ID,
        caption: (item.desc || `#${tag.name} 🍁`).slice(0, 500),
        content: (item.desc || `#${tag.name} 🍁`).slice(0, 500),
        language: "fr",
        media_url: playUrls[0] || tiktokUrl,
        thumbnail_url: coverUrl || null,
        video_source: "tiktok",
        processing_status: "completed",
        is_moderated: true,
        moderation_approved: true,
        hive_id: "quebec",
        region_id: tag.region,
        reactions_count: stats.diggCount || stats.digg_count || 0,
        view_count: plays,
        comments_count: stats.commentCount || stats.comment_count || 0,
        shares_count: stats.shareCount || stats.share_count || 0,
      });
      added++;
    }

    console.log(
      `  #${tag.name} (${id}): +${added} videos (total: ${allVideos.length})`,
    );
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\n📊 Total TikTok videos ready: ${allVideos.length}\n`);
  if (!allVideos.length) {
    console.log("No TikTok videos found — nothing inserted.");
    return;
  }

  allVideos.sort((a, b) => b.view_count - a.view_count);

  console.log("💾 Inserting into Supabase...");
  let total = 0;
  for (let i = 0; i < allVideos.length; i += 20) {
    const n = await insertBatch(allVideos.slice(i, i + 20));
    total += n;
    process.stdout.write(`\r  Progress: ${total}/${allVideos.length}`);
  }
  console.log("\n");

  const r = await fetch(`${SUPABASE_URL}/rest/v1/publications?select=count`, {
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      apikey: SERVICE_ROLE,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  const totalPosts = r.headers.get("content-range")?.split("/")[1] || "?";
  console.log(`✅ Feed now has ${totalPosts} total posts`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
