/**
 * Boost playable TikTok in the feed: Mux backfill batches + optional Apify seed.
 *
 * Local (Supabase + Mux env):
 *   npx tsx scripts/run-tiktok-boost.ts --backfill-passes=4
 *
 * Via Render (needs CRON_SECRET):
 *   npx tsx scripts/run-tiktok-boost.ts --remote --backfill-passes=3 --omkar=15
 */
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const args = process.argv.slice(2);
const remote = args.includes("--remote");
const backfillPasses = parseInt(
  args.find((a) => a.startsWith("--backfill-passes="))?.split("=")[1] ?? "3",
  10,
);
const apifyLimit = parseInt(
  args.find((a) => a.startsWith("--apify="))?.split("=")[1] ?? "0",
  10,
);
const omkarLimit = parseInt(
  args.find((a) => a.startsWith("--omkar="))?.split("=")[1] ?? "0",
  10,
);

const API_BASE =
  process.env.ZYEUTE_API_BASE?.trim() || "https://zyeutev5-1.onrender.com";
const CRON = process.env.CRON_SECRET?.trim();

async function remotePost(path: string) {
  if (!CRON) throw new Error("CRON_SECRET required for --remote");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Cron-Secret": CRON,
    },
  });
  const body = await res.json().catch(() => ({}));
  console.log(path, res.status, JSON.stringify(body));
  return body;
}

async function localBackfill(passes: number) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error("Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");

  const { backfillTikTokToMuxOrStorage } =
    await import("../backend/services/backfill-tiktok-mirror.js");
  const { isMuxIngestConfigured } =
    await import("../backend/services/tiktok-mux-ingest.js");

  console.log("Mux configured:", isMuxIngestConfigured());

  let totalMux = 0;
  let totalMirror = 0;
  for (let i = 0; i < passes; i++) {
    console.log(`\n--- Backfill pass ${i + 1}/${passes} ---`);
    const stats = await backfillTikTokToMuxOrStorage({
      supabaseUrl: url,
      supabaseServiceKey: key,
      limit: 25,
      hiveId: "quebec",
    });
    console.log(stats);
    totalMux += stats.muxIngested;
    totalMirror += stats.mirrored;
    if (stats.scanned === 0) break;
  }
  console.log("\nDone backfill:", { totalMux, totalMirror });
}

async function main() {
  if (remote) {
    for (let i = 0; i < backfillPasses; i++) {
      await remotePost("/api/seed/mux-backfill?limit=25");
    }
    if (omkarLimit > 0) {
      await remotePost(`/api/seed/omkar?force=1&limit=${omkarLimit}`);
    } else if (apifyLimit > 0) {
      await remotePost(
        `/api/seed/providers?force=1&apify_only=1&limit=${apifyLimit}`,
      );
    }
    await fetch(`${API_BASE}/api/feed/pool-stats`)
      .then((r) => r.json())
      .then((j) => console.log("pool-stats", j));
    return;
  }

  await localBackfill(backfillPasses);

  if (omkarLimit > 0) {
    const { replenishFeedOmkarIfLow } =
      await import("../backend/services/feed-replenish-omkar.js");
    const stats = await replenishFeedOmkarIfLow({
      force: true,
      maxImport: omkarLimit,
    });
    console.log("Omkar seed:", stats);
  } else if (apifyLimit > 0) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env missing for Apify seed");
    const { seedFeedProviders } =
      await import("../backend/services/feed-seed-providers.js");
    const stats = await seedFeedProviders({
      supabaseUrl: url,
      supabaseServiceKey: key,
      apify: true,
      pexels: false,
      pixabay: false,
      limitPerProvider: apifyLimit,
      hiveId: "quebec",
      regionId: "montreal",
    });
    console.log("Apify seed:", stats);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
