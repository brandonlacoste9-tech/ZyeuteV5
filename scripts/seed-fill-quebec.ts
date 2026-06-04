/**
 * Multiple Apify passes to grow the Québec pool (use after APIFY key rotate).
 *   npm run seed:fill
 *   npm run seed:fill -- --passes=4 --apify=50 --target=600
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
    console.error(
      "❌ VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }
  if (!process.env.APIFY_API_KEY?.trim()) {
    console.error("❌ APIFY_API_KEY in .env.local");
    process.exit(1);
  }

  const passes = parseArg("passes", 3);
  const perPass = parseArg("apify", 50);
  const target = parseArg("target", 550);

  let lastAfter = 0;
  for (let p = 1; p <= passes; p++) {
    console.log(`\n━━ Pass ${p}/${passes} (up to ${perPass} Apify) ━━`);
    const result = await replenishQuebecFeedPool({
      supabaseUrl: url,
      supabaseServiceKey: key,
      force: true,
      targetCount: target,
      maxApify: perPass,
      maxPexels: p === 1 ? 20 : 0,
    });
    lastAfter = result.feedCountAfter;
    console.log(
      `   ${result.feedCountBefore} → ${result.feedCountAfter} (+${result.apify} apify, +${result.pexels} pexels)`,
    );
    if (result.feedCountAfter >= target) {
      console.log(`\n✅ Target ${target} reached.`);
      break;
    }
  }
  console.log(`\n📊 Final pool size: ${lastAfter}`);
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
