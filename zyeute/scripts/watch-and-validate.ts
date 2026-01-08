#!/usr/bin/env tsx
/**
 * File Watcher for Automatic Validation
 * Runs validation when bridge files change
 * 
 * Run with: npx tsx scripts/watch-and-validate.ts
 * Press Ctrl+C to stop
 */

import { watch } from "fs";
import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../..");

const bridgeFiles = [
  join(projectRoot, "zyeute/backend/services/windows-automation-bridge.ts"),
  join(projectRoot, "zyeute/backend/services/automation-service.ts"),
  join(projectRoot, "Windows-Use/bridge_service.py"),
  join(projectRoot, "Windows-Use/config.py"),
];

let validationTimeout: NodeJS.Timeout | null = null;
let isRunning = false;

function runValidation() {
  if (isRunning) {
    console.log("⏳ Validation already running, queuing...");
    return;
  }

  // Debounce: Wait 2 seconds after last change
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }

  validationTimeout = setTimeout(() => {
    console.log("\n🔍 Bridge files changed, running validation...\n");
    isRunning = true;

    const child = spawn(
      "npx",
      ["tsx", "scripts/run-final-validation.ts"],
      {
        cwd: join(projectRoot, "zyeute"),
        stdio: "inherit",
        shell: true,
      },
    );

    child.on("exit", (code) => {
      isRunning = false;
      if (code === 0) {
        console.log("\n✅ Validation passed! Bridge is healthy.\n");
      } else {
        console.log(
          "\n❌ Validation failed. Review issues above and fix them.\n",
        );
      }
      console.log("👀 Watching for changes...\n");
    });

    child.on("error", (error) => {
      isRunning = false;
      console.error("❌ Error running validation:", error.message);
      console.log("👀 Watching for changes...\n");
    });
  }, 2000); // 2 second debounce
}

// Watch bridge files
console.log("👀 Starting file watcher for automatic validation...\n");
console.log("Watching files:");
bridgeFiles.forEach((file) => {
  console.log(`   - ${file}`);
});
console.log("\nPress Ctrl+C to stop\n");

bridgeFiles.forEach((file) => {
  try {
    watch(file, { persistent: true }, (eventType) => {
      if (eventType === "change") {
        console.log(`📝 File changed: ${file}`);
        runValidation();
      }
    });
  } catch (error: any) {
    console.warn(`⚠️  Could not watch ${file}: ${error.message}`);
  }
});

// Keep process alive
process.on("SIGINT", () => {
  console.log("\n\n🛑 Stopping file watcher...");
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }
  process.exit(0);
});

console.log("✅ File watcher active! Saving bridge files will trigger validation.\n");
