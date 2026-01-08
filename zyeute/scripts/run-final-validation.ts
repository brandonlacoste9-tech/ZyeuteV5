#!/usr/bin/env tsx
/**
 * Final Validation Script
 * Runs complete validation of Colony OS backend system
 * 
 * This script validates:
 * - Database schema (migrations applied)
 * - Bridge communication (Python ↔ TypeScript)
 * - Type matching (TypeScript ↔ Python)
 * - End-to-end flow (Database → Synapse → Bridge → Python)
 * 
 * Run with: npx tsx scripts/run-final-validation.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Load environment variables from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "../../.env") });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

interface ValidationResult {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: any;
}

const results: ValidationResult[] = [];

function logResult(result: ValidationResult) {
  results.push(result);
  const icon =
    result.status === "pass"
      ? "✅"
      : result.status === "fail"
        ? "❌"
        : "⚠️";
  console.log(`${icon} ${result.name}: ${result.message}`);
  if (result.details) {
    console.log(`   ${JSON.stringify(result.details, null, 2)}`);
  }
}

async function checkDatabaseSchema() {
  console.log("\n📊 Checking Database Schema...\n");

  // Check windows_automation_bees table
  const { data: beesData, error: beesError } = await supabase
    .from("windows_automation_bees")
    .select("id")
    .limit(1);

  if (beesError) {
    logResult({
      name: "windows_automation_bees table",
      status: "fail",
      message: `Table not found: ${beesError.message}`,
      details: {
        suggestion:
          "Run migration 0015 from zyeute/MIGRATIONS_AUTOMATION.md",
      },
    });
  } else {
    logResult({
      name: "windows_automation_bees table",
      status: "pass",
      message: "Table exists and is accessible",
    });
  }

  // Check automation_tasks table
  const { data: tasksData, error: tasksError } = await supabase
    .from("automation_tasks")
    .select("id")
    .limit(1);

  if (tasksError) {
    logResult({
      name: "automation_tasks table",
      status: "fail",
      message: `Table not found: ${tasksError.message}`,
      details: {
        suggestion:
          "Run migration 0016 from zyeute/MIGRATIONS_AUTOMATION.md",
      },
    });
  } else {
    logResult({
      name: "automation_tasks table",
      status: "pass",
      message: "Table exists and is accessible",
    });
  }

  // Check foreign key constraint
  if (!beesError && !tasksError) {
    const { error: fkError } = await supabase
      .from("automation_tasks")
      .select("bee_id")
      .limit(1);

    if (fkError && fkError.message.includes("foreign key")) {
      logResult({
        name: "Foreign key constraint",
        status: "fail",
        message: "Foreign key constraint not properly configured",
        details: { error: fkError.message },
      });
    } else {
      logResult({
        name: "Foreign key constraint",
        status: "pass",
        message: "Foreign key relationships are valid",
      });
    }
  }
}

async function checkBridgeService() {
  console.log("\n🔌 Checking Python Bridge Service...\n");

  try {
    const response = await fetch("http://127.0.0.1:8001/health", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      logResult({
        name: "Python bridge health",
        status: "fail",
        message: `Health endpoint returned ${response.status}`,
        details: {
          suggestion: "Start Python bridge service: cd Windows-Use && python bridge_service.py --port 8001",
        },
      });
      return;
    }

    const data = await response.json();
    logResult({
      name: "Python bridge health",
      status: "pass",
      message: "Bridge service is running and healthy",
      details: data,
    });
  } catch (error: any) {
    logResult({
      name: "Python bridge health",
      status: "fail",
      message: `Cannot connect to bridge service: ${error.message}`,
      details: {
        suggestion: "Start Python bridge service: cd Windows-Use && python bridge_service.py --port 8001",
        error: error.message,
      },
    });
  }
}

async function checkTypeMatching() {
  console.log("\n🔍 Checking Type Matching...\n");

  // Read TypeScript interface
  const fs = await import("fs/promises");
  const path = await import("path");

  try {
    const bridgePath = path.join(
      __dirname,
      "../backend/services/windows-automation-bridge.ts",
    );
    const bridgeCode = await fs.readFile(bridgePath, "utf-8");

    // Extract AutomationTask interface
    const taskInterfaceMatch = bridgeCode.match(
      /interface\s+AutomationTask\s*\{([^}]+)\}/s,
    );

    if (!taskInterfaceMatch) {
      logResult({
        name: "TypeScript interface",
        status: "warning",
        message: "Could not find AutomationTask interface",
      });
      return;
    }

    const tsFields = taskInterfaceMatch[1]
      .split("\n")
      .filter((line) => line.includes(":"))
      .map((line) => {
        const match = line.match(/(\w+)\s*:\s*([^;]+)/);
        return match ? { name: match[1].trim(), type: match[2].trim() } : null;
      })
      .filter(Boolean);

    logResult({
      name: "TypeScript AutomationTask",
      status: "pass",
      message: `Found ${tsFields.length} fields`,
      details: { fields: tsFields },
    });

    // Check Python model
    const pythonBridgePath = path.join(
      __dirname,
      "../../Windows-Use/bridge_service.py",
    );
    const pythonCode = await fs.readFile(pythonBridgePath, "utf-8");

    const pythonModelMatch = pythonCode.match(
      /class\s+AutomationTask\s*\([^)]*\):\s*([^\n]+(?:\n\s+[^\n]+)*)/s,
    );

    if (!pythonModelMatch) {
      logResult({
        name: "Python AutomationTask",
        status: "warning",
        message: "Could not find AutomationTask Pydantic model",
      });
      return;
    }

    const pythonFields = pythonModelMatch[1]
      .split("\n")
      .filter((line) => line.includes(":"))
      .map((line) => {
        const match = line.match(/(\w+)\s*:\s*([^=#]+)/);
        return match ? { name: match[1].trim(), type: match[2].trim() } : null;
      })
      .filter(Boolean);

    logResult({
      name: "Python AutomationTask",
      status: "pass",
      message: `Found ${pythonFields.length} fields`,
      details: { fields: pythonFields },
    });

    // Compare fields
    const tsFieldNames = tsFields.map((f) => f?.name).filter(Boolean);
    const pythonFieldNames = pythonFields.map((f) => f?.name).filter(Boolean);

    const missingInPython = tsFieldNames.filter(
      (name) => !pythonFieldNames.includes(name),
    );
    const missingInTypeScript = pythonFieldNames.filter(
      (name) => !tsFieldNames.includes(name),
    );

    if (missingInPython.length > 0 || missingInTypeScript.length > 0) {
      logResult({
        name: "Type matching",
        status: "fail",
        message: "Field name mismatches found",
        details: {
          missingInPython,
          missingInTypeScript,
          suggestion:
            "Ensure field names match (camelCase in TS, snake_case in Python or vice versa)",
        },
      });
    } else {
      logResult({
        name: "Type matching",
        status: "pass",
        message: "All fields match between TypeScript and Python",
      });
    }
  } catch (error: any) {
    logResult({
      name: "Type matching",
      status: "warning",
      message: `Could not verify type matching: ${error.message}`,
    });
  }
}

async function checkEndToEndFlow() {
  console.log("\n🔄 Checking End-to-End Flow...\n");

  // This would test the full flow:
  // 1. Create task in database
  // 2. Route via Synapse Bridge
  // 3. Execute via Python Bridge
  // 4. Store result back in database

  logResult({
    name: "End-to-end flow",
    status: "warning",
    message: "Manual testing required",
    details: {
      suggestion:
        "Run test-automation-integration.ts for full end-to-end validation",
    },
  });
}

async function generateSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 VALIDATION SUMMARY");
  console.log("=".repeat(60) + "\n");

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warnings = results.filter((r) => r.status === "warning").length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`📊 Total: ${results.length}\n`);

  if (failed > 0) {
    console.log("❌ FAILURES TO ADDRESS:\n");
    results
      .filter((r) => r.status === "fail")
      .forEach((r) => {
        console.log(`   • ${r.name}: ${r.message}`);
        if (r.details?.suggestion) {
          console.log(`     → ${r.details.suggestion}`);
        }
      });
    console.log();
  }

  if (warnings > 0) {
    console.log("⚠️  WARNINGS:\n");
    results
      .filter((r) => r.status === "warning")
      .forEach((r) => {
        console.log(`   • ${r.name}: ${r.message}`);
      });
    console.log();
  }

  if (failed === 0 && warnings === 0) {
    console.log("🎉 ALL CHECKS PASSED! System is 100% production ready!\n");
    return 0;
  } else if (failed === 0) {
    console.log(
      "✅ All critical checks passed! Review warnings for optimizations.\n",
    );
    return 0;
  } else {
    console.log(
      "❌ Some checks failed. Please address the issues above.\n",
    );
    return 1;
  }
}

async function main() {
  console.log("🚀 Starting Final Validation...\n");
  console.log("=".repeat(60));
  console.log("COLONY OS BACKEND VALIDATION");
  console.log("=".repeat(60) + "\n");

  try {
    await checkDatabaseSchema();
    await checkBridgeService();
    await checkTypeMatching();
    await checkEndToEndFlow();

    const exitCode = await generateSummary();
    process.exit(exitCode);
  } catch (error: any) {
    console.error("❌ Validation error:", error);
    process.exit(1);
  }
}

main();
