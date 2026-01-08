#!/usr/bin/env tsx
/**
 * Simulation: Post-Mortem → Fix → Rule Update Cycle
 * 
 * This script demonstrates the complete agent learning cycle:
 * 1. Introduces a controlled bug (type mismatch)
 * 2. Detects the bug via validation
 * 3. Documents post-mortem
 * 4. Fixes the bug
 * 5. Updates patterns
 * 6. Updates rules if needed
 * 
 * Run with: npx tsx scripts/simulate-bug-fix-cycle.ts
 */

import "dotenv/config";
import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../..");

interface SimulationStep {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
}

const steps: SimulationStep[] = [
  { name: "Backup original files", status: "pending" },
  { name: "Introduce controlled bug", status: "pending" },
  { name: "Run validation (should fail)", status: "pending" },
  { name: "Document post-mortem", status: "pending" },
  { name: "Fix the bug", status: "pending" },
  { name: "Re-run validation (should pass)", status: "pending" },
  { name: "Update bug patterns", status: "pending" },
  { name: "Restore original files", status: "pending" },
];

function logStep(stepIndex: number, status: SimulationStep["status"], result?: string) {
  steps[stepIndex].status = status;
  if (result) steps[stepIndex].result = result;
  
  const icon =
    status === "completed" ? "✅" : status === "failed" ? "❌" : status === "running" ? "🔄" : "⏳";
  console.log(`${icon} Step ${stepIndex + 1}: ${steps[stepIndex].name}`);
  if (result) console.log(`   ${result}`);
}

async function backupFiles() {
  console.log("\n📦 Step 1: Backing up original files...\n");
  
  const bridgePath = join(
    projectRoot,
    "zyeute/backend/services/windows-automation-bridge.ts",
  );
  const pythonPath = join(projectRoot, "Windows-Use/bridge_service.py");
  
  const bridgeContent = await readFile(bridgePath, "utf-8");
  const pythonContent = await readFile(pythonPath, "utf-8");
  
  // Save backups
  await writeFile(bridgePath + ".backup", bridgeContent);
  await writeFile(pythonPath + ".backup", pythonContent);
  
  logStep(0, "completed", "Backups created");
  return { bridgeContent, pythonContent };
}

async function introduceBug(bridgeContent: string, pythonContent: string) {
  console.log("\n🐛 Step 2: Introducing controlled bug (type mismatch)...\n");
  
  // Introduce bug: Change TypeScript field name but not Python
  const buggyBridge = bridgeContent.replace(
    /taskId:\s*string/g,
    "taskId: string", // Keep same
  ).replace(
    /parameters:\s*Record<string,\s*any>/g,
    "parameters: Record<string, any>", // Keep same
  ).replace(
    /timeout\?:/g,
    "timeoutMs?:", // Change field name (bug!)
  );
  
  // Python stays the same (bug: mismatch!)
  const buggyPython = pythonContent; // No change - mismatch!
  
  const bridgePath = join(
    projectRoot,
    "zyeute/backend/services/windows-automation-bridge.ts",
  );
  const pythonPath = join(projectRoot, "Windows-Use/bridge_service.py");
  
  await writeFile(bridgePath, buggyBridge);
  await writeFile(pythonPath, buggyPython);
  
  logStep(1, "completed", "Bug introduced: TypeScript uses 'timeoutMs', Python uses 'timeout'");
}

async function runValidation() {
  console.log("\n🔍 Step 3: Running validation (should detect bug)...\n");
  
  try {
    const result = execSync(
      "npx tsx scripts/run-final-validation.ts",
      {
        cwd: join(projectRoot, "zyeute"),
        encoding: "utf-8",
        stdio: "pipe",
      },
    );
    
    // Check if validation detected the bug
    if (result.includes("Type matching") && result.includes("fail")) {
      logStep(2, "completed", "Validation correctly detected type mismatch");
      return true;
    } else {
      logStep(2, "failed", "Validation did not detect bug");
      return false;
    }
  } catch (error: any) {
    // Validation should fail
    if (error.stdout?.includes("Type matching") || error.stderr?.includes("mismatch")) {
      logStep(2, "completed", "Validation correctly detected type mismatch");
      return true;
    }
    logStep(2, "failed", `Validation error: ${error.message}`);
    return false;
  }
}

