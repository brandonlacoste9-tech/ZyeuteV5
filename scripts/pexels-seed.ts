#!/usr/bin/env tsx
/**
 * pexels-seed.ts
 * ──────────────
 * Checks video counts per hive and tops up any hive below TARGET_PER_HIVE
 * by fetching fresh videos from the Pexels API.
 *
 * Run manually:  tsx scripts/pexels-seed.ts
 * Cron:          registered as a scheduled task via Perplexity Computer
 */

import { config } from "dotenv";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: join(__dirname, "../.env") });

// ── Config ────────────────────────────────────────────────────────────────────
const TARGET_PER_HIVE = 200; // keep each hive at 200+ videos
const PEXELS_KEY =
  process.env.PEXELS_API_KEY ||
  "2iANaoqJBF6j0AKJU6Kr67F7xujOMNvFVBeZNK4CaoXQiEezLaxdOpNV";
const SEED_USER_ID = "46db6dc0-060d-4ffd-ba5e-0dfe46878855"; // comet_test

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

// ── Hive definitions ──────────────────────────────────────────────────────────
const HIVES: Record<
  string,
  {
    regions: string[];
    language: string;
    searches: string[];
    captionFn: (title: string, region: string) => string;
    tagsFn: () => string[];
  }
> = {
  quebec: {
    regions: ["montreal", "quebec_city", "laval", "gatineau", "sherbrooke"],
    language: "fr",
    searches: [
      "montreal city",
      "quebec winter snow",
      "canada nature forest",
      "hockey ice rink",
      "maple syrup cabin",
      "saint lawrence river",
      "old port montreal",
      "quebec festival",
      "canadian wildlife",
      "urban street canada",
    ],
    captionFn: (title, region) => `${title} — ${region.replace("_", " ")} ⚜️`,
    tagsFn: () =>
      ["#Québec", "#Zyeuté", "#MTL", "#Canada", "#HiveQc"].sort(
        () => Math.random() - 0.5,
      ),
  },
  mexico: {
    regions: ["cdmx", "guadalajara", "monterrey", "oaxaca", "yucatan"],
    language: "es",
    searches: [
      "ciudad de mexico street",
      "mexico culture fiesta",
      "guadalajara urban",
      "oaxaca nature",
      "yucatan beach",
      "mexican food market",
      "mexico architecture",
      "latin america city",
      "mexico dance",
      "sierra madre mountain",
    ],
    captionFn: (title, region) => `${title} — ${region.replace("_", " ")} 🦅`,
    tagsFn: () =>
      ["#México", "#Zyeuté", "#CDMX", "#HiveMx", "#Latino"].sort(
        () => Math.random() - 0.5,
      ),
  },
  brazil: {
    regions: ["sao_paulo", "rio_de_janeiro", "nordeste", "amazonia", "sul"],
    language: "pt",
    searches: [
      "rio de janeiro beach",
      "sao paulo urban",
      "amazon jungle nature",
      "brazil carnival",
      "brazilian beach sunset",
      "favela culture",
      "brazil football soccer",
      "pantanal wildlife",
      "iguazu falls",
      "brazil food street",
    ],
    captionFn: (title, region) => `${title} — ${region.replace("_", " ")} 🌿`,
    tagsFn: () =>
      ["#Brasil", "#Zyeuté", "#Rio", "#HiveBr", "#Latino"].sort(
        () => Math.random() - 0.5,
      ),
  },
  argentina: {
    regions: ["buenos_aires", "patagonia", "mendoza", "cordoba", "nordeste_ar"],
    language: "es",
    searches: [
      "buenos aires street",
      "patagonia landscape",
      "argentina tango",
      "mendoza wine vineyard",
      "andes mountain argentina",
      "argentina football",
      "cordoba city",
      "pampas gaucho",
      "argentina nature wildlife",
      "south america city night",
    ],
    captionFn: (title, region) => `${title} — ${region.replace("_", " ")} 🐆`,
    tagsFn: () =>
      ["#Argentina", "#Zyeuté", "#BuenosAires", "#HiveAr", "#Latino"].sort(
        () => Math.random() - 0.5,
      ),
  },
};

// ── Pexels API ────────────────────────────────────────────────────────────────
interface PexelsVideo {
  id: number;
  url: string;
  video_files: Array<{
    link: string;
    quality: string;
    width: number;
    height: number;
  }>;
  user: { name: string };
}

