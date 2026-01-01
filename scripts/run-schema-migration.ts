#!/usr/bin/env tsx
/**
 * Run Initial Schema Migration
 * Executes migrations/0000_misty_namorita.sql to create all database tables
 */

import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import pg from "pg";
import { config } from "dotenv";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  console.error("   Set DATABASE_URL or DIRECT_DATABASE_URL in .env file or as environment variable");
  process.exit(1);
}

async function runSchemaMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log("🔗 Connecting to database...");
    await client.connect();
    console.log("✅ Connected to database\n");

    // Read migration file
    const migrationPath = join(__dirname, "../migrations/0000_misty_namorita.sql");
    const sql = readFileSync(migrationPath, "utf-8");

    console.log("📄 Executing schema migration: 0000_misty_namorita.sql");
    console.log("   This will create all database tables and types\n");

    // Execute the migration
    await client.query(sql);

    console.log("\n✅ Schema migration completed successfully!");
    console.log("📊 All database tables and types have been created");

    // Verify key tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`\n📋 Created ${tables.rows.length} tables:`);
    tables.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

  } catch (error: any) {
    console.error("\n❌ Migration failed:", error.message);
    if (error.code === "ENOENT") {
      console.error("   Migration file not found. Make sure migrations/0000_misty_namorita.sql exists.");
    } else if (error.message.includes("already exists")) {
      console.error("   Some tables already exist. This is okay - continuing...");
    } else {
      console.error("   Error details:", error);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n🔌 Database connection closed");
  }
}

runSchemaMigration();
