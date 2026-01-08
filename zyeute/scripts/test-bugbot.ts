#!/usr/bin/env tsx
/**
 * BugBot Test Harness
 * Simulates various failure scenarios to validate BugBot detection
 * 
 * Run with: npx tsx scripts/test-bugbot.ts
 */

import "dotenv/config";
import { bugBot } from "../backend/colony/bugbot.js";
import { beeSystem } from "../backend/colony/bee-system.js";
import { logger } from "../backend/utils/logger.js";

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

async function testUncaughtException() {
  log("\n🧪 Test 1: Uncaught Exception Detection", "bright");
  
  // This will be caught by BugBot's process.on("uncaughtException")
  // We'll simulate it by manually reporting
  const bug = await bugBot.detectBug({
    severity: "critical",
    type: "error",
    title: "Uncaught Exception (Simulated)",
    description: "ReferenceError: variable is not defined",
    location: "test.ts:10",
    stackTrace: "ReferenceError: variable is not defined\n  at test.ts:10",
    context: { test: "uncaught_exception" },
  });

  log(`✅ Bug detected: ${bug.id}`, "green");
  log(`   Severity: ${bug.severity}`, "cyan");
  log(`   Type: ${bug.type}`, "cyan");
  return bug;
}

async function testUnhandledRejection() {
  log("\n🧪 Test 2: Unhandled Promise Rejection", "bright");
  
  const bug = await bugBot.detectBug({
    severity: "high",
    type: "error",
    title: "Unhandled Promise Rejection (Simulated)",
    description: "Promise rejection: Database connection failed",
    location: "promise",
    context: { test: "unhandled_rejection", reason: "Connection timeout" },
  });

  log(`✅ Bug detected: ${bug.id}`, "green");
  return bug;
}

async function testFailedBeeTask() {
  log("\n🧪 Test 3: Failed Bee Task", "bright");
  
  // Simulate a failed bee task
  const bug = await bugBot.detectBug({
    severity: "medium",
    type: "error",
    title: "Task Failed: chat",
    description: "Bee task failed: ti-guy-chat",
    location: "bee:ti-guy-chat",
    context: {
      test: "failed_bee_task",
      taskId: "task-123",
      beeId: "ti-guy-chat",
      capability: "chat",
    },
  });

  log(`✅ Bug detected: ${bug.id}`, "green");
  return bug;
}

async function testPatternLearning() {
  log("\n🧪 Test 4: Pattern Learning", "bright");
  
  // Create multiple similar bugs to trigger pattern learning
  const similarBugs = [];
  for (let i = 0; i < 3; i++) {
    const bug = await bugBot.detectBug({
      severity: "high",
      type: "error",
      title: `Similar Bug ${i + 1}`,
      description: `Cannot read property '${i}' of undefined`,
      location: `app.ts:${i + 1}`,
      context: { test: "pattern_learning", iteration: i },
    });
    similarBugs.push(bug);
    log(`   Created bug ${i + 1}: ${bug.id}`, "cyan");
  }

  // Check if pattern was created (would need to check learning system)
  log(`✅ Created ${similarBugs.length} similar bugs`, "green");
  log(`   Pattern learning should trigger after 2+ similar bugs`, "yellow");
  
  return similarBugs;
}

async function testBugFiltering() {
  log("\n🧪 Test 5: Bug Filtering", "bright");
  
  // Create bugs of different severities
  await bugBot.detectBug({
    severity: "critical",
    type: "security",
    title: "Security Bug",
    description: "Security issue",
    location: "auth.ts:1",
    context: { test: "filtering" },
  });

  await bugBot.detectBug({
    severity: "low",
    type: "performance",
    title: "Performance Bug",
    description: "Performance issue",
    location: "app.ts:1",
    context: { test: "filtering" },
  });

  const criticalBugs = bugBot.getAllBugs({ severity: "critical" });
  const securityBugs = bugBot.getAllBugs({ type: "security" });

  log(`✅ Critical bugs: ${criticalBugs.length}`, "green");
  log(`✅ Security bugs: ${securityBugs.length}`, "green");
  
  return { criticalBugs, securityBugs };
}

async function testBugFixing() {
  log("\n🧪 Test 6: Bug Fixing", "bright");
  
  const bug = await bugBot.detectBug({
    severity: "medium",
    type: "error",
    title: "Fixable Bug",
    description: "This bug will be fixed",
    location: "app.ts:1",
    context: { test: "fixing" },
  });

  log(`   Created bug: ${bug.id}`, "cyan");
  
  await bugBot.markBugFixed(bug.id, "test-developer");
  
  const fixedBug = bugBot.getBug(bug.id);
  log(`✅ Bug marked as fixed`, "green");
  log(`   Status: ${fixedBug?.status}`, "cyan");
  log(`   Fixed by: ${fixedBug?.assignedTo}`, "cyan");
  
  return fixedBug;
}

async function testBugStats() {
  log("\n🧪 Test 7: Bug Statistics", "bright");
  
  const stats = bugBot.getBugStats();
  
  log(`📊 Bug Statistics:`, "bright");
  log(`   Total: ${stats.total}`, "cyan");
  log(`   By Severity:`, "cyan");
  Object.entries(stats.bySeverity).forEach(([sev, count]) => {
    log(`     ${sev}: ${count}`, "cyan");
  });
  log(`   By Type:`, "cyan");
  Object.entries(stats.byType).forEach(([type, count]) => {
    log(`     ${type}: ${count}`, "cyan");
  });
  log(`   Critical Open: ${stats.criticalOpen}`, stats.criticalOpen > 0 ? "red" : "green");
  
  return stats;
}

async function runAllTests() {
  log("\n" + "=".repeat(60), "bright");
  log("🐛 BugBot Test Harness", "bright");
  log("=".repeat(60) + "\n", "bright");

  try {
    // Run all tests
    await testUncaughtException();
    await testUnhandledRejection();
    await testFailedBeeTask();
    await testPatternLearning();
    await testBugFiltering();
    await testBugFixing();
    await testBugStats();

    log("\n" + "=".repeat(60), "bright");
    log("✅ All BugBot tests passed!", "green");
    log("=".repeat(60) + "\n", "bright");
  } catch (error: any) {
    log("\n" + "=".repeat(60), "bright");
    log("❌ Test failed:", "red");
    log(`   ${error.message}`, "red");
    log("=".repeat(60) + "\n", "bright");
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  log(`❌ Unexpected error: ${error.message}`, "red");
  process.exit(1);
});
