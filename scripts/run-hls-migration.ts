#!/usr/bin/env tsx
// Run HLS migration (no psql required - uses Node + pg)
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigration() {
  const databaseUrl =
    process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not set");
    console.error("Run with: railway run tsx scripts/run-hls-migration.ts");
    process.exit(1);
  }

  console.log("🔧 Connecting to database...");
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log("✅ Connected");

    const sql = readFileSync(
      join(process.cwd(), "backend/migrations/20260202_add_hls_url.sql"),
      "utf-8",
    );
    await client.query(sql);
    console.log("✅ HLS migration completed (hls_url column added)");

    client.release();
    await pool.end();
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

runMigration();
