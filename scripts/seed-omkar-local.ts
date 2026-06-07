/**
 * Import popular Omkar TikToks directly (no Render HTTP) — needs DB or Supabase service role.
 *
 *   npx tsx scripts/seed-omkar-local.ts --limit=15
 */
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function parseArg(name: string, fallback: number): number {
  const arg = process.argv.find((x) => x.startsWith(`--${name}=`));
  const n = arg ? Number(arg.split("=")[1]) : fallback;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function main() {
  const limit = parseArg("limit", 15);
  const { replenishFeedOmkarIfLow } =
    await import("../backend/services/feed-replenish-omkar.js");

  const result = await replenishFeedOmkarIfLow({
    force: true,
    maxImport: limit,
  });
  console.log(JSON.stringify(result, null, 2));

  if (result.imported === 0 && !process.env.DATABASE_URL?.trim()) {
    console.error(
      "\nNeed DATABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local for inserts.",
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
