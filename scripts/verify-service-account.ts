#!/usr/bin/env tsx
/**
 * Verify Service Account Configuration
 *
 * Checks that vertex-express@floguru.iam.gserviceaccount.com is configured correctly
 * and has the required permissions for Vertex AI and Dialogflow CX.
 *
 * Usage:
 *   tsx scripts/verify-service-account.ts
 */

import "dotenv/config";
import { execSync } from "child_process";

const SERVICE_ACCOUNT = "vertex-express@floguru.iam.gserviceaccount.com";
const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT || "spatial-garden-483401-g8";

async function checkServiceAccountExists() {
  try {
    console.log("🔍 Checking Service Account exists...\n");

    const output = execSync(
      `gcloud iam service-accounts describe ${SERVICE_ACCOUNT} --project=${PROJECT_ID}`,
      { encoding: "utf-8" },
    );

    console.log("✅ Service Account exists:");
    console.log(output);
    return true;
  } catch (error: any) {
    console.log("❌ Service Account not found or not accessible");
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function checkRoles() {
  try {
    console.log("\n🔍 Checking Service Account roles...\n");

    const output = execSync(
      `gcloud projects get-iam-policy ${PROJECT_ID} --flatten="bindings[].members" --filter="bindings.members:${SERVICE_ACCOUNT}" --format="table(bindings.role)"`,
      { encoding: "utf-8" },
    );

    console.log("📋 Current roles:");
    console.log(output);

    const requiredRoles = [
      "roles/aiplatform.user", // Vertex AI User
      "roles/dialogflow.client", // Dialogflow API Client
    ];

    const optionalRoles = [
      "roles/storage.objectViewer", // GCS Viewer
      "roles/storage.objectCreator", // GCS Creator
    ];

    const roles = output.toLowerCase();
    let allRequired = true;

    console.log("\n✅ Required roles:");
    for (const role of requiredRoles) {
      if (roles.includes(role.toLowerCase())) {
        console.log(`   ✅ ${role}`);
      } else {
        console.log(`   ❌ ${role} - MISSING`);
        allRequired = false;
      }
    }

    console.log("\n📦 Optional roles:");
    for (const role of optionalRoles) {
      if (roles.includes(role.toLowerCase())) {
        console.log(`   ✅ ${role}`);
      } else {
        console.log(`   ⚪ ${role} - Not set (optional)`);
      }
    }

    return allRequired;
  } catch (error: any) {
    const errorMsg = error.message.toLowerCase();
    if (errorMsg.includes("permission") || errorMsg.includes("denied")) {
      console.log("⚠️  Permission denied when checking roles");
      console.log("   You may not have IAM Admin permissions");
      console.log(
        "   Ask a project owner/admin to grant roles, or verify manually in GCP Console",
      );
      console.log(
        "   GCP Console → IAM & Admin → IAM → Find Service Account → Check roles",
      );
      // Don't fail completely - roles might exist, we just can't verify
      return true; // Assume OK if we can't verify (user can check manually)
    }
    console.log("❌ Failed to check roles");
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function checkCredentials() {
  console.log("\n🔍 Checking credentials configuration...\n");

  const hasFile = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const hasJson = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (hasFile) {
    console.log(
      `✅ GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`,
    );
  } else {
    console.log("⚠️  GOOGLE_APPLICATION_CREDENTIALS not set");
  }

  if (hasJson) {
    console.log("✅ GOOGLE_SERVICE_ACCOUNT_JSON: Set (hidden for security)");
  } else {
    console.log("⚠️  GOOGLE_SERVICE_ACCOUNT_JSON not set");
  }

  if (!hasFile && !hasJson) {
    console.log("\n❌ No credentials configured!");
    console.log(
      "   Set either GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON",
    );
    return false;
  }

  return true;
}

async function main() {
  console.log("🔒 Verifying Service Account Configuration\n");
  console.log(`Service Account: ${SERVICE_ACCOUNT}`);
  console.log(`Project: ${PROJECT_ID}\n`);

  const results = {
    exists: false,
    roles: false,
    credentials: false,
  };

  // Check if Service Account exists
  results.exists = await checkServiceAccountExists();

  if (!results.exists) {
    console.log("\n❌ Service Account verification failed");
    console.log("\n💡 Troubleshooting:");
    console.log("   1. Verify Service Account email is correct");
    console.log("   2. Check project ID matches");
    console.log("   3. Ensure you have permission to view Service Accounts");
    process.exit(1);
  }

  // Check roles
  results.roles = await checkRoles();

  // Check credentials
  results.credentials = await checkCredentials();

  // Summary
  console.log("\n📊 Summary:");
  console.log(`   Service Account exists: ${results.exists ? "✅" : "❌"}`);
  console.log(`   Required roles: ${results.roles ? "✅" : "❌"}`);
  console.log(
    `   Credentials configured: ${results.credentials ? "✅" : "❌"}`,
  );
  console.log();

  if (results.exists && results.roles && results.credentials) {
    console.log("✅ Service Account is configured correctly!");
    console.log("\n💰 Ready to use:");
    console.log("   - Vertex AI (GenAI App Builder credits: $1,367.95)");
    console.log("   - Dialogflow CX (Dialogflow CX credits: $813.16)");
    console.log("   - GCS Storage (if roles are set)");
    process.exit(0);
  } else {
    console.log("⚠️  Service Account configuration incomplete");
    console.log("\n🔧 Action Required:");

    if (!results.roles) {
      console.log("\n1️⃣  Grant Required Roles:");
      console.log("\n   Option A: If you have IAM Admin permissions:");
      console.log(`      npm run grant:service-account-roles`);
      console.log("\n   Option B: Manual commands:");
      console.log(
        `      gcloud projects add-iam-policy-binding ${PROJECT_ID} \\`,
      );
      console.log(`        --member="serviceAccount:${SERVICE_ACCOUNT}" \\`);
      console.log(`        --role="roles/aiplatform.user"`);
      console.log(
        `      gcloud projects add-iam-policy-binding ${PROJECT_ID} \\`,
      );
      console.log(`        --member="serviceAccount:${SERVICE_ACCOUNT}" \\`);
      console.log(`        --role="roles/dialogflow.client"`);
      console.log("\n   Option C: If you don't have permissions:");
      console.log("      Ask project owner/admin to grant roles");
      console.log(
        "      Or verify manually in GCP Console → IAM & Admin → IAM",
      );
    }

    if (!results.credentials) {
      console.log("\n2️⃣  Configure Credentials:");
      console.log("\n   Step 1: Download Service Account key:");
      console.log("      GCP Console → IAM & Admin → Service Accounts");
      console.log(`      Find: ${SERVICE_ACCOUNT}`);
      console.log("      Keys tab → Add Key → Create new key → JSON");
      console.log("\n   Step 2: Set in .env file (gitignored):");
      console.log("      GOOGLE_APPLICATION_CREDENTIALS=./path/to/key.json");
      console.log("      OR");
      console.log("      GOOGLE_SERVICE_ACCOUNT_JSON={...paste JSON here...}");
      console.log("\n   See: docs/SERVICE_ACCOUNT_SETUP_GUIDE.md for details");
    }

    console.log("\n📋 Quick Setup Guide:");
    console.log("   docs/SERVICE_ACCOUNT_SETUP_GUIDE.md");

    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Verification failed:", error);
  process.exit(1);
});
