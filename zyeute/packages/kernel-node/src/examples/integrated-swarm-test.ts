/**
 * Integrated Swarm Test - The "Content Podcast" Mission
 *
 * This demonstrates the Tactical Triple-Threat in action:
 * 1. Apify (Scout) - Harvests Quebec AI news
 * 2. Filesystem (Wax-Builder) - Writes content to file
 * 3. Desktop Commander (Siege Engine) - Git pushes to production
 *
 * The complete flow: Web Data → Local File → Production
 */

import { swarmOrchestrator } from "../lib/SwarmOrchestrator.js";
import path from "path";

/**
 * Mission: "Generate a podcast about the Quebec AI scene and deploy the site"
 */
async function contentPodcastMission() {
  console.log("\n🎙️ [MISSION] Content Podcast Generation");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const directive = `
Generate a podcast about the Quebec AI scene and deploy the site.

Steps:
1. Use Apify to scrape the latest 24 hours of Quebec AI news and LinkedIn posts
2. Use Llama 4 Maverick to synthesize that data into a high-reasoning podcast script
3. Write the script and metadata to content/podcasts/ directory
4. Run git commit and push to deploy
  `.trim();

  const result = await swarmOrchestrator.executeDirective(directive);

  console.log("\n📊 Mission Result:");
  console.log(`   Success: ${result.success}`);
  console.log(`   Iterations: ${result.iterations}`);
  console.log(`   Tool Calls: ${result.toolCalls}`);
  console.log(`   Response: ${result.finalResponse.substring(0, 300)}...`);

  return result;
}

/**
 * Simplified Test: Scout finds one Quebec AI news item, Infantry writes it, Commander pushes it
 */
async function integratedSwarmTest() {
  console.log("\n🪖 [TEST] Integrated Swarm Test");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const directive = `
Find one Quebec AI news item using web search, write it to a file called test-news.md, 
and then git add and commit it (but don't push yet).
  `.trim();

  const result = await swarmOrchestrator.executeDirective(directive);

  console.log("\n📊 Test Result:");
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
 * Main Test Function
 */
async function runIntegratedTest() {
  console.log("👑 INTEGRATED SWARM TEST");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Testing Tactical Triple-Threat Integration\n");

  try {
    // Initialize with restricted paths (Sovereign Shield)
    const projectRoot = process.cwd();
    await swarmOrchestrator.initialize({
      allowedPaths: [projectRoot], // Only allow access to project directory
    });

    console.log("🚀 Starting integrated swarm test...\n");

    // Run simplified test first
    await integratedSwarmTest();

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Full mission (commented out to avoid actual git push)
    // await contentPodcastMission();

    console.log("\n✅ Integrated test complete!");
  } catch (error: any) {
    console.error("\n❌ Test failed:", error);
  } finally {
    await swarmOrchestrator.shutdown();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegratedTest().catch(console.error);
}

export { contentPodcastMission, integratedSwarmTest, runIntegratedTest };
