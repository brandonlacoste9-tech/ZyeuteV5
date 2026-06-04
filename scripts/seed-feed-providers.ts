/**
 * Seed feed from Pixabay + Pexels + Apify (direct Supabase — no Render HTTP).
 *
 *   npm run seed:providers
 *   npm run seed:providers -- --limit=20
 *   npm run seed:providers -- --pexels --pixabay
 *   npm run seed:providers -- --apify
 */
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import { seedFeedProviders } from "../backend/services/feed-seed-providers.js";

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !key) {
    console.error("❌ VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required");
    process.exit(1);
  }

  const limitArg = process.argv.find((x) => x.startsWith("--limit="));
  const limit = limitArg
    ? Math.min(100, Math.max(1, parseInt(limitArg.split("=")[1], 10) || 25))
    : 25;

  const onlyApify = hasFlag("apify");
  const onlyPexels = hasFlag("pexels");
  const onlyPixabay = hasFlag("pixabay");
  const explicit = onlyApify || onlyPexels || onlyPixabay;

  console.log("🌱 Seeding feed (Pixabay + Pexels + Apify)...\n");

  const stats = await seedFeedProviders({
    supabaseUrl: url,
    supabaseServiceKey: key,
    limitPerProvider: limit,
    pexels: !explicit || onlyPexels,
    pixabay: !explicit || onlyPixabay,
    apify: !explicit || onlyApify,
  });

  console.log("\n📊 Result:");
  console.log(`   Pexels:  ${stats.pexels}`);
  console.log(`   Pixabay: ${stats.pixabay}`);
  console.log(`   Apify:   ${stats.apify}`);
  if (stats.errors.length) {
    console.log("   Errors:", stats.errors.join("; "));
  }

  const total = stats.pexels + stats.pixabay + stats.apify;
  if (total === 0) process.exit(1);
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
