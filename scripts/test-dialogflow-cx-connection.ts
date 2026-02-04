#!/usr/bin/env tsx
/**
 * Test Dialogflow CX API connection and credit usage
 *
 * Verifies that Dialogflow CX API calls work and use Dialogflow CX credits ($813.16)
 *
 * Usage:
 *   tsx scripts/test-dialogflow-cx-connection.ts [--agent-id=YOUR_AGENT_ID]
 *
 * Requires:
 *   - GOOGLE_CLOUD_PROJECT=spatial-garden-483401-g8
 *   - GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON
 *   - DIALOGFLOW_CX_AGENT_ID (or pass via --agent-id flag)
 */

import "dotenv/config";
import { DialogflowBridge } from "../backend/ai/dialogflow-bridge.js";

const AGENT_ID_ARG = process.argv.find((arg) => arg.startsWith("--agent-id="));
const TEST_AGENT_ID = AGENT_ID_ARG?.split("=")[1];

if (TEST_AGENT_ID) {
  process.env.DIALOGFLOW_CX_AGENT_ID = TEST_AGENT_ID;
}

async function testDialogflowCX() {
  console.log("🔍 Testing Dialogflow CX API connection...\n");
  console.log(
    `Project: ${process.env.GOOGLE_CLOUD_PROJECT || "spatial-garden-483401-g8"}`,
  );
  console.log(`Agent ID: ${process.env.DIALOGFLOW_CX_AGENT_ID || "NOT SET"}\n`);

  if (!process.env.DIALOGFLOW_CX_AGENT_ID && !TEST_AGENT_ID) {
    console.error("❌ DIALOGFLOW_CX_AGENT_ID not set!");
    console.log("\n📋 To get your Agent ID:");
    console.log("   1. Go to Dialogflow CX Console");
    console.log("   2. Select your agent");
    console.log("   3. Copy the Agent ID from the URL or agent settings");
    console.log(
      "   4. Set DIALOGFLOW_CX_AGENT_ID env var or use --agent-id flag\n",
    );
    process.exit(1);
  }

  // Test 1: Simple text intent detection
  console.log("📝 Test 1: Text Intent Detection");
  console.log("   Query: 'Bonjour Ti-Guy'\n");

  try {
    const result1 = await DialogflowBridge.detectIntent(
      "test-session-123",
      { text: "Bonjour Ti-Guy" },
      "fr-CA",
    );

    console.log("✅ Response received:");
    console.log(`   Intent: ${result1.intent}`);
    console.log(`   Confidence: ${result1.confidence}`);
    console.log(`   Fulfillment: ${result1.fulfillmentText}`);
    console.log(`   Parameters: ${JSON.stringify(result1.parameters)}\n`);
  } catch (error: any) {
    console.error("❌ Test 1 failed:", error.message);
    if (error.message.includes("not found")) {
      console.log(
        "\n💡 Tip: Ensure Agent ID is correct and agent exists in Dialogflow CX Console",
      );
    }
    console.log();
  }

  // Test 2: Ti-Guy voice response
  console.log("🎤 Test 2: Ti-Guy Voice Response");
  console.log("   Query: 'Montre-moi le feed'\n");

  try {
    const result2 = await DialogflowBridge.getTiGuyVoiceResponse(
      "test-user-456",
      "Montre-moi le feed",
    );

    console.log("✅ Ti-Guy response:");
    console.log(`   Response: ${result2.response}`);
    console.log(`   Intent: ${result2.intent}`);
    console.log(`   Confidence: ${result2.confidence}`);
    if (result2.action) {
      console.log(`   Action: ${JSON.stringify(result2.action)}`);
    }
    console.log();
  } catch (error: any) {
    console.error("❌ Test 2 failed:", error.message);
    console.log();
  }

  // Test 3: Quebec French / Joual
  console.log("🇨🇦 Test 3: Quebec French (Joual)");
  console.log("   Query: 'Salut là, comment ça va?'\n");

  try {
    const result3 = await DialogflowBridge.detectIntent(
      "test-session-joual",
      { text: "Salut là, comment ça va?" },
      "fr-CA",
    );

    console.log("✅ Joual response:");
    console.log(`   Intent: ${result3.intent}`);
    console.log(`   Fulfillment: ${result3.fulfillmentText}\n`);
  } catch (error: any) {
    console.error("❌ Test 3 failed:", error.message);
    console.log();
  }

  console.log("📊 Summary:");
  console.log("   ✅ If all tests passed, Dialogflow CX is working!");
  console.log("   💰 Check GCP Billing → Credits → Dialogflow CX for usage");
  console.log(
    "   📋 Next: Integrate DialogflowBridge in your backend routes\n",
  );
}

testDialogflowCX().catch((error) => {
  console.error("❌ Test suite failed:", error);
  process.exit(1);
});
