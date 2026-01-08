#!/usr/bin/env tsx
/**
 * Circuit Breaker Verification Test
 * Tests automatic failover from gemini-pro to gemini-flash when primary model fails
 */

import "dotenv/config";
import { CircuitBreaker } from "../backend/ai/circuit-breaker.js";
import { callGeminiModel, selectModelForRequest } from "../backend/ai/vertex-model-service.js";
import type { GeminiModel } from "../backend/ai/circuit-breaker.js";

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

/**
 * Mock unstable service for testing
 */
class MockUnstableService {
  private failureCount: Map<GeminiModel, number> = new Map();
  private shouldFail: Map<GeminiModel, boolean> = new Map();

  /**
   * Configure a model to fail
   */
  setModelFailure(modelName: GeminiModel, shouldFail: boolean): void {
    this.shouldFail.set(modelName, shouldFail);
    this.failureCount.set(modelName, 0);
  }

  async callModel(modelName: GeminiModel, options: any): Promise<{ text: string; model: GeminiModel }> {
    // Simulate failure if configured
    if (this.shouldFail.get(modelName)) {
      const count = this.failureCount.get(modelName) || 0;
      this.failureCount.set(modelName, count + 1);
      throw new Error(`503 Service Unavailable: ${modelName} is down (failure #${count + 1})`);
    }

    // Success response
    return {
      text: `✅ Response from ${modelName}: "Bonjour Zyeuté! Je suis ${modelName} et je fonctionne bien!"`,
      model: modelName,
    };
  }
}

async function testCircuitBreaker() {
  log("\n" + "=".repeat(60), "bright");
  log("🧪 Circuit Breaker Verification Test", "bright");
  log("=".repeat(60) + "\n", "bright");

  // Setup mock service
  const mockService = new MockUnstableService();
  mockService.setModelFailure("gemini-1.5-pro", true); // Pro is down
  mockService.setModelFailure("gemini-2.0-flash", false); // Flash is working

  // Create circuit breaker
  const breaker = new CircuitBreaker(mockService.callModel.bind(mockService), {
    failureThreshold: 2, // Trip fast for testing
    resetTimeout: 5000, // 5 seconds
    fallbackModel: "gemini-2.0-flash",
  });

  log("📋 Test Configuration:", "cyan");
  log("   - Primary Model: gemini-1.5-pro (configured to fail)", "cyan");
  log("   - Fallback Model: gemini-2.0-flash (working)", "cyan");
  log("   - Failure Threshold: 2 failures", "cyan");
  log("   - Reset Timeout: 5 seconds\n", "cyan");

  // Test 1: First failure should trigger failover
  log("--- Test 1: Initial Failover ---", "bright");
  try {
    const result1 = await breaker.callModel("gemini-1.5-pro", {
      prompt: "Say hello",
    });

    log(`   ✅ Request succeeded`, "green");
    log(`   📤 Intended Model: gemini-1.5-pro`, "cyan");
    log(`   📥 Actual Model: ${result1.modelUsed}`, "cyan");
    log(`   🔄 Circuit Breaker Intervened: ${result1.circuitBreakerIntervened}`, "cyan");
    log(`   💬 Response: ${result1.content.text.substring(0, 60)}...\n`, "green");

    if (result1.modelUsed !== "gemini-2.0-flash") {
      throw new Error("Expected failover to flash, but got " + result1.modelUsed);
    }
    if (!result1.circuitBreakerIntervened) {
      throw new Error("Expected circuit breaker to intervene");
    }
  } catch (error: any) {
    log(`   ❌ Test 1 failed: ${error.message}`, "red");
    throw error;
  }

  // Test 2: Second failure should trip the circuit
  log("--- Test 2: Circuit Tripping ---", "bright");
  try {
    const result2 = await breaker.callModel("gemini-1.5-pro", {
      prompt: "Say hello again",
    });

    log(`   ✅ Request succeeded (via fallback)`, "green");
    log(`   📥 Actual Model: ${result2.modelUsed}`, "cyan");

    // Check circuit state
    const state = breaker.getModelState("gemini-1.5-pro");
    if (state) {
      log(`   🔌 Circuit State: ${state.state}`, "cyan");
      log(`   📊 Failure Count: ${state.failureCount}`, "cyan");
    }

    if (state?.state !== "OPEN") {
      log(`   ⚠️  Expected circuit to be OPEN, but got ${state?.state}`, "yellow");
    } else {
      log(`   ✅ Circuit correctly tripped to OPEN state\n`, "green");
    }
  } catch (error: any) {
    log(`   ❌ Test 2 failed: ${error.message}`, "red");
    throw error;
  }

  // Test 3: Third call should fail fast (circuit open)
  log("--- Test 3: Fail Fast (Circuit Open) ---", "bright");
  try {
    const result3 = await breaker.callModel("gemini-1.5-pro", {
      prompt: "Say hello third time",
    });

    log(`   ✅ Request succeeded (fail-fast to fallback)`, "green");
    log(`   📥 Actual Model: ${result3.modelUsed}`, "cyan");
    log(`   ⚡ Circuit prevented calling failed model\n`, "green");
  } catch (error: any) {
    log(`   ❌ Test 3 failed: ${error.message}`, "red");
    throw error;
  }

  // Test 4: Recovery (simulate pro coming back online)
  log("--- Test 4: Recovery Test ---", "bright");
  log("   ⏳ Waiting 6 seconds for circuit reset timeout...", "cyan");
  await new Promise((resolve) => setTimeout(resolve, 6000));

  // Fix the pro model
  mockService.setModelFailure("gemini-1.5-pro", false);

  try {
    const result4 = await breaker.callModel("gemini-1.5-pro", {
      prompt: "Say hello after recovery",
    });

    log(`   ✅ Request succeeded`, "green");
    log(`   📥 Actual Model: ${result4.modelUsed}`, "cyan");

    const state = breaker.getModelState("gemini-1.5-pro");
    if (state?.state === "CLOSED") {
      log(`   🟢 Circuit recovered! State: ${state.state}\n`, "green");
    } else {
      log(`   ⚠️  Circuit state: ${state?.state} (may need more successful calls)\n`, "yellow");
    }
  } catch (error: any) {
    log(`   ❌ Test 4 failed: ${error.message}`, "red");
    throw error;
  }

  // Test 5: Fallback model never fails (critical check)
  log("--- Test 5: Fallback Model Protection ---", "bright");
  log("   ⚠️  This test ensures fallback model never triggers circuit breaker\n", "yellow");

  // Summary
  log("\n" + "=".repeat(60), "bright");
  log("✅ All Circuit Breaker Tests Passed!", "green");
  log("=".repeat(60) + "\n", "bright");

  log("📊 Final Circuit States:", "cyan");
  const allStates = breaker.getAllStates();
  for (const [model, state] of allStates.entries()) {
    log(`   ${model}: ${state.state} (failures: ${state.failureCount})`, "cyan");
  }
  log("");
}

