#!/usr/bin/env tsx
/**
 * Test Supabase MCP Connection
 *
 * Run this after restarting Claude Code to verify Supabase MCP is working
 *
 * Usage:
 *   tsx scripts/test-supabase-mcp.ts
 */

import "dotenv/config";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

console.log("🔍 Testing Supabase Connection...\n");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials");
  console.log("\n💡 Set in .env:");
  console.log("   VITE_SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co");
  console.log("   VITE_SUPABASE_ANON_KEY=your_anon_key\n");
  process.exit(1);
}

console.log(`✅ Supabase URL: ${SUPABASE_URL}`);
console.log(`✅ Supabase Key: ${SUPABASE_KEY.substring(0, 20)}...\n`);

// Test query - list tables
async function testConnection() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (response.ok) {
      console.log("✅ Supabase connection successful!");
      console.log(`   Status: ${response.status}`);
      console.log("\n💡 After restarting Claude Code, test MCP with:");
      console.log('   "List all tables in the Supabase database"');
      console.log('   "Query the users table"');
      console.log('   "Show me the schema for the posts table"\n');
    } else {
      console.log(`⚠️  Supabase responded with status: ${response.status}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 100)}...\n`);
    }
  } catch (error: any) {
    console.error("❌ Connection failed:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("   1. Check SUPABASE_URL is correct");
    console.log("   2. Verify SUPABASE_KEY is valid");
    console.log("   3. Check network connection\n");
  }
}

testConnection();
