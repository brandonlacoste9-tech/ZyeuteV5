import "dotenv/config";
import { runSocialBotJob } from "../backend/services/social-bot.js";
import { pool } from "../backend/storage.js";

async function main() {
  console.log("🛠️  Testing Social Bot Service...");
  console.log("Checking credentials:");
  console.log(`AYRSHARE_API_KEY: ${process.env.AYRSHARE_API_KEY ? "✅ Set" : "❌ Missing"}`);
  console.log(`XAI_API_KEY: ${process.env.XAI_API_KEY ? "✅ Set" : "❌ Missing"}`);

  console.log("\n🏃‍♂️ Running the bot job once...");
  try {
    await runSocialBotJob();
  } catch (err) {
    console.error("❌ Error running social bot:", err);
  } finally {
    console.log("✅ Finished testing.");
    // Close DB pool to allow script to exit cleanly
    await pool.end();
    process.exit(0);
  }
}

main().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
