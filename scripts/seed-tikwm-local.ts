/**
 * Local TikWM collect + insert (no Render round-trip).
 *   npx tsx scripts/seed-tikwm-local.ts --limit=12
 */
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

import { collectTikwmFeedSeedCandidates } from "../backend/services/tikwm-feed.js";
import { importFeedSeedCandidates } from "../backend/services/tikapi-feed-insert.js";

function parseArg(name: string, fallback: number): number {
  const arg = process.argv.find((x) => x.startsWith(`--${name}=`));
  const n = arg ? Number(arg.split("=")[1]) : fallback;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function main() {
  const limit = parseArg("limit", 12);
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  console.log("📡 TikWM local seed");
  console.log(
    `   DB=${databaseUrl ? "yes" : "no"} supabase=${supabaseUrl ? "yes" : "no"} svcKeyLen=${supabaseServiceKey.length}`,
  );

  if (!databaseUrl && !(supabaseUrl && supabaseServiceKey)) {
    console.error(
      "❌ Need DATABASE_URL or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exit(1);
  }

  const pages = parseArg("pages", 5);
  const perTag = parseArg("perTag", 25);
  const candidates = await collectTikwmFeedSeedCandidates({
    regionalPerTag: perTag,
    viralPerTag: perTag,
    pagesPerTag: pages,
  });
  console.log(
    `   candidates=${candidates.length} (pagesPerTag=${pages}, perTag=${perTag})`,
  );
  if (!candidates.length) {
    console.error("❌ TikWM returned no videos");
    process.exit(1);
  }

  for (const c of candidates.slice(0, 3)) {
    console.log(
      `   sample: ${c.video.video_id} @${c.video.author?.handle} ${(c.video.caption || "").slice(0, 40)}`,
    );
  }

  const stats = await importFeedSeedCandidates({
    candidates,
    maxImport: limit,
    databaseUrl,
    supabaseUrl,
    supabaseServiceKey,
  });

  console.log("\n📊 Result:");
  console.log(JSON.stringify(stats, null, 2));

  if (stats.imported === 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
