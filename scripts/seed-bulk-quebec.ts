/**
 * Bulk-fill Québec feed toward FEED_REPLENISH_TARGET (Apify TikToks + optional Pexels).
 *   npm run seed:bulk
 *   npm run seed:bulk -- --target=300
 */
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import { replenishQuebecFeedPool } from "../backend/services/feed-seed-providers.js";

function parseArg(name: string, fallback: number): number {
  const arg = process.argv.find((x) => x.startsWith(`--${name}=`));
  const n = arg ? Number(arg.split("=")[1]) : fallback;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) {
    console.error("❌ VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required");
    process.exit(1);
  }

  const target = parseArg("target", 300);
  const maxApify = parseArg("apify", 80);

  console.log(
    `🎯 Target pool size: ${target} (Apify batch up to ${maxApify})\n`,
  );

  const result = await replenishQuebecFeedPool({
    supabaseUrl: url,
    supabaseServiceKey: key,
    force: true,
    targetCount: target,
    maxApify,
    maxPexels: 25,
  });

  console.log("\n📊 Done:");
  console.log(`   Pool: ${result.feedCountBefore} → ${result.feedCountAfter}`);
  console.log(`   Apify: ${result.apify}  Pexels: ${result.pexels}`);
  if (result.errors.length)
    console.log(`   Errors: ${result.errors.join("; ")}`);
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