async function searchPexelsVideos(
  query: string,
  perPage = 20,
  page = 1,
): Promise<PexelsVideo[]> {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=portrait`;
  const res = await fetch(url, {
    headers: { Authorization: PEXELS_KEY },
  });
  if (!res.ok) throw new Error(`Pexels error ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return (data.videos as PexelsVideo[]) || [];
}

/** Pick the best mobile-friendly file: prefer HD portrait, fall back to any */
function pickVideoUrl(video: PexelsVideo): string | null {
  const files = video.video_files;
  // Prefer portrait HD (1080p)
  const portrait1080 = files.find(
    (f) => f.quality === "hd" && f.height >= f.width,
  );
  if (portrait1080) return portrait1080.link;
  // Any HD
  const hd = files.find((f) => f.quality === "hd");
  if (hd) return hd.link;
  // Any file
  return files[0]?.link ?? null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase env vars");
    process.exit(1);
  }

  const db = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Get current counts
  const { data: rawCounts } = await db
    .from("publications")
    .select("hive_id")
    .not("media_url", "is", null);

  const countMap: Record<string, number> = {};
  for (const row of rawCounts ?? []) {
    const h = (row as any).hive_id as string;
    countMap[h] = (countMap[h] ?? 0) + 1;
  }

  console.log("\n📊 Current video counts:");
  for (const hive of Object.keys(HIVES)) {
    console.log(`  ${hive}: ${countMap[hive] ?? 0}`);
  }

  // 2. Top up each hive
  for (const [hive, hiveDef] of Object.entries(HIVES)) {
    const current = countMap[hive] ?? 0;
    const needed = TARGET_PER_HIVE - current;

    if (needed <= 0) {
      console.log(`\n✅ ${hive} already at ${current} — skipping`);
      continue;
    }

    console.log(`\n🎬 ${hive} needs ${needed} more videos (has ${current})`);

    // Collect unique video URLs from Pexels
    const seenUrls = new Set<string>();
    const rows: object[] = [];
    let searchIdx = 0;

    while (rows.length < needed && searchIdx < hiveDef.searches.length * 3) {
      const query = hiveDef.searches[searchIdx % hiveDef.searches.length];
      const page = Math.floor(searchIdx / hiveDef.searches.length) + 1;
      searchIdx++;

      try {
        const videos = await searchPexelsVideos(query, 20, page);
        for (const video of videos) {
          if (rows.length >= needed) break;
          const mediaUrl = pickVideoUrl(video);
          if (!mediaUrl || seenUrls.has(mediaUrl)) continue;
          seenUrls.add(mediaUrl);

          const region =
            hiveDef.regions[Math.floor(Math.random() * hiveDef.regions.length)];
          const caption = hiveDef.captionFn(video.user.name, region);
          const tags = hiveDef.tagsFn();
          const daysAgo = Math.floor(Math.random() * 30);

          rows.push({
            user_id: SEED_USER_ID,
            content: caption,
            media_url: mediaUrl,
            caption,
            hashtags: tags,
            hive_id: hive,
            region_id: region,
            language: hiveDef.language,
            view_count: Math.floor(Math.random() * 9000) + 100,
            reactions_count: Math.floor(Math.random() * 400) + 5,
            created_at: new Date(
              Date.now() - daysAgo * 86400000 - Math.random() * 86400000,
            ).toISOString(),
          });
        }
        // Small delay to be polite to Pexels API
        await new Promise((r) => setTimeout(r, 200));
      } catch (err: any) {
        console.warn(`  ⚠️ Pexels search failed for "${query}":`, err.message);
      }
    }

    if (rows.length === 0) {
      console.warn(`  ⚠️ No videos found for ${hive}`);
      continue;
    }

    // Insert in batches of 50
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error: insertErr } = await db.from("publications").insert(batch);
      if (insertErr) {
        console.error(`  ❌ Insert error for ${hive}:`, insertErr.message);
      } else {
        inserted += batch.length;
      }
    }

    console.log(`  ✅ Inserted ${inserted} videos into ${hive}`);
  }

  // 3. Final counts
  const { data: finalRaw } = await db
    .from("publications")
    .select("hive_id")
    .not("media_url", "is", null);

  const finalMap: Record<string, number> = {};
  for (const row of finalRaw ?? []) {
    const h = (row as any).hive_id as string;
    finalMap[h] = (finalMap[h] ?? 0) + 1;
  }

  console.log("\n📊 Final video counts:");
  for (const hive of Object.keys(HIVES)) {
    console.log(`  ${hive}: ${finalMap[hive] ?? 0}`);
  }
  console.log("\n🎉 Pexels seed complete");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
