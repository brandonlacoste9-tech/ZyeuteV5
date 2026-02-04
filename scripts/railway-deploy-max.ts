#!/usr/bin/env tsx
/**
 * Deploy Max API Token to Railway
 *
 * Sets MAX_API_TOKEN in Railway production environment
 *
 * Usage:
 *   tsx scripts/railway-deploy-max.ts
 */

import "dotenv/config";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const MAX_API_TOKEN = process.env.MAX_API_TOKEN;

if (!MAX_API_TOKEN) {
  console.error("❌ MAX_API_TOKEN not found in .env");
  console.log("\n💡 Add to .env:");
  console.log("   MAX_API_TOKEN=your-token-here\n");
  process.exit(1);
}

async function deployMaxToken() {
  console.log("🚂 Deploying MAX_API_TOKEN to Railway...\n");
  console.log(`Token: ${MAX_API_TOKEN.substring(0, 10)}...\n`);

  try {
    // Set MAX_API_TOKEN in Railway
    const { stdout, stderr } = await execAsync(
      `railway variables set MAX_API_TOKEN=${MAX_API_TOKEN}`,
    );

    if (stderr && !stderr.includes("warning")) {
      console.error("❌ Error setting variable:", stderr);
      process.exit(1);
    }

    console.log("✅ MAX_API_TOKEN deployed to Railway!");
    console.log("\n📋 Next steps:");
    console.log("   1. Verify: railway variables");
    console.log("   2. Redeploy service: railway up");
    console.log("   3. Test Max: npm run wake:max\n");
  } catch (error: any) {
    console.error("❌ Failed to deploy token:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("   1. Verify Railway CLI is authenticated: railway status");
    console.log("   2. Check you're in the correct project");
    console.log("   3. Ensure RAILWAY_TOKEN is set in .env\n");
    process.exit(1);
  }
}

deployMaxToken();
