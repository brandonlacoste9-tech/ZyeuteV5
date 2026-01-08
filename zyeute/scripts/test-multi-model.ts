#!/usr/bin/env tsx
/**
 * Multi-Model Test Script
 * Tests Gemini 3 Pro, DeepSeek R1, and Copilot
 * Compares their responses and performance
 */

import "dotenv/config";
import { routeMultiModel, callSingleModel } from "../backend/ai/multi-model-router.js";
import { compareAllModels } from "../backend/ai/multi-model-comparison.js";
import { generateWithTIGuyMultiModel } from "../backend/ai/ti-guy-multi-model.js";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bright: "\x1b[1m",
  magenta: "\x1b[35m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSingleProviders() {
  log("\n" + "=".repeat(60), "bright");
  log("🧪 Test 1: Individual Provider Tests", "bright");
  log("=".repeat(60) + "\n", "bright");

  const prompt = "Say 'Bonjour Zyeuté!' in Quebec French and explain what makes Quebec special in 2 sentences.";

  const providers = [
    { name: "Gemini 3 Pro", id: "gemini-3-pro" as const },
    { name: "DeepSeek R1", id: "deepseek-r1" as const },
    { name: "Copilot", id: "copilot" as const },
  ];

  for (const provider of providers) {
    log(`\n📡 Testing ${provider.name}...`, "cyan");
    try {
      const startTime = Date.now();
      const result = await callSingleModel(provider.id, prompt, {
        temperature: 0.7,
        maxTokens: 200,
      });
      const latency = Date.now() - startTime;

      log(`   ✅ Success!`, "green");
      log(`   ⏱️  Latency: ${latency}ms`, "cyan");
      log(`   📊 Tokens: ${result.tokensUsed || "N/A"}`, "cyan");
      log(`   💬 Response: ${result.content.substring(0, 100)}...`, "green");
    } catch (error: any) {
      log(`   ❌ Failed: ${error.message}`, "red");
      if (error.message.includes("not configured")) {
        log(`   💡 Tip: Check your environment variables`, "yellow");
      }
    }
  }
}

async function testMultiModelRouter() {
  log("\n" + "=".repeat(60), "bright");
  log("🧪 Test 2: Multi-Model Router (Best Strategy)", "bright");
  log("=".repeat(60) + "\n", "bright");

  const prompt = "Create a fun Quebec meme caption about winter in Montreal.";

  try {
    log("📡 Calling all 3 models...", "cyan");
    const result = await routeMultiModel({
      prompt,
      providers: ["gemini-3-pro", "deepseek-r1", "copilot"],
      strategy: "best",
      temperature: 0.8,
      maxTokens: 150,
    });

    log(`\n✅ Primary Response (${result.primary.provider}):`, "green");
    log(`   ${result.primary.content}`, "green");
    
    if (result.alternatives && result.alternatives.length > 0) {
      log(`\n📋 Alternative Responses:`, "cyan");
      result.alternatives.forEach((alt, i) => {
        log(`   ${i + 1}. ${alt.provider}: ${alt.content.substring(0, 80)}...`, "cyan");
      });
    }

    if (result.consensus) {
      log(`\n📊 Consensus: ${(result.consensus.agreement * 100).toFixed(1)}% agreement`, "magenta");
      if (result.consensus.commonThemes.length > 0) {
        log(`   Common themes: ${result.consensus.commonThemes.join(", ")}`, "magenta");
      }
    }
  } catch (error: any) {
    log(`\n❌ Failed: ${error.message}`, "red");
  }
}

