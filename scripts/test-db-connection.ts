/**
 * Test database connection with new direct URL
 */
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

async function testSupabaseHTTP() {
  console.log("Testing Supabase HTTP API...");
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("❌ Missing Supabase env vars");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("publications")
    .select("count")
    .eq("type", "video")
    .is("deleted_at", null)
    .single();

  if (error) {
    console.log("❌ Supabase HTTP error:", error.message);
  } else {
    console.log("✅ Supabase HTTP works! Video count:", data?.count);
  }
}

async function testDirectPostgres() {
  console.log("\nTesting Direct PostgreSQL...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL?.slice(0, 40) + "...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT COUNT(*) as count FROM publications WHERE type = 'video' AND deleted_at IS NULL",
    );
    console.log(
      "✅ Direct PostgreSQL works! Video count:",
      result.rows[0].count,
    );
    client.release();
  } catch (err: any) {
    console.log("❌ Direct PostgreSQL error:", err.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log("=== DB Connection Test ===\n");
  await testSupabaseHTTP();
  await testDirectPostgres();
}

main();
