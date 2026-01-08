/**
 * End-to-end integration test for Windows-Use automation via Colony OS
 * Tests: Synapse Bridge -> Automation Service -> Python Bridge -> Task Execution -> Metrics
 */

import "dotenv/config";
import { automationService } from "../backend/services/automation-service.js";
import { windowsAutomationBridge } from "../backend/services/windows-automation-bridge.js";
import { synapseBridge } from "../backend/colony/synapse-bridge.js";
import { storage } from "../backend/storage.js";

async function testAutomationIntegration() {
  console.log("🧪 Testing Windows-Use Automation Integration\n");

  try {
    // Step 1: Initialize Services
    console.log("Step 1: Initializing Services");
    await automationService.initialize();
    console.log("   ✅ Automation service initialized\n");

    // Step 2: Check Bridge Status
    console.log("Step 2: Checking Bridge Status");
    const bridgeStatus = windowsAutomationBridge.getStatus();
    if (!bridgeStatus.isReady) {
      console.log("   ❌ Bridge service is not ready");
      console.log("   → Start the Python bridge service:");
      console.log("     cd Windows-Use && python bridge_service.py --port 8001\n");
      return;
    }
    console.log(`   ✅ Bridge is ready at ${bridgeStatus.serviceUrl}\n`);

    // Step 3: Test Direct Task Execution (Bypass Synapse)
    console.log("Step 3: Testing Direct Task Execution");
    const testTask = {
      id: `integration-test-${Date.now()}`,
      beeId: "windows-automation",
      taskType: "test" as const,
      description: "Integration test task",
      action: "Open Edge browser and navigate to example.com",
      parameters: {},
      timeout: 30,
      llm_provider: "gemini",
      browser: "edge",
    };

    try {
      const result = await automationService.executeTask(testTask);
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
    }

    // Step 4: Check Database Entry
    console.log("Step 4: Checking Database Entry");
    try {
      const task = await storage.getAutomationTask(testTask.id);
      if (task) {
        console.log("   ✅ Task stored in database:");
        console.log(`      - ID: ${task.id}`);
        console.log(`      - Status: ${task.status}`);
        console.log(`      - Type: ${task.taskType}`);
        console.log(`      - Created: ${task.createdAt}\n`);
      } else {
        console.log("   ⚠️ Task not found in database\n");
      }
    } catch (error: any) {
      console.log(`   ❌ Database query error: ${error.message}\n`);
    }

    // Step 5: Test Synapse Bridge Integration (if connected)
    console.log("Step 5: Testing Synapse Bridge Integration");
    if (synapseBridge.isConnected()) {
      console.log("   ✅ Synapse Bridge is connected");
      console.log("   → Automation tasks can be received via Socket.io events\n");
    } else {
      console.log("   ⚠️ Synapse Bridge is not connected");
      console.log("   → Set COLONY_OS_URL to enable Colony OS integration\n");
    }

    // Step 6: Service Status Summary
    console.log("Step 6: Service Status Summary");
    const serviceStatus = automationService.getStatus();
    console.log(`   - Initialized: ${serviceStatus.initialized}`);
    console.log(`   - Bridge Ready: ${serviceStatus.bridgeStatus.isReady}`);
    console.log(`   - Bridge URL: ${serviceStatus.bridgeStatus.serviceUrl}`);
    console.log(`   - Queued Tasks: ${serviceStatus.bridgeStatus.queuedTasks}`);
    console.log(`   - DevTools Enabled: ${serviceStatus.devToolsEnabled}\n`);

    console.log("🎉 Integration test completed!\n");
    console.log("Next Steps:");
    console.log("1. Run migrations to create automation tables:");
    console.log("   npm run migrate");
    console.log("2. Start Python bridge service:");
    console.log("   cd Windows-Use && python bridge_service.py --port 8001");
    console.log("3. Start backend server:");
    console.log("   npm run dev");
    console.log("4. Execute automation tasks via Synapse Bridge or direct API\n");
  } catch (error: any) {
    console.error(`❌ Integration test failed: ${error.message}\n`);
    process.exit(1);
  }
}

// Run integration test
testAutomationIntegration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