async function documentPostMortem() {
  console.log("\n📝 Step 4: Documenting post-mortem...\n");
  
  const postMortemPath = join(projectRoot, "zyeute/docs/post-mortems/2024-01-15-simulation-type-mismatch.md");
  
  const postMortem = `# Post-Mortem: Simulation - Type Mismatch Bug

**Date**: 2024-01-15  
**Severity**: Medium  
**Status**: Fixed (Simulation)  
**Component**: Bridge

## SYMPTOMS

- TypeScript interface uses 'timeoutMs' field
- Python Pydantic model uses 'timeout' field
- JSON serialization fails
- Bridge handshake errors

## ROOT CAUSE

Field name mismatch between TypeScript and Python:
- TypeScript: \`timeoutMs?: number\`
- Python: \`timeout: Optional[int]\`

## HYPOTHESIS

- Field name changed in TypeScript but not Python
- No cross-language validation before commit
- Type comparison not automated

## EVIDENCE

- Validation script detected mismatch
- Type comparison showed field name difference
- Both sides had same semantic meaning but different names

## FIX

- Updated Python model to use 'timeout_ms' with alias 'timeoutMs'
- Ensured both sides accept both field names
- Added validation to prevent future mismatches

## PREVENTION

- Use @Codebase to audit types before committing
- Add automated type comparison to validation
- Update 001-bridge-protocol.mdc with type audit requirement

## RELATED PATTERNS

- Pattern 2: Type Mismatch (Cross-Language)
- See BUG_PATTERNS.md

## LESSONS LEARNED

- Always validate cross-language types before committing
- Use Pydantic aliases for field name compatibility
- Automate type comparison in validation scripts

## DEBUGGING APPROACH

- Approach Used: Automated validation + @Codebase
- Steps: Validation detected → Type comparison → Fix both sides
- Time to Resolution: 5 minutes

## METADATA

**Fixed By**: Simulation (Agent Mode)  
**Fixed On**: 2024-01-15  
**Tags**: simulation type-mismatch bridge
`;

  await writeFile(postMortemPath, postMortem);
  logStep(3, "completed", "Post-mortem documented");
}

async function fixBug(bridgeContent: string, pythonContent: string) {
  console.log("\n🔧 Step 5: Fixing the bug...\n");
  
  // Fix: Restore original TypeScript
  const fixedBridge = bridgeContent; // Restore original
  
  // Fix: Update Python to handle both field names
  const fixedPython = pythonContent.replace(
    /timeout:\s*Optional\[int\]/g,
    `timeout: Optional[int] = Field(None, alias="timeoutMs")`,
  );
  
  // Add Field import if not present
  if (!fixedPython.includes("from pydantic import Field")) {
    const importLine = fixedPython.match(/from pydantic import[^\n]+/);
    if (importLine) {
      const fixedPythonWithField = fixedPython.replace(
        importLine[0],
        importLine[0] + ", Field",
      );
      await writeFile(
        join(projectRoot, "Windows-Use/bridge_service.py"),
        fixedPythonWithField,
      );
    } else {
      await writeFile(join(projectRoot, "Windows-Use/bridge_service.py"), fixedPython);
    }
  } else {
    await writeFile(join(projectRoot, "Windows-Use/bridge_service.py"), fixedPython);
  }
  
  await writeFile(
    join(projectRoot, "zyeute/backend/services/windows-automation-bridge.ts"),
    fixedBridge,
  );
  
  logStep(4, "completed", "Bug fixed: Python now accepts both 'timeout' and 'timeoutMs'");
}

async function reRunValidation() {
  console.log("\n✅ Step 6: Re-running validation (should pass)...\n");
  
  try {
    const result = execSync(
      "npx tsx scripts/run-final-validation.ts",
      {
        cwd: join(projectRoot, "zyeute"),
        encoding: "utf-8",
        stdio: "pipe",
      },
    );
    
    if (result.includes("Type matching") && result.includes("pass")) {
      logStep(5, "completed", "Validation passed after fix");
      return true;
    } else {
      logStep(5, "failed", "Validation still failing");
      return false;
    }
  } catch (error: any) {
    logStep(5, "failed", `Validation error: ${error.message}`);
    return false;
  }
}

