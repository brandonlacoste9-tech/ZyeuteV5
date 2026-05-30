#!/usr/bin/env tsx
/**
 * Verify Railway Environment Variables
 *
 * Checks if all required variables are documented for Railway setup
 *
 * Usage:
 *   tsx scripts/verify-railway-variables.ts
 */

import "dotenv/config";

console.log("🔍 Verifying Railway Environment Variables...\n");

const requiredVars = [
  {
    name: "DATABASE_URL",
    description:
      "PostgreSQL connection string (CRITICAL - backend won't start without this)",
    value: process.env.DATABASE_URL,
    required: true,
  },
  {
    name: "VITE_SUPABASE_URL",
    description: "Supabase project URL",
    value: process.env.VITE_SUPABASE_URL,
    required: true,
  },
  {
    name: "VITE_SUPABASE_ANON_KEY",
    description: "Supabase anonymous key",
    value: process.env.VITE_SUPABASE_ANON_KEY,
    required: true,
  },
  {
    name: "MAX_API_TOKEN",
    description: "Max API token (optional)",
    value: process.env.MAX_API_TOKEN,
    required: false,
  },
];

console.log("📋 Required Railway Variables:\n");

let allCriticalSet = true;

for (const varDef of requiredVars) {
  const status = varDef.value ? "✅" : varDef.required ? "❌" : "⚠️";
  const required = varDef.required ? "(CRITICAL)" : "(optional)";

  console.log(`${status} ${varDef.name} ${required}`);
  console.log(`   ${varDef.description}`);

  if (varDef.value) {
    const displayValue =
      varDef.value.length > 50
        ? `${varDef.value.substring(0, 30)}...${varDef.value.substring(varDef.value.length - 10)}`
        : varDef.value;
    console.log(`   Value: ${displayValue}`);
  } else if (varDef.required) {
    console.log(`   ⚠️  NOT SET - Backend will fail without this!`);
    allCriticalSet = false;
  }
  console.log("");
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
if (allCriticalSet) {
  console.log("✅ All critical variables are set locally!");
  console.log("\n💡 Next steps:");
  console.log("   1. Set these same variables in Railway Dashboard");
  console.log("   2. Redeploy backend");
  console.log("   3. Test: npm run check:railway");
} else {
  console.log("❌ Missing critical variables!");
  console.log("\n💡 Fix:");
  console.log("   1. Set missing variables in Railway Dashboard");
  console.log("   2. Use values from your .env file");
  console.log("   3. Redeploy after setting variables");
}
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// Show exact values to copy to Railway
if (process.env.DATABASE_URL) {
  console.log("📋 Copy this to Railway Variables:\n");
  console.log(`DATABASE_URL=${process.env.DATABASE_URL}\n`);
}

process.exit(allCriticalSet ? 0 : 1);
