/**
 * Bulk seed: keep regional Québec/Montreal + viral/trending TikToks.
 *
 * Usage:
 *   npm run tikapi:seed
 *   npm run tikapi:seed -- --limit=80
 *   npm run tikapi:seed -- --dry-run
 */
import dotenv from "dotenv";
import { collectFeedSeedCandidates } from "../backend/services/tikapi-hashtag.js";
import { replenishFeedTikApiIfLow } from "../backend/services/feed-replenish-tikapi.js";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: ".env.render", override: false });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function parseArg(name: string, fallback: number): number {
  const arg = process.argv.find((x) => x.startsWith(`--${name}=`));
  const value = arg ? Number(arg.split("=")[1]) : fallback;
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

async function main() {
  const limit = parseArg("limit", 80);
  const dryRun = process.argv.includes("--dry-run");

  if (!process.env.TIKAPI_KEY) {
    console.error("❌ TIKAPI_KEY required in .env.local");
    process.exit(1);
  }

  console.log(`🎵 TikAPI feed seed — maxImport=${limit}\n`);

  if (dryRun) {
    const candidates = await collectFeedSeedCandidates({
      regionalPerTag: 5,
      viralPerTag: 5,
      trendingCount: 10,
    });
    const regional = candidates.filter((c) =>
      c.source.includes("regional"),
    ).length;
    const viral = candidates.filter((c) => c.source.includes("viral")).length;
    const trending = candidates.filter((c) =>
      c.source.includes("trending"),
    ).length;
    console.log(
      `Dry run: ${candidates.length} candidates (${regional} regional, ${viral} viral, ${trending} trending)`,
    );
    if (candidates[0]) {
      console.log(
        "Sample:",
        candidates[0].video.video_id,
        candidates[0].source,
        candidates[0].video.caption.slice(0, 50),
      );
    }
    return;
  }

  const result = await replenishFeedTikApiIfLow({
    force: true,
    maxImport: limit,
  });

  console.log("\n📊 Result:");
  console.log(`   Feed before:     ${result.feedCountBefore}`);
  console.log(`   Candidates:      ${result.candidates}`);
  console.log(`   Imported:        ${result.imported}`);
  console.log(`   Duplicates:      ${result.duplicate}`);
  console.log(`   Skipped/failed:  ${result.skipped + result.failed}`);

  if (result.imported === 0 && result.feedCountBefore < 20) {
    console.error(
      "\n❌ Pool still thin. Fix DATABASE_URL (aws-1-us-east-1 pooler) or add SUPABASE_SERVICE_ROLE_KEY.",
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
