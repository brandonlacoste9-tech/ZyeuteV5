/**
 * One-shot TikTok feed population (same logic as background job).
 * Requires DATABASE_URL and TIKTOK_SCRAPER_API_KEY and/or TIKAPI_KEY.
 *
 * Usage: npx tsx scripts/run-tiktok-feed-job-once.ts
 */
import "dotenv/config";
import { runTikTokFeedPopulatorOnce } from "../backend/services/tiktok-feed-populator-job.js";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }
  const stats = await runTikTokFeedPopulatorOnce();
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
