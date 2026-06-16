import { config } from "dotenv";
import { join } from "path";

// Load .env and .env.local
config({ path: join(process.cwd(), ".env") });
config({ path: join(process.cwd(), ".env.local"), override: true });

async function main() {
  console.log("🚀 Starting TikTok Importer (Local Mode)...");
  
  // Ensure the job is enabled for the local run
  process.env.TIKTOK_FEED_JOB_ENABLED = "true";
  
  if (!process.env.APIFY_API_KEY && !process.env.TIKAPI_KEY) {
    console.error("❌ Missing APIFY_API_KEY and TIKAPI_KEY in .env.local");
    process.exit(1);
  }

  // Import dynamically after env is set
  const { runTikTokFeedPopulatorOnce } = await import("../backend/services/tiktok-feed-populator-job.js");
  
  console.log("Running populator job...");
  const stats = await runTikTokFeedPopulatorOnce();
  
  console.log("\n✅ Import Complete!");
  console.log("Stats:", JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
