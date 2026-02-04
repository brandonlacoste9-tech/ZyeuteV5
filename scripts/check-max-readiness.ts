#!/usr/bin/env tsx
/**
 * Check Max Readiness
 *
 * Verifies all prerequisites for waking Max
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { existsSync } from "fs";

console.log("🔍 Checking Max Readiness...\n");

let allGood = true;

// Check 1: MAX_API_TOKEN in .env
console.log("1️⃣  Checking MAX_API_TOKEN...");
const envPath = ".env";
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  const hasToken = envContent.includes("MAX_API_TOKEN=");
  if (hasToken) {
    const tokenMatch = envContent.match(/MAX_API_TOKEN=(.+)/);
    if (tokenMatch && tokenMatch[1] && !tokenMatch[1].includes("your-secret")) {
      console.log("   ✅ MAX_API_TOKEN is configured\n");
    } else {
      console.log("   ⚠️  MAX_API_TOKEN is set but may be a placeholder\n");
      allGood = false;
    }
  } else {
    console.log("   ❌ MAX_API_TOKEN not found in .env\n");
    allGood = false;
  }
} else {
  console.log("   ❌ .env file not found\n");
  allGood = false;
}

// Check 2: Backend routes exist
console.log("2️⃣  Checking Max API routes...");
const maxApiRoutePath = "backend/routes/max-api.ts";
if (existsSync(maxApiRoutePath)) {
  console.log("   ✅ Max API routes file exists\n");
} else {
  console.log("   ❌ Max API routes file not found\n");
  allGood = false;
}

// Check 3: Wake script exists
console.log("3️⃣  Checking wake script...");
const wakeScriptPath = "scripts/wake-max.ts";
if (existsSync(wakeScriptPath)) {
  console.log("   ✅ Wake script exists\n");
} else {
  console.log("   ❌ Wake script not found\n");
  allGood = false;
}

// Check 4: Backend running
async function checkBackend() {
  console.log("4️⃣  Checking backend status...");
  try {
    const port = process.env.PORT || 3000;
    const response = await fetch(`http://localhost:${port}/api/max/status`, {
      method: "GET",
      headers: {
        Authorization: process.env.MAX_API_TOKEN || "",
      },
    });

    if (response.ok) {
      console.log("   ✅ Backend is running and Max API is accessible!\n");
    } else if (response.status === 401) {
      console.log("   ⚠️  Backend is running but token may be incorrect\n");
    } else {
      console.log(`   ⚠️  Backend responded with status: ${response.status}\n`);
    }
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      console.log(
        "   ⚠️  Backend is not running (port 10000 not accessible)\n",
      );
      console.log("   💡 Start backend with: npm run dev\n");
    } else {
      console.log(`   ⚠️  Cannot reach backend: ${error.message}\n`);
    }
  }

  // Summary
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (allGood) {
    console.log("✅ Max is ready to wake up!");
    console.log("\n📋 Next steps:");
    console.log("   1. Start backend: npm run dev");
    console.log("   2. Wake Max: npm run wake:max");
    console.log("   3. Test commands: npm run test:max\n");
  } else {
    console.log("⚠️  Some checks failed. Review above and fix issues.\n");
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

checkBackend();
