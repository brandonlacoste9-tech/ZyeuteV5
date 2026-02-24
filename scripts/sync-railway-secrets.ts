import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";

// Load local .env
dotenv.config();

const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
if (!RAILWAY_TOKEN) {
  console.error("❌ RAILWAY_TOKEN not found in .env");
  process.exit(1);
}

async function syncToRailway() {
  console.log("🚂 Starting Zyeuté Secret Sync to Railway...\n");

  const variables: Record<string, string> = {
    // Redis Cloud
    REDIS_URL: process.env.REDIS_URL || "",
    REDIS_HOST: process.env.REDIS_HOST || "",
    REDIS_PORT: process.env.REDIS_PORT || "",
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
    REDIS_USERNAME: process.env.REDIS_USERNAME || "default",

    // Google Cloud / Vertex AI
    GOOGLE_CLOUD_PROJECT_ID: "gen-lang-client-0092649281",
    GOOGLE_CLOUD_REGION: "us-central1",
  };

  // Read Vertex Key
  const vertexKeyPath = path.resolve(process.cwd(), "zyeute-vertex-key.json");
  if (fs.existsSync(vertexKeyPath)) {
    console.log("🔑 Found vertex key, preparing GOOGLE_CREDENTIALS...");
    const keyData = fs.readFileSync(vertexKeyPath, "utf8");
    variables["GOOGLE_CREDENTIALS"] = keyData;
  }

  // Read Fallback AI Key
  const aiKeyPath = path.resolve(process.cwd(), "zyeute-ai-key.json");
  if (fs.existsSync(aiKeyPath)) {
    console.log("🔑 Found fallback AI key, preparing GOOGLE_AI_KEY_JSON...");
    const keyData = fs.readFileSync(aiKeyPath, "utf8");
    variables["GOOGLE_AI_KEY_JSON"] = keyData;
  }

  // Set variables one by one
  for (const [key, value] of Object.entries(variables)) {
    if (!value) {
      console.log(`⚠️ Skipping ${key} (no value)`);
      continue;
    }

    console.log(`📡 Setting ${key}...`);
    try {
      // Use npx to run railway cli
      // Note: We escape the value properly for shell
      const command = `npx @railway/cli variables set -s "ZyeuteV5" "${key}=${value.replace(/"/g, '\\"')}"`;
      execSync(command, {
        stdio: "inherit",
        env: { ...process.env, RAILWAY_TOKEN },
      });
    } catch (error) {
      console.error(`❌ Failed to set ${key}`);
    }
  }

  console.log(
    "\n✅ Sync complete! Railway should be redeploying with the new secrets.",
  );
}

syncToRailway().catch(console.error);
