/**
 * Test script to validate Python bridge service communication
 * Tests: Health check, metrics endpoint, and simple task execution
 */

import "dotenv/config";
import { windowsAutomationBridge } from "../backend/services/windows-automation-bridge.js";

const BRIDGE_PORT = parseInt(process.env.WINDOWS_USE_BRIDGE_PORT || "8001", 10);
const BRIDGE_HOST = process.env.WINDOWS_USE_BRIDGE_HOST || "127.0.0.1";

async function testBridgeCommunication() {
  console.log("🧪 Testing Windows Automation Bridge Communication\n");

  try {
    // Test 0: Initialize bridge status (check health to set ready state)
    console.log("Test 0: Bridge Initialization");
    console.log(`   Checking ${BRIDGE_HOST}:${BRIDGE_PORT}/health...`);
    const healthCheck = await windowsAutomationBridge.checkHealth();
    if (healthCheck) {
      // Mark bridge as ready if health check passes
      (windowsAutomationBridge as any).isReady = true;
      console.log("   ✅ Bridge service is healthy and ready\n");
    } else {
      console.log("   ❌ Bridge service is not responding\n");
      console.log("   → Make sure the Python bridge service is running:");
      console.log("     cd Windows-Use && python bridge_service.py --port 8001\n");
      return;
    }

    // Test 1: Health Check (duplicate but for clarity)
    console.log("Test 1: Health Check");
    console.log(`   Verifying ${BRIDGE_HOST}:${BRIDGE_PORT}/health...`);
    const healthCheck2 = await windowsAutomationBridge.checkHealth();
    if (healthCheck2) {
      console.log("   ✅ Bridge service is healthy\n");
    } else {
      console.log("   ❌ Bridge service is not responding\n");
      return;
    }

    // Test 2: Metrics
    console.log("Test 2: Metrics Endpoint");
    console.log(`   Fetching ${BRIDGE_HOST}:${BRIDGE_PORT}/metrics...`);
    try {
      const metrics = await windowsAutomationBridge.getMetrics();
      console.log("   ✅ Metrics retrieved successfully:");
      console.log(`      - Uptime: ${metrics.uptime_seconds?.toFixed(2)}s`);
      console.log(`      - Memory: ${metrics.memory_mb?.toFixed(2)}MB`);
      console.log(`      - CPU: ${metrics.cpu_percent?.toFixed(2)}%`);
      console.log(`      - Status: ${metrics.status}\n`);
    } catch (error: any) {
      console.log(`   ❌ Failed to get metrics: ${error.message}\n`);
    }

    // Test 3: Simple Task Execution
    console.log("Test 3: Simple Task Execution");
    console.log("   Executing test task...");
    try {
      const result = await windowsAutomationBridge.executeTask({
        id: `test-${Date.now()}`,
        action: "Open Edge browser",
        parameters: {},
        timeout: 30,
        llm_provider: "gemini",
        browser: "edge",
      });

      if (result.success) {
        console.log("   ✅ Task executed successfully:");
        console.log(`      - Task ID: ${result.task_id}`);
        console.log(`      - Execution Time: ${result.performance_metrics?.execution_time?.toFixed(2)}s`);
        console.log(`      - Memory Usage: ${result.performance_metrics?.memory_usage_mb?.toFixed(2)}MB\n`);
      } else {
        console.log("   ⚠️ Task execution failed:");
        console.log(`      - Task ID: ${result.task_id}`);
        console.log(`      - Error: ${result.error}\n`);
      }
    } catch (error: any) {
      console.log(`   ❌ Task execution error: ${error.message}\n`);
      console.log("   → This is expected if Windows-Use Agent is not properly configured");
      console.log("   → Check that GOOGLE_API_KEY is set in your environment\n");
    }

    // Test 4: Bridge Status
    console.log("Test 4: Bridge Status");
    const status = windowsAutomationBridge.getStatus();
    console.log(`   ✅ Bridge Status:`);
    console.log(`      - Ready: ${status.isReady}`);
    console.log(`      - Service URL: ${status.serviceUrl}`);
    console.log(`      - Queued Tasks: ${status.queuedTasks}\n`);

    console.log("🎉 All tests completed!\n");
  } catch (error: any) {
    console.error(`❌ Test failed: ${error.message}\n`);
    process.exit(1);
  }
}

// Run tests
testBridgeCommunication()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
