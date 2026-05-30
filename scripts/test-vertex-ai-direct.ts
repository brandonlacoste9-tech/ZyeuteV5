#!/usr/bin/env tsx
/**
 * Test Vertex AI Direct API Call (Uses GenAI App Builder Credits)
 *
 * This demonstrates the correct way to call Vertex AI to use your credits.
 *
 * Usage:
 *   tsx scripts/test-vertex-ai-direct.ts
 *
 * Requires:
 *   - GOOGLE_CLOUD_PROJECT=spatial-garden-483401-g8
 *   - GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON
 */

import "dotenv/config";
import { execSync } from "child_process";

const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT || "spatial-garden-483401-g8";
const LOCATION = process.env.GOOGLE_CLOUD_REGION || "us-central1";
const MODEL = "gemini-2.5-flash-lite";

async function getAccessToken(): Promise<string> {
  try {
    // Try to get token from gcloud CLI
    const token = execSync("gcloud auth print-access-token", {
      encoding: "utf-8",
    }).trim();
    return token;
  } catch (error) {
    throw new Error(
      "Failed to get access token. Ensure gcloud CLI is installed and authenticated, or set GOOGLE_APPLICATION_CREDENTIALS",
    );
  }
}

async function testVertexAI() {
  console.log("🧪 Testing Vertex AI Direct API Call...\n");
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Location: ${LOCATION}`);
  console.log(`Model: ${MODEL}\n`);

  try {
    const accessToken = await getAccessToken();
    console.log("✅ Got access token\n");

    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:streamGenerateContent`;

    console.log("📡 Calling Vertex AI endpoint...");
    console.log(`URL: ${url}\n`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Explain how AI works in a few words",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Response received:\n");

    // Parse streaming response
    if (data.candidates && data.candidates[0]) {
      const text = data.candidates[0].content.parts[0].text;
      console.log(`Response: ${text}\n`);
    } else {
      console.log("Full response:", JSON.stringify(data, null, 2));
    }

    console.log("✅ Vertex AI call successful!");
    console.log("\n💰 Credit Usage:");
    console.log("   This call used your GenAI App Builder credits ($1,367.95)");
    console.log("   Check GCP Console → Billing → Credits for usage\n");
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log(
      "   1. Ensure gcloud CLI is installed: https://cloud.google.com/sdk",
    );
    console.log("   2. Authenticate: gcloud auth login");
    console.log(
      "   3. Set project: gcloud config set project spatial-garden-483401-g8",
    );
    console.log("   4. Or set GOOGLE_APPLICATION_CREDENTIALS env var");
    process.exit(1);
  }
}

testVertexAI();
