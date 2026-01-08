#!/usr/bin/env tsx
/**
 * Supabase Connection & Migration Status Checker
 * Verifies connection and checks if automation tables exist.
 *
 * Run from the `zyeute` directory with:
 *   npx tsx scripts/check-supabase-connection.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://vuanulvyqkfefmjcikfk.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in environment");
  console.error("   Required: SUPABASE_URL (or VITE_SUPABASE_URL)");
  console.error("   Required: SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  console.log("🔌 Checking Supabase Connection...\n");
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...\n`);

  // 1. Test basic connection
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id")
    .limit(1);

  if (postsError) {
    console.error("❌ Connection failed:");
    console.error(`   ${postsError.message}`);
    return false;
  }

  console.log("✅ Supabase connection successful!");
  console.log("   Tables accessible\n");

  // 2. Check for automation tables
  console.log("🔍 Checking for automation tables...\n");

  const tableChecks = await Promise.all([
    supabase
      .from("windows_automation_bees")
      .select("id")
      .limit(1)
      .then((r) => ({
        name: "windows_automation_bees",
        exists: !r.error,
        error: r.error?.message,
      })),
    supabase
      .from("automation_tasks")
      .select("id")
      .limit(1)
      .then((r) => ({
        name: "automation_tasks",
        exists: !r.error,
        error: r.error?.message,
      })),
  ]);

  let allExist = true;
  tableChecks.forEach((check) => {
    if (check.exists) {
      console.log(`✅ ${check.name} - EXISTS`);
    } else {
      console.log(`❌ ${check.name} - NOT FOUND`);
      if (check.error) {
        console.log(`   Error: ${check.error}`);
      }
      allExist = false;
    }
  });

  console.log();

  if (!allExist) {
    console.log("📋 Next Steps:");
    console.log("   1. Open Supabase Dashboard → SQL Editor");
    console.log("   2. Copy SQL from: zyeute/MIGRATIONS_AUTOMATION.md");
    console.log("   3. Run Migration 0015 (windows_automation_bees)");
    console.log("   4. Run Migration 0016 (automation_tasks)");
    console.log("   5. Run this script again to verify\n");
    return false;
  } else {
    console.log("✅ All automation tables exist!");
    console.log("   System is ready for automation tasks!\n");
    return true;
  }
}

checkConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
  });
