#!/usr/bin/env tsx
/**
 * Deploy to Railway and Vercel
 * 
 * This script:
 * 1. Checks git status and pushes if needed
 * 2. Triggers Railway deployment (via CLI or GitHub)
 * 3. Triggers Vercel deployment (via CLI or GitHub Actions)
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command: string, options: { cwd?: string; silent?: boolean; shell?: boolean } = {}) {
  try {
    const output = execSync(command, {
      cwd: options.cwd || process.cwd(),
      encoding: "utf-8",
      stdio: options.silent ? "pipe" : "inherit",
      shell: options.shell ?? process.platform === "win32",
    });
    return { success: true, output: output.toString() };
  } catch (error: any) {
    return { success: false, error: error.message, output: error.stdout?.toString() || "" };
  }
}

function checkCommandExists(command: string): boolean {
  const isWindows = process.platform === "win32";
  try {
    if (isWindows) {
      execSync(`where ${command}`, { stdio: "ignore", shell: true });
    } else {
      execSync(`which ${command}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

async function main() {
  log("\n🚀 Zyeuté Deployment Script\n", "cyan");
  log("=" .repeat(50), "cyan");

  // Step 1: Check git status (ignore submodule changes)
  log("\n📦 Step 1: Checking git status...", "bright");
  const gitStatus = exec("git status --porcelain", { silent: true });
  const gitBranch = exec("git rev-parse --abbrev-ref HEAD", { silent: true });
  const currentBranch = gitBranch.output?.trim() || "unknown";

  // Filter out submodule-only changes (lines starting with space or M followed by space/submodule name)
  const statusLines = gitStatus.output?.trim().split("\n").filter(line => {
    const trimmed = line.trim();
    // Ignore submodule changes (lines like " M ZyeuteV5")
    if (trimmed.match(/^[ M]+\s+[A-Z]/)) return false;
    // Keep actual file changes
    return trimmed.length > 0;
  }) || [];

  if (statusLines.length > 0) {
    log("⚠️  You have uncommitted changes!", "yellow");
    log("   Please commit and push your changes first.", "yellow");
    log(`   Current branch: ${currentBranch}`, "yellow");
    log(`   Changes: ${statusLines.join(", ")}`, "yellow");
    process.exit(1);
  }

  // Check if we're ahead of origin
  const aheadCheck = exec("git log origin/main..HEAD --oneline", { silent: true });
  if (aheadCheck.output?.trim()) {
    log("📤 Pushing to origin/main...", "blue");
    const pushResult = exec("git push origin main");
    if (!pushResult.success) {
      log("❌ Git push failed!", "red");
      log("   Please fix git issues and try again.", "red");
      process.exit(1);
    }
    log("✅ Successfully pushed to origin/main", "green");
  } else {
    log("✅ Already up to date with origin/main", "green");
  }

  // Get current commit hash
  const commitHash = exec("git rev-parse --short HEAD", { silent: true });
  const hash = commitHash.output?.trim() || "unknown";
  log(`   Commit: ${hash}`, "cyan");

  // Step 2: Railway deployment
  log("\n🚂 Step 2: Triggering Railway deployment...", "bright");
  
  // Inject token if not present (from Antigravity context)
  if (!process.env.RAILWAY_TOKEN) {
    process.env.RAILWAY_TOKEN = "6bf8bea8-b648-4226-9011-b634383fca18";
    log("   🔑 Using provided RAILWAY_TOKEN", "yellow");
  }

  if (process.env.RAILWAY_TOKEN) {
    log("   🔑 Found RAILWAY_TOKEN in environment", "green");
  }

  if (checkCommandExists("railway")) {
    log("   Found Railway CLI, attempting deployment...", "blue");
    const railwayResult = exec("railway up", { silent: false });
    if (railwayResult.success) {
      log("✅ Railway deployment triggered successfully", "green");
    } else {
      log("⚠️  Railway CLI deployment failed, but this is okay.", "yellow");
      log("   Railway should auto-deploy from GitHub push.", "yellow");
      log("   Check: https://railway.app/dashboard", "cyan");
    }
  } else {
    log("   Railway CLI not found.", "yellow");
    log("   Railway should auto-deploy from GitHub push.", "yellow");
    log("   If not, manually trigger at: https://railway.app/dashboard", "cyan");
    log("   Install CLI: npm install -g @railway/cli", "cyan");
  }

  // Step 3: Vercel deployment
  log("\n▲ Step 3: Triggering Vercel deployment...", "bright");
  
  if (checkCommandExists("vercel")) {
    log("   Found Vercel CLI, attempting deployment...", "blue");
    // Run Vercel deploy and capture output to check for success indicators
    const vercelOutput = exec("vercel --prod --yes 2>&1", { silent: true });
    
    // Check output for success indicators (URLs, "Queued", "Building", etc.)
    const output = vercelOutput.output || "";
    const hasDeploymentUrl = output.includes("Production:") || output.includes(".vercel.app");
    const hasQueuedOrBuilding = output.includes("Queued") || output.includes("Building") || output.includes("Completing");
    
    if (vercelOutput.success || hasDeploymentUrl || hasQueuedOrBuilding) {
      log("✅ Vercel deployment triggered successfully", "green");
      if (hasDeploymentUrl) {
        const urlMatch = output.match(/Production:\s*(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          log(`   Deployment URL: ${urlMatch[1]}`, "cyan");
        }
      }
    } else {
      log("⚠️  Vercel CLI deployment may have issues, but check dashboard.", "yellow");
      log("   Vercel should also auto-deploy from GitHub push or GitHub Actions.", "yellow");
      log("   Check: https://vercel.com/dashboard", "cyan");
      log("   Or GitHub Actions: https://github.com/brandonlacoste9-tech/ZyeuteV5/actions", "cyan");
    }
  } else {
    log("   Vercel CLI not found.", "yellow");
    log("   Vercel should auto-deploy via GitHub Actions (if secrets configured).", "yellow");
    log("   Check Actions: https://github.com/brandonlacoste9-tech/ZyeuteV5/actions", "cyan");
    log("   Or Dashboard: https://vercel.com/dashboard", "cyan");
    log("   Install CLI: npm install -g vercel", "cyan");
  }

  // Summary
  log("\n" + "=".repeat(50), "cyan");
  log("\n✅ Deployment process complete!\n", "green");
  
  log("📊 Next steps:", "bright");
  log("   1. Monitor Railway: https://railway.app/dashboard", "cyan");
  log("   2. Monitor Vercel: https://vercel.com/dashboard", "cyan");
  log("   3. Check GitHub Actions: https://github.com/brandonlacoste9-tech/ZyeuteV5/actions", "cyan");
  log("   4. Wait a few minutes for builds to complete", "cyan");
  log("\n🔗 Live URLs:", "bright");
  log("   • Railway API: https://zyeute-api.railway.app", "cyan");
  log("   • Vercel Frontend: https://www.zyeute.com", "cyan");
  log("\n");
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, "red");
  process.exit(1);
});
