import { config } from "dotenv";
import { join } from "path";
import { collectFeedSeedCandidates } from "../backend/services/tikapi-hashtag.js";
import { importFeedSeedCandidates } from "../backend/services/tikapi-feed-insert.js";

// Load .env and .env.local
config({ path: join(process.cwd(), ".env") });
config({ path: join(process.cwd(), ".env.local"), override: true });

async function main() {
  console.log("🚀 Starting TikAPI Feed Importer...");
  
  if (!process.env.TIKAPI_KEY) {
    console.error("❌ Missing TIKAPI_KEY in .env.local");
    process.exit(1);
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
  }

  console.log("🔍 Collecting feed seed candidates using TikAPI...");
  const candidates = await collectFeedSeedCandidates({
    regionalPerTag: 5,
    viralPerTag: 5,
    trendingCount: 10,
    minPlays: 5000,
  });

  console.log(`✅ Collected ${candidates.length} candidates from TikAPI!`);
  
  if (candidates.length === 0) {
    console.log("No candidates found to import.");
    return;
  }

  console.log(`📥 Importing ${candidates.length} candidates into Supabase...`);
  const stats = await importFeedSeedCandidates({
    candidates,
    maxImport: 20, // Import 20 videos
    supabaseUrl,
    supabaseServiceKey,
  });

  console.log("\n✅ Import Complete!");
  console.log("Stats:", JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
