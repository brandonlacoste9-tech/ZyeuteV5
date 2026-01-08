#!/usr/bin/env tsx
/**
 * Verify Vertex AI Configuration
 * Checks that Vertex AI environment variables and services are properly configured
 */

import { config } from "dotenv";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, "../.env") });

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  bright: "\x1b[1m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvVar(name: string, required: boolean = false): { found: boolean; value?: string } {
  const value = process.env[name];
  const found = !!value;
  
  if (required && !found) {
    log(`❌ ${name}: NOT SET (required)`, "red");
  } else if (found) {
    // Mask sensitive values
    const displayValue = name.includes("JSON") || name.includes("KEY") || name.includes("SECRET")
      ? `${value?.substring(0, 20)}...` 
      : value;
    log(`✅ ${name}: ${displayValue}`, "green");
  } else {
    log(`⚠️  ${name}: NOT SET (optional)`, "yellow");
  }
  
  return { found, value };
}

async function main() {
  log("\n🔍 Vertex AI Configuration Verification\n", "bright");
  log("=" .repeat(60), "blue");

  log("\n📋 Environment Variables:\n", "bright");

  // Check required variables
  const projectId = checkEnvVar("GOOGLE_CLOUD_PROJECT_ID", false);
  const projectIdAlt = checkEnvVar("GOOGLE_CLOUD_PROJECT", false);
  const region = checkEnvVar("GOOGLE_CLOUD_REGION", false);
  const serviceAccountJson = checkEnvVar("GOOGLE_SERVICE_ACCOUNT_JSON", false);
  const serviceAccountPath = checkEnvVar("GOOGLE_APPLICATION_CREDENTIALS", false);

  // Check alternative names
  checkEnvVar("VERTEX_AI_PROJECT_ID", false);
  checkEnvVar("VERTEX_AI_LOCATION", false);
  checkEnvVar("GCP_PROJECT_ID", false);

  log("\n📦 Package Verification:\n", "bright");

  try {
    const vertexAI = await import("@google-cloud/vertexai");
    log("✅ @google-cloud/vertexai: Installed", "green");
  } catch (error) {
    log("❌ @google-cloud/vertexai: NOT INSTALLED", "red");
    log("   Run: npm install @google-cloud/vertexai", "yellow");
  }

  try {
    const speech = await import("@google-cloud/speech");
    log("✅ @google-cloud/speech: Installed", "green");
  } catch (error) {
    log("❌ @google-cloud/speech: NOT INSTALLED", "red");
  }

  try {
    const vision = await import("@google-cloud/vision");
    log("✅ @google-cloud/vision: Installed", "green");
  } catch (error) {
    log("❌ @google-cloud/vision: NOT INSTALLED", "red");
  }

  log("\n🔧 Configuration Summary:\n", "bright");

  const hasProjectId = projectId.found || projectIdAlt.found;
  const hasCredentials = serviceAccountJson.found || serviceAccountPath.found;

  if (hasProjectId && hasCredentials) {
    log("✅ Vertex AI appears to be fully configured!", "green");
    log(`   Project: ${projectId.value || projectIdAlt.value || "unknown"}`, "blue");
    log(`   Region: ${region.value || "us-central1 (default)"}`, "blue");
  } else if (hasProjectId) {
    log("⚠️  Project ID found but credentials missing", "yellow");
    log("   Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS", "yellow");
  } else if (hasCredentials) {
    log("⚠️  Credentials found but project ID missing", "yellow");
    log("   Set GOOGLE_CLOUD_PROJECT_ID or GOOGLE_CLOUD_PROJECT", "yellow");
  } else {
    log("❌ Vertex AI not configured", "red");
    log("   Set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_SERVICE_ACCOUNT_JSON", "yellow");
  }

  log("\n📝 Files to check:\n", "bright");
  log("   • backend/ai/vertex-service.ts", "blue");
  log("   • backend/ai/vertex-gemini.ts", "blue");

  log("\n" + "=".repeat(60), "blue");
  log("\n");
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, "red");
  process.exit(1);
});