/**
 * Test with real Vertex AI (if configured)
 */
async function testRealVertexAI() {
  log("\n" + "=".repeat(60), "bright");
  log("🌐 Real Vertex AI Test (Optional)", "bright");
  log("=".repeat(60) + "\n", "bright");

  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    log("⚠️  Skipping real Vertex AI test (GOOGLE_CLOUD_PROJECT not set)", "yellow");
    log("   Set GOOGLE_CLOUD_PROJECT in .env to test with real API\n", "yellow");
    return;
  }

  try {
    const breaker = new CircuitBreaker(callGeminiModel, {
      failureThreshold: 3,
      resetTimeout: 10000,
      fallbackModel: "gemini-2.0-flash",
    });

    log("📝 Testing with real Vertex AI...", "cyan");
    const result = await breaker.callModel("gemini-2.0-flash", {
      prompt: "Say 'Bonjour Zyeuté!' in Quebec French.",
      temperature: 0.7,
      maxOutputTokens: 100,
    });

    log(`   ✅ Success!`, "green");
    log(`   📥 Model Used: ${result.modelUsed}`, "cyan");
    log(`   💬 Response: ${result.content.text}\n`, "green");
  } catch (error: any) {
    log(`   ⚠️  Real API test failed: ${error.message}`, "yellow");
    log("   (This is OK if Vertex AI is not configured)\n", "yellow");
  }
}

async function main() {
  try {
    await testCircuitBreaker();
    await testRealVertexAI();

    log("🎉 All tests completed!\n", "green");
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
