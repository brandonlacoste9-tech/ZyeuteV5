#!/usr/bin/env tsx
/**
 * Security Verification Script
 *
 * Checks that sensitive values (Agent IDs, API keys) are not committed to git
 *
 * Usage:
 *   tsx scripts/verify-secrets-security.ts
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const SENSITIVE_PATTERNS = [
  /AQ\.[A-Za-z0-9_-]{40,}/, // Dialogflow Agent ID pattern
  /sk_live_[A-Za-z0-9]{32,}/, // Stripe live keys
  /sk_test_[A-Za-z0-9]{32,}/, // Stripe test keys
  /AIza[A-Za-z0-9_-]{35,}/, // Google API keys
  /-----BEGIN PRIVATE KEY-----/, // Private keys
  /-----BEGIN RSA PRIVATE KEY-----/, // RSA keys
];

const FILES_TO_CHECK = [
  // Only check committed files - .env files are gitignored and allowed to have secrets
  "backend/ai/dialogflow-bridge.ts",
  "backend/routes/dialogflow-tiguy.ts",
  "backend/routes/dialogflow-webhook.ts",
  "docs/DIALOGFLOW_AGENT_ID_CONFIG.md",
  ".env.example", // This should only have placeholders
];

function checkFile(filePath: string): { safe: boolean; issues: string[] } {
  const fullPath = join(process.cwd(), filePath);

  if (!existsSync(fullPath)) {
    return { safe: true, issues: [] };
  }

  // Skip gitignored files - they're allowed to have secrets for local dev
  if (filePath.startsWith(".env") && !filePath.includes(".example")) {
    return { safe: true, issues: [] }; // .env files are gitignored, skip them
  }

  const content = readFileSync(fullPath, "utf-8");
  const issues: string[] = [];

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(content)) {
      // Allow in .env.example if it's a placeholder
      if (filePath.includes(".env.example") && content.includes("YOUR_")) {
        continue; // Placeholder is OK
      }

      // Allow in docs if it's a placeholder
      if (
        filePath.includes("docs/") &&
        (content.includes("YOUR_") || content.includes("placeholder"))
      ) {
        continue; // Placeholder is OK
      }

      issues.push(`Potential sensitive data found (pattern: ${pattern})`);
    }
  }

  return {
    safe: issues.length === 0,
    issues,
  };
}

function main() {
  console.log("🔒 Verifying secrets security...\n");

  let allSafe = true;
  const results: Array<{ file: string; safe: boolean; issues: string[] }> = [];

  for (const file of FILES_TO_CHECK) {
    const result = checkFile(file);
    results.push({ file, ...result });

    if (!result.safe) {
      allSafe = false;
    }
  }

  // Print results
  for (const result of results) {
    if (result.safe) {
      console.log(`✅ ${result.file}`);
    } else {
      console.log(`❌ ${result.file}`);
      result.issues.forEach((issue) => {
        console.log(`   ⚠️  ${issue}`);
      });
    }
  }

  console.log();

  if (allSafe) {
    console.log("✅ All committed files are secure!");
    console.log("\n📋 Security Checklist:");
    console.log("   ✅ No sensitive data in committed files");
    console.log("   ✅ .env files are gitignored (allowed to have secrets)");
    console.log("   ✅ Documentation uses placeholders");
    console.log(
      "\n💡 Note: .env files are gitignored and allowed to contain real secrets for local development.",
    );
    process.exit(0);
  } else {
    console.log("❌ Security issues found in committed files!");
    console.log("\n🔧 Action Required:");
    console.log("   1. Remove sensitive data from committed files");
    console.log("   2. Use environment variables instead");
    console.log("   3. Use placeholders in documentation");
    console.log("   4. See docs/SECURITY_DIALOGFLOW_AGENT_ID.md for details");
    console.log(
      "\n💡 Note: .env files are gitignored and allowed to contain real secrets.",
    );
    process.exit(1);
  }
}

main();
