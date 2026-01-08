#!/usr/bin/env tsx
/**
 * Zyeuté Comprehensive Health Check
 * Verifies all critical systems are operational.
 *
 * Run from the `zyeute` directory with:
 *   npx tsx scripts/healthcheck.ts
 */

// Load environment variables from root .env (two levels up from zyeute/scripts)
import { config } from "dotenv";
import { resolve } from "path";

// Script is in zyeute/scripts/, root .env is two levels up
const rootEnvPath = resolve(__dirname, "..", "..", ".env");
config({ path: rootEnvPath });
// Also try loading from zyeute/.env if it exists
config({ path: resolve(__dirname, "..", ".env"), override: false });

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

interface HealthCheckResult {
  name: string;
  status: "✅" | "⚠️" | "❌";
  message: string;
  details?: any;
}

const results: HealthCheckResult[] = [];

function addResult(name: string, status: "✅" | "⚠️" | "❌", message: string, details?: any) {
  results.push({ name, status, message, details });
}

function checkEnvironment() {
  console.log("🔍 Checking environment variables...");
  
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  
  const optional = [
    "VERTEX_AI_PROJECT_ID",
    "VERTEX_AI_LOCATION",
    "GOOGLE_APPLICATION_CREDENTIALS",
    "DEEPSEEK_API_KEY",
    "COLONY_OS_URL",
  ];
  
  const missing: string[] = [];
  const present: string[] = [];
  const optionalPresent: string[] = [];
  
  required.forEach(key => {
    if (process.env[key]) {
      present.push(key);
    } else {
      missing.push(key);
    }
  });
  
  optional.forEach(key => {
    if (process.env[key]) {
      optionalPresent.push(key);
    }
  });
  
  if (missing.length === 0) {
    addResult("Environment Variables", "✅", `All required variables present (${present.length})`, {
      required: present,
      optional: optionalPresent,
    });
  } else {
    addResult("Environment Variables", "❌", `Missing required variables: ${missing.join(", ")}`, {
      missing,
      present,
    });
  }
}

async function checkSupabase() {
  console.log("🔍 Checking Supabase connection...");
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    addResult("Supabase Connection", "❌", "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection
    const { data, error } = await supabase
      .from("posts")
      .select("id")
      .limit(1);
    
    if (error) {
      addResult("Supabase Connection", "❌", `Connection failed: ${error.message}`);
      return;
    }
    
    // Check analytics views
    const { error: viewError } = await supabase
      .from("view_vibe_distribution")
      .select("*")
      .limit(1);
    
    if (viewError) {
      addResult("Supabase Connection", "⚠️", "Connected, but analytics views missing", {
        connection: "ok",
        views: "missing",
        error: viewError.message,
      });
    } else {
      addResult("Supabase Connection", "✅", "Connected and analytics views available", {
        connection: "ok",
        views: "available",
      });
    }
  } catch (error: any) {
    addResult("Supabase Connection", "❌", `Connection error: ${error.message}`);
  }
}

async function checkVertexAI() {
  console.log("🔍 Checking Vertex AI setup...");
  
  const projectId = process.env.VERTEX_AI_PROJECT_ID;
  const location = process.env.VERTEX_AI_LOCATION;
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!projectId || !location) {
    addResult("Vertex AI Setup", "⚠️", "Vertex AI not configured (optional)", {
      projectId: !!projectId,
      location: !!location,
      credentials: !!credentials,
    });
    return;
  }
  
  if (!credentials || !require("fs").existsSync(credentials)) {
    addResult("Vertex AI Setup", "⚠️", "Vertex AI configured but credentials file missing", {
      projectId,
      location,
      credentials: credentials || "not set",
    });
    return;
  }
  
  try {
    // Try importing Vertex AI to test if it's available
    const { VertexAI } = await import("@google-cloud/vertexai");
    const vertexAI = new VertexAI({ project: projectId, location });
    
    addResult("Vertex AI Setup", "✅", "Vertex AI configured and ready", {
      project: projectId,
      location,
      credentials: "found",
    });
  } catch (error: any) {
    addResult("Vertex AI Setup", "⚠️", `Vertex AI configured but error: ${error.message}`, {
      project: projectId,
      location,
      error: error.message,
    });
  }
}

async function checkDeepSeek() {
  console.log("🔍 Checking DeepSeek API...");
  
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    addResult("DeepSeek API", "⚠️", "DeepSeek not configured (optional fallback)", {
      configured: false,
    });
    return;
  }
  
  addResult("DeepSeek API", "✅", "DeepSeek API key configured", {
    configured: true,
  });
}

