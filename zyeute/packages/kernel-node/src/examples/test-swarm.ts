/**
 * Test SwarmOrchestrator - Simple Test
 * Verifies the Queen Bee is working
 */

import { swarmOrchestrator } from "../lib/SwarmOrchestrator.js";

async function testSwarm() {
  console.log("🧪 [TEST] Testing SwarmOrchestrator...\n");

  try {
    // Initialize
    console.log("1️⃣ Initializing SwarmOrchestrator...");
    await swarmOrchestrator.initialize({
      allowedPaths: [process.cwd()],
    });
    console.log("✅ Initialized\n");

    // Test simple directive
    console.log("2️⃣ Testing simple directive...");
    const result = await swarmOrchestrator.executeDirective(
      "List the files in the current directory using the filesystem tool.",
    );

    console.log("\n📊 Result:");
    console.log(`   Success: ${result.success}`);
    console.log(`   Iterations: ${result.iterations}`);
    console.log(`   Tool Calls: ${result.toolCalls}`);
    console.log(`   Response: ${result.finalResponse.substring(0, 200)}...`);

    if (result.success) {
      console.log("\n✅ Test passed!");
    } else {
      console.log("\n⚠️ Test completed with warnings");
    }

    // Shutdown
    await swarmOrchestrator.shutdown();
  } catch (error: any) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run test
testSwarm().catch(console.error);