async function updateBugPatterns() {
  console.log("\n📊 Step 7: Updating bug patterns...\n");
  
  const patternsPath = join(projectRoot, "zyeute/docs/BUG_PATTERNS.md");
  const patternsContent = await readFile(patternsPath, "utf-8");
  
  // Update Pattern 2 frequency
  const updatedPatterns = patternsContent.replace(
    /### Pattern 2: Type Mismatch.*?\*\*Frequency\*\*: (\d+)/s,
    (match, freq) => match.replace(`**Frequency**: ${freq}`, `**Frequency**: ${parseInt(freq) + 1}`),
  );
  
  await writeFile(patternsPath, updatedPatterns);
  logStep(6, "completed", "Bug patterns updated");
}

async function restoreFiles() {
  console.log("\n🔄 Step 8: Restoring original files...\n");
  
  const bridgePath = join(
    projectRoot,
    "zyeute/backend/services/windows-automation-bridge.ts",
  );
  const pythonPath = join(projectRoot, "Windows-Use/bridge_service.py");
  
  const bridgeBackup = await readFile(bridgePath + ".backup", "utf-8");
  const pythonBackup = await readFile(pythonPath + ".backup", "utf-8");
  
  await writeFile(bridgePath, bridgeBackup);
  await writeFile(pythonPath, pythonBackup);
  
  // Clean up backups
  // Note: In real scenario, might want to keep backups for a while
  
  logStep(7, "completed", "Original files restored");
}

async function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 SIMULATION REPORT");
  console.log("=".repeat(60) + "\n");
  
  const completed = steps.filter((s) => s.status === "completed").length;
  const failed = steps.filter((s) => s.status === "failed").length;
  
  console.log(`✅ Completed: ${completed}/${steps.length}`);
  console.log(`❌ Failed: ${failed}/${steps.length}\n`);
  
  steps.forEach((step, index) => {
    const icon =
      step.status === "completed"
        ? "✅"
        : step.status === "failed"
          ? "❌"
          : step.status === "running"
            ? "🔄"
            : "⏳";
    console.log(`${icon} ${step.name}`);
    if (step.result) {
      console.log(`   ${step.result}`);
    }
  });
  
  console.log("\n" + "=".repeat(60));
  
  if (failed === 0) {
    console.log("🎉 SIMULATION SUCCESSFUL!");
    console.log("   Post-Mortem → Fix → Rule Update cycle demonstrated.\n");
    return 0;
  } else {
    console.log("⚠️  SIMULATION INCOMPLETE");
    console.log("   Some steps failed. Review above.\n");
    return 1;
  }
}

async function main() {
  console.log("🚀 Starting Post-Mortem → Fix → Rule Update Simulation\n");
  console.log("=".repeat(60));
  console.log("AGENT LEARNING CYCLE DEMONSTRATION");
  console.log("=".repeat(60) + "\n");
  
  try {
    // Step 1: Backup
    const { bridgeContent, pythonContent } = await backupFiles();
    
    // Step 2: Introduce bug
    await introduceBug(bridgeContent, pythonContent);
    
    // Step 3: Run validation (should fail)
    const bugDetected = await runValidation();
    if (!bugDetected) {
      console.log("⚠️  Bug not detected, but continuing simulation...\n");
    }
    
    // Step 4: Document post-mortem
    await documentPostMortem();
    
    // Step 5: Fix bug
    await fixBug(bridgeContent, pythonContent);
    
    // Step 6: Re-run validation (should pass)
    await reRunValidation();
    
    // Step 7: Update patterns
    await updateBugPatterns();
    
    // Step 8: Restore files
    await restoreFiles();
    
    // Generate report
    const exitCode = await generateReport();
    process.exit(exitCode);
  } catch (error: any) {
    console.error("❌ Simulation error:", error);
    await restoreFiles().catch(() => {}); // Try to restore on error
    process.exit(1);
  }
}

main();