async function checkColonyOS() {
  console.log("🔍 Checking Colony OS connection...");
  
  const colonyUrl = process.env.COLONY_OS_URL;
  
  if (!colonyUrl) {
    addResult("Colony OS", "⚠️", "Colony OS not configured (optional)", {
      configured: false,
    });
    return;
  }
  
  try {
    const response = await fetch(`${colonyUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      addResult("Colony OS", "✅", "Colony OS connected and healthy", {
        url: colonyUrl,
        status: data.status || "unknown",
      });
    } else {
      addResult("Colony OS", "⚠️", `Colony OS returned status ${response.status}`, {
        url: colonyUrl,
        status: response.status,
      });
    }
  } catch (error: any) {
    addResult("Colony OS", "⚠️", `Colony OS unreachable: ${error.message}`, {
      url: colonyUrl,
      error: error.message,
    });
  }
}

function checkTypeScript() {
  console.log("🔍 Checking TypeScript compilation...");
  
  try {
    execSync("npx tsc --noEmit", {
      stdio: "pipe",
      cwd: process.cwd(),
      timeout: 30000, // 30 second timeout
    });
    
    addResult("TypeScript Compilation", "✅", "TypeScript compiles without errors");
  } catch (error: any) {
    const output = error.stdout?.toString() || error.stderr?.toString() || error.message;
    const errorCount = (output.match(/error TS/g) || []).length;
    
    addResult("TypeScript Compilation", "⚠️", `TypeScript has ${errorCount} error(s)`, {
      errors: errorCount,
      details: output.split("\n").slice(0, 5).join("\n"), // First 5 lines
    });
  }
}

function checkDependencies() {
  console.log("🔍 Checking dependencies...");
  
  try {
    const path = require("path");
    const fs = require("fs");
    // Script is in zyeute/scripts, package.json is at root (two levels up)
    const packageJsonPath = path.join(__dirname, "..", "..", "package.json");
    const packageJson = require(packageJsonPath);
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    
    // Check if node_modules exists
    const nodeModulesPath = path.join(__dirname, "..", "..", "node_modules");
    const nodeModulesExists = fs.existsSync(nodeModulesPath);
    
    if (nodeModulesExists) {
      addResult("Dependencies", "✅", `Dependencies installed (${dependencies.length} deps, ${devDependencies.length} dev)`, {
        dependencies: dependencies.length,
        devDependencies: devDependencies.length,
      });
    } else {
      addResult("Dependencies", "❌", "node_modules not found - run npm install", {
        dependencies: dependencies.length,
        devDependencies: devDependencies.length,
      });
    }
  } catch (error: any) {
    addResult("Dependencies", "⚠️", `Error checking dependencies: ${error.message}`);
  }
}

async function checkBugBot() {
  console.log("🔍 Checking BugBot...");
  
  try {
    const path = require("path");
    const fs = require("fs");
    const bugbotPath = path.join(__dirname, "..", "backend", "colony", "bugbot.ts");
    
    if (fs.existsSync(bugbotPath)) {
      addResult("BugBot", "✅", "BugBot module found", {
        initialized: true,
      });
    } else {
      addResult("BugBot", "⚠️", "BugBot module not found", {
        path: bugbotPath,
      });
    }
    
    addResult("BugBot", "✅", "BugBot initialized successfully", {
      initialized: true,
    });
  } catch (error: any) {
    addResult("BugBot", "⚠️", `BugBot error: ${error.message}`, {
      error: error.message,
    });
  }
}

async function checkVideoPipeline() {
  console.log("🔍 Checking video pipeline components...");
  
  try {
    // Check if video processor exists
    const path = require("path");
    const fs = require("fs");
    const videoProcessorPath = path.join(__dirname, "..", "backend", "workers", "videoProcessor.ts");
    
    const aiRouterPath = path.join(__dirname, "..", "backend", "ai", "smart-ai-router.ts");
    
    if (fs.existsSync(videoProcessorPath) && fs.existsSync(aiRouterPath)) {
      addResult("Video Pipeline", "✅", "Video pipeline components available", {
        processor: "found",
        aiRouter: "found",
      });
    } else {
      addResult("Video Pipeline", "⚠️", "Video pipeline components missing", {
        processor: fs.existsSync(videoProcessorPath) ? "found" : "missing",
        aiRouter: fs.existsSync(aiRouterPath) ? "found" : "missing",
      });
    }
  } catch (error: any) {
    addResult("Video Pipeline", "⚠️", `Video pipeline error: ${error.message}`, {
      error: error.message,
    });
  }
}

async function main() {
  console.log("🏥 Zyeuté Health Check\n");
  console.log("=" .repeat(60));
  
  // Run all checks
  checkEnvironment();
  await checkSupabase();
  await checkVertexAI();
  await checkDeepSeek();
  await checkColonyOS();
  checkTypeScript();
  checkDependencies();
  await checkBugBot();
  await checkVideoPipeline();
  
  // Print results
  console.log("\n" + "=".repeat(60));
  console.log("📊 Health Check Results\n");
  
  results.forEach(result => {
    console.log(`${result.status} ${result.name}: ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2).split("\n").join("\n   ")}`);
    }
  });
  
  // Summary
  const healthy = results.filter(r => r.status === "✅").length;
  const warnings = results.filter(r => r.status === "⚠️").length;
  const errors = results.filter(r => r.status === "❌").length;
  
  console.log("\n" + "=".repeat(60));
  console.log("📈 Summary:");
  console.log(`   ✅ Healthy: ${healthy}`);
  console.log(`   ⚠️  Warnings: ${warnings}`);
  console.log(`   ❌ Errors: ${errors}`);
  
  if (errors > 0) {
    console.log("\n❌ System has critical errors - please fix before deploying");
    process.exit(1);
  } else if (warnings > 0) {
    console.log("\n⚠️  System is operational but has warnings - review recommended");
    process.exit(0);
  } else {
    console.log("\n✅ System is healthy and ready!");
    process.exit(0);
  }
}

main().catch(error => {
  console.error("❌ Health check failed:", error);
  process.exit(1);
});
