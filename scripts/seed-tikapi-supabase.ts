/**
 * Seed via Supabase REST (when DATABASE_URL fails locally).
 * Requires in .env.local:
 *   VITE_SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */
import dotenv from "dotenv";
import { collectFeedSeedCandidates } from "../backend/services/tikapi-hashtag.js";
import { importFeedSeedCandidates } from "../backend/services/tikapi-feed-insert.js";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function parseArg(name: string, fallback: number): number {
  const arg = process.argv.find((x) => x.startsWith(`--${name}=`));
  const n = arg ? Number(arg.split("=")[1]) : fallback;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function main() {
  const limit = parseArg("limit", 80);
  const url =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!process.env.TIKAPI_KEY) {
    console.error("❌ TIKAPI_KEY required");
    process.exit(1);
  }
  if (!url || !key) {
    console.error(
      "❌ VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required for REST seed",
    );
    process.exit(1);
  }

  console.log("📡 Collecting TikAPI candidates...");
  const candidates = await collectFeedSeedCandidates({
    regionalPerTag: 6,
    viralPerTag: 10,
    trendingCount: 20,
    minPlays: 0,
  });
  console.log(`   ${candidates.length} candidates`);

  const stats = await importFeedSeedCandidates({
    candidates,
    maxImport: limit,
    supabaseUrl: url,
    supabaseServiceKey: key,
  });

  console.log("\n📊 Result:", stats);
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
