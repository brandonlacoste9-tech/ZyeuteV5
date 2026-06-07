/**
 * One-shot feed replenish when the publication pool is low.
 * Usage: npm run feed:replenish
 */
import dotenv from "dotenv";
import { replenishFeedTikApiIfLow } from "../backend/services/feed-replenish-tikapi.js";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

// NOTE: TLS validation only disabled in non-production environments
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

async function main() {
  const result = await replenishFeedTikApiIfLow({ force: false });
  console.log(JSON.stringify(result, null, 2));
  if (!result.triggered) {
    console.log("Feed already above minimum — no import run.");
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
