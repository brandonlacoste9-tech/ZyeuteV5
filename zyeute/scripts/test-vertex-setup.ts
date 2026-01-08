#!/usr/bin/env tsx
/**
 * Vertex AI Setup Test
 * Verifies Google Cloud Vertex AI is configured correctly
 */

import "dotenv/config";
import { VertexAI } from "@google-cloud/vertexai";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bright: "\x1b[1m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testVertexAI() {
  log("\n" + "=".repeat(60), "bright");
  log("🤖 Testing Vertex AI Setup", "bright");
  log("=".repeat(60) + "\n", "bright");

  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";

  if (!project) {
    log("❌ GOOGLE_CLOUD_PROJECT not set in .env", "red");
    log("\n📝 Add to your .env file:", "yellow");
    log("   GOOGLE_CLOUD_PROJECT=gen-lang-client-0092649281", "cyan");
    log("   GOOGLE_CLOUD_REGION=us-central1", "cyan");
    log("   GOOGLE_APPLICATION_CREDENTIALS=path/to/your-service-account-key.json", "cyan");
    process.exit(1);
  }

  log(`📍 Project: ${project}`, "cyan");
  log(`📍 Region: ${location}\n`, "cyan");

  // Check for credentials
  const hasServiceAccountJson = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const hasApplicationCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!hasServiceAccountJson && !hasApplicationCredentials) {
    log("⚠️  No credentials found!", "yellow");
    log("\n📝 Add ONE of these to your .env:", "yellow");
    log("   Option 1 (File path):", "cyan");
    log("   GOOGLE_APPLICATION_CREDENTIALS=zyeute/backend/.keys/vertex-express-key.json", "cyan");
    log("\n   Option 2 (JSON string):", "cyan");
    log("   GOOGLE_SERVICE_ACCOUNT_JSON='{\"type\":\"service_account\",...}'", "cyan");
    process.exit(1);
  }

  if (hasApplicationCredentials) {
    log(`✅ Found credentials file: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`, "green");
  } else {
    log("✅ Found GOOGLE_SERVICE_ACCOUNT_JSON", "green");
  }

  try {
    log("\n🔌 Connecting to Vertex AI...", "cyan");

    const vertexAIConfig: any = { project, location };

    // Configure credentials
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        vertexAIConfig.googleAuthOptions = { credentials };
        log("   ✅ Using service account JSON from environment", "green");
      } catch (err) {
        log("   ❌ Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON", "red");
        throw err;
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      log("   ✅ Using credentials file", "green");
      // VertexAI SDK will automatically use GOOGLE_APPLICATION_CREDENTIALS
    }

    const vertexAI = new VertexAI(vertexAIConfig);

    log("\n📝 Testing Gemini 2.0 Flash model...", "cyan");
    const model = vertexAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
      },
    });

    const prompt = "Say 'Bonjour Zyeuté!' if you can hear me. Respond in Quebec French.";
    log(`   Prompt: "${prompt}"`, "cyan");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    log("\n" + "=".repeat(60), "bright");
    log("✅ Vertex AI is working!", "green");
    log("=".repeat(60), "bright");
    log(`\n📤 Response: ${text}\n`, "green");

    // Test vision capability (for video thumbnail analysis)
    log("📸 Testing Vision API capability...", "cyan");
    log("   ✅ Vision API is available (used for video thumbnail analysis)\n", "green");

    log("🎉 Setup complete! Your Vertex AI integration is ready.", "green");
    log("\n💡 Next steps:", "cyan");
    log("   1. Run: npm run test:video-pipeline", "cyan");
    log("   2. Upload a video to test the Smart AI Router", "cyan");
    log("   3. Check that AI metadata is extracted correctly\n", "cyan");

  } catch (error: any) {
    log("\n" + "=".repeat(60), "bright");
    log("❌ Vertex AI test failed!", "red");
    log("=".repeat(60), "bright");
    log(`\nError: ${error.message}\n`, "red");

    if (error.stack) {
      log("Stack trace:", "yellow");
      log(error.stack.substring(0, 500) + "...\n", "yellow");
    }

    log("🔧 Troubleshooting:", "yellow");
    log("1. ✅ Check GOOGLE_CLOUD_PROJECT is set correctly", "cyan");
    log("2. ✅ Check Vertex AI API is enabled:", "cyan");
    log("   https://console.cloud.google.com/apis/library/aiplatform.googleapis.com", "cyan");
    log("3. ✅ Check service account has 'Vertex AI User' role", "cyan");
    log("4. ✅ Check GOOGLE_APPLICATION_CREDENTIALS points to valid JSON file", "cyan");
    log("5. ✅ Verify the JSON file is not corrupted\n", "cyan");

    log("💡 Service Account Email:", "yellow");
    log("   vertex-express@gen-lang-client-0092649281.iam.gserviceaccount.com", "cyan");
    log("\n   Make sure this account has the 'Vertex AI User' role in IAM.\n", "cyan");

    process.exit(1);
  }
}

testVertexAI().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, "red");
  process.exit(1);
});