async function testComparison() {
  log("\n" + "=".repeat(60), "bright");
  log("🧪 Test 3: Full Comparison Mode", "bright");
  log("=".repeat(60) + "\n", "bright");

  const prompt = "Write a short Quebec social media post about poutine.";

  try {
    log("📡 Comparing all models...", "cyan");
    const comparison = await compareAllModels(prompt);

    log(`\n🏆 Overall Winner: ${comparison.winner}`, "bright");
    log(`\n📊 Performance Insights:`, "cyan");
    log(`   ⚡ Fastest: ${comparison.insights.bestForSpeed}`, "cyan");
    log(`   ✨ Best Quality: ${comparison.insights.bestForQuality}`, "cyan");
    log(`   💰 Most Cost-Effective: ${comparison.insights.bestForCost}`, "cyan");
    log(`   🤝 Consensus: ${(comparison.insights.consensus * 100).toFixed(1)}%`, "cyan");

    log(`\n📋 Detailed Responses:`, "bright");
    comparison.responses.forEach((r, i) => {
      log(`\n${i + 1}. ${r.provider.toUpperCase()}`, "bright");
      log(`   Content: ${r.content.substring(0, 120)}...`, "green");
      log(`   Quality Scores:`, "cyan");
      log(`      Coherence: ${(r.quality.coherence * 100).toFixed(1)}%`, "cyan");
      log(`      Relevance: ${(r.quality.relevance * 100).toFixed(1)}%`, "cyan");
      log(`      Creativity: ${(r.quality.creativity * 100).toFixed(1)}%`, "cyan");
      log(`   Performance:`, "cyan");
      log(`      Latency: ${r.performance.latency}ms`, "cyan");
      log(`      Tokens: ${r.performance.tokensUsed}`, "cyan");
      log(`      Cost: $${r.performance.cost.toFixed(6)}`, "cyan");
    });
  } catch (error: any) {
    log(`\n❌ Comparison failed: ${error.message}`, "red");
    if (error.message.includes("All AI providers failed")) {
      log(`   💡 Tip: At least one provider must be configured`, "yellow");
    }
  }
}

async function testTIGuyMultiModel() {
  log("\n" + "=".repeat(60), "bright");
  log("🧪 Test 4: TI-Guy Multi-Model Integration", "bright");
  log("=".repeat(60) + "\n", "bright");

  try {
    log("📡 Generating TI-Guy response with all 3 models...", "cyan");
    const response = await generateWithTIGuyMultiModel(
      {
        mode: "content",
        message: "Create a fun caption for a photo of Montreal in winter",
        context: "Social media post",
      },
      {
        strategy: "best",
        compareMode: false,
      }
    );

    log(`\n✅ Response:`, "green");
    log(`   ${response.content}`, "green");
    log(`\n📊 Metadata:`, "cyan");
    if (response.metadata) {
      log(`   Primary Provider: ${response.metadata.primaryProvider}`, "cyan");
      log(`   All Providers: ${response.metadata.providers.join(", ")}`, "cyan");
      log(`   Strategy: ${response.metadata.strategy}`, "cyan");
      if (response.metadata.consensus) {
        log(`   Consensus: ${(response.metadata.consensus * 100).toFixed(1)}%`, "cyan");
      }
    }
  } catch (error: any) {
    log(`\n❌ Failed: ${error.message}`, "red");
  }
}

async function main() {
  log("\n" + "=".repeat(60), "bright");
  log("🚀 Multi-Model AI Test Suite", "bright");
  log("Testing: Gemini 3 Pro | DeepSeek R1 | Copilot", "bright");
  log("=".repeat(60) + "\n", "bright");

  // Check configuration
  log("📋 Configuration Check:", "cyan");
  const checks = {
    "GOOGLE_CLOUD_PROJECT": !!process.env.GOOGLE_CLOUD_PROJECT,
    "DEEPSEEK_API_KEY": !!process.env.DEEPSEEK_API_KEY,
    "AZURE_OPENAI_API_KEY": !!process.env.AZURE_OPENAI_API_KEY,
    "AZURE_OPENAI_ENDPOINT": !!process.env.AZURE_OPENAI_ENDPOINT,
  };

  for (const [key, configured] of Object.entries(checks)) {
    log(`   ${configured ? "✅" : "❌"} ${key}`, configured ? "green" : "yellow");
  }

  const configuredCount = Object.values(checks).filter(Boolean).length;
  if (configuredCount === 0) {
    log("\n⚠️  No providers configured! Set environment variables to test.", "yellow");
    log("   Required:", "yellow");
    log("   - GOOGLE_CLOUD_PROJECT (for Gemini)", "yellow");
    log("   - DEEPSEEK_API_KEY (for DeepSeek R1)", "yellow");
    log("   - AZURE_OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT (for Copilot)", "yellow");
    process.exit(0);
  }

  log(`\n✅ ${configuredCount}/3 providers configured\n`, "green");

  try {
    await testSingleProviders();
    await testMultiModelRouter();
    await testComparison();
    await testTIGuyMultiModel();

    log("\n" + "=".repeat(60), "bright");
    log("✅ All Tests Completed!", "green");
    log("=".repeat(60) + "\n", "bright");
  } catch (error: any) {
    log(`\n❌ Test suite failed: ${error.message}`, "red");
    if (error.stack) {
      log(`\nStack:\n${error.stack}`, "yellow");
    }
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, "red");
  process.exit(1);
});
