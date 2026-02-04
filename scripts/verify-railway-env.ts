#!/usr/bin/env tsx
/**
 * Verify Railway Environment Variables
 *
 * Checks if critical environment variables are set
 * Run this locally to verify before deploying
 */

import "dotenv/config";

console.log("🔍 Verifying Railway Environment Variables...\n");

const requiredVars = [
  {
    name: "DATABASE_URL",
    description: "PostgreSQL connection string (Supabase)",
    critical: true,
    check: (val: string) => {
      if (!val) return { valid: false, error: "Not set" };
      if (!val.includes("postgresql://"))
        return { valid: false, error: "Invalid format" };
      if (val.includes(":5432/") && !val.includes(":6543/")) {
        return {
          valid: false,
          error: "Should use port 6543 (Connection Pooling)",
        };
      }
      return { valid: true };
    },
  },
  {
    name: "VITE_SUPABASE_URL",
    description: "Supabase project URL",
    critical: true,
    check: (val: string) => {
      if (!val) return { valid: false, error: "Not set" };
      if (!val.startsWith("https://"))
        return { valid: false, error: "Should start with https://" };
      return { valid: true };
    },
  },
  {
    name: "VITE_SUPABASE_ANON_KEY",
    description: "Supabase anonymous key",
    critical: true,
    check: (val: string) => {
      if (!val) return { valid: false, error: "Not set" };
      if (val.length < 50)
        return { valid: false, error: "Key seems too short" };
      return { valid: true };
    },
  },
  {
    name: "MAX_API_TOKEN",
    description: "Max API token (optional)",
    critical: false,
    check: (val: string) => {
      if (!val) return { valid: false, error: "Not set (optional)" };
      return { valid: true };
    },
  },
];

let allCriticalValid = true;

for (const varDef of requiredVars) {
  const value = process.env[varDef.name];
  const check = varDef.check(value || "");

  if (check.valid) {
    const displayValue = value
      ? value.length > 50
        ? `${value.substring(0, 20)}...${value.substring(value.length - 10)}`
        : value
      : "not set";
    console.log(
      `✅ ${varDef.name}: ${check.valid ? "OK" : "INVALID"} ${varDef.critical ? "(CRITICAL)" : "(optional)"}`,
    );
    console.log(`   Value: ${displayValue}`);
  } else {
    const status = varDef.critical ? "❌" : "⚠️";
    console.log(
      `${status} ${varDef.name}: ${check.error} ${varDef.critical ? "(CRITICAL)" : "(optional)"}`,
    );
    if (varDef.critical) {
      allCriticalValid = false;
    }
  }
  console.log(`   Description: ${varDef.description}\n`);
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
if (allCriticalValid) {
  console.log("✅ All critical variables are set!");
  console.log("\n💡 Next steps:");
  console.log("   1. Verify these are also set in Railway Dashboard");
  console.log(
    "   2. Use Railway Postgres (zyeute-db) for DATABASE_URL if available",
  );
  console.log("   3. Redeploy: railway up");
  console.log("   4. Check logs: railway logs");
  console.log("   5. Verify healthcheck passes in Railway Dashboard");
  console.log(
    "   6. Test: https://zyeutev5-production.up.railway.app/api/health",
  );
} else {
  console.log("❌ Missing critical variables!");
  console.log("\n💡 Fix:");
  console.log("   1. Set missing variables in Railway Dashboard");
  console.log(
    "   2. Use Railway Postgres connection string (zyeute-db) for DATABASE_URL",
  );
  console.log("   3. Or use Supabase connection pooling (port 6543)");
  console.log("   4. Redeploy after setting variables");
}
console.log("\n📋 Backend Configuration:");
console.log(`   PORT: ${process.env.PORT || "3000 (default)"}`);
console.log(`   Server binds to: 0.0.0.0 (required for Railway)`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

process.exit(allCriticalValid ? 0 : 1);
