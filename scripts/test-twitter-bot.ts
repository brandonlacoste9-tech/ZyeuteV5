import "dotenv/config";
import { runTwitterBotJob } from "../backend/services/twitter-bot.js";
import { db, pool } from "../backend/storage.js";

async function main() {
  console.log("🛠️  Testing Twitter Bot Service...");
  console.log("Checking credentials:");
  console.log(`TWITTER_API_KEY: ${process.env.TWITTER_API_KEY ? "✅ Set" : "❌ Missing"}`);
  console.log(`TWITTER_API_SECRET: ${process.env.TWITTER_API_SECRET ? "✅ Set" : "❌ Missing"}`);
  console.log(`TWITTER_ACCESS_TOKEN: ${process.env.TWITTER_ACCESS_TOKEN ? "✅ Set" : "❌ Missing"}`);
  console.log(`TWITTER_ACCESS_TOKEN_SECRET: ${process.env.TWITTER_ACCESS_TOKEN_SECRET ? "✅ Set" : "❌ Missing"}`);

  console.log("\n🏃‍♂️ Running the bot job once...");
  await runTwitterBotJob();
  console.log("✅ Finished testing.");
  
  // Close DB pool to allow script to exit
  try {
    await pool.end();
  } catch (e) {}
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
