/**
 * Sovereign Colony Demo
 * Example usage of the SwarmOrchestrator for autonomous mission execution
 */

import { swarmOrchestrator } from "../lib/SwarmOrchestrator.js";

/**
 * Example 1: Health Check Mission
 * "Check if the Zyeuté dev server is running on localhost:3000"
 */
async function healthCheckMission() {
  console.log("\n🏥 [MISSION] Health Check");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const result = await swarmOrchestrator.executeDirective(
    "Check if the Zyeuté dev server is running on localhost:3000. Open Chrome, navigate to the URL, and report the page status.",
  );

  console.log("\n📊 Mission Result:");
  console.log(`   Success: ${result.success}`);
  console.log(`   Iterations: ${result.iterations}`);
  console.log(`   Tool Calls: ${result.toolCalls}`);
  console.log(`   Response: ${result.finalResponse.substring(0, 200)}...`);

  return result;
}

/**
 * Example 2: Auto-Heal Mission
 * "The Zyeuté V5 preview is showing a 404. Open Chrome, check localhost:3000, and if the page is down, restart the dev server via PowerShell."
 */
async function autoHealMission() {
  console.log("\n🔧 [MISSION] Auto-Heal");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const directive = `
The Zyeuté V5 preview is showing a 404. 
Open Chrome, check localhost:3000, and if the page is down, 
restart the dev server via PowerShell.
  `.trim();

  const result = await swarmOrchestrator.executeDirective(directive);

  console.log("\n📊 Mission Result:");
  console.log(`   Success: ${result.success}`);
  console.log(`   Iterations: ${result.iterations}`);
  console.log(`   Tool Calls: ${result.toolCalls}`);

  // Show telemetry
  console.log("\n📡 Telemetry:");
  result.telemetry.forEach((entry, index) => {
    const emoji =
      entry.unit === "SWAT-ELITE" ? "🔧" : entry.unit === "QUEEN" ? "👑" : "🪖";
    console.log(`   ${index + 1}. ${emoji} [${entry.unit}] ${entry.message}`);
    if (entry.action) {
      console.log(`      Action: ${entry.action}`);
    }
  });

  return result;
}

/**
 * Example 3: Content Analysis Mission
 * "Open Chrome, navigate to localhost:3000, and analyze the page content for any errors."
 */
async function contentAnalysisMission() {
  console.log("\n🔍 [MISSION] Content Analysis");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const result = await swarmOrchestrator.executeDirective(
    "Open Chrome, navigate to localhost:3000, and analyze the page content for any errors or issues.",
  );

  return result;
}

/**
 * Main Demo Function
 */
async function runDemo() {
  console.log("👑 SOVEREIGN COLONY DEMO");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Initializing Swarm Orchestrator...\n");

  try {
    // Initialize
    await swarmOrchestrator.initialize();

    // Run missions
    console.log("🚀 Starting missions...\n");

    // Mission 1: Health Check
    await healthCheckMission();

    // Wait a bit between missions
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mission 2: Auto-Heal (commented out to avoid actually restarting server)
    // await autoHealMission();

    // Mission 3: Content Analysis
    // await contentAnalysisMission();

    console.log("\n✅ Demo complete!");
  } catch (error: any) {
    console.error("\n❌ Demo failed:", error);
  } finally {
    // Shutdown
    await swarmOrchestrator.shutdown();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { healthCheckMission, autoHealMission, contentAnalysisMission, runDemo };
