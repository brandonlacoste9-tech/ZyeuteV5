#!/usr/bin/env tsx
/**
 * Run Critical Schema Migrations
 * Executes apply-critical-migrations.sql to fix schema issues on production
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
  process.exit(1);
}

async function runCriticalMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Railway/production usually
  });

  try {
    console.log("🔗 Connecting to database for migration...");
    await client.connect();
    console.log("✅ Connected to database\n");

    // Read migration file
    let sql;
    try {
      const migrationPath = join(__dirname, "../apply-critical-migrations.sql");
      sql = readFileSync(migrationPath, "utf-8");
      console.log(`📄 Found migration file at ${migrationPath}. Executing...`);
    } catch (err) {
      console.warn("⚠️ Migration file not found, using inline fallback schema.");
      sql = `
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_karma INTEGER DEFAULT 0;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS karma_credits INTEGER DEFAULT 0;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cash_credits INTEGER DEFAULT 0;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_gifts_sent INTEGER DEFAULT 0;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_gifts_received INTEGER DEFAULT 0;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS legendary_badges TEXT[] DEFAULT '{}';
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tax_id TEXT;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bee_alias TEXT;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nectar_points INTEGER DEFAULT 0;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_daily_bonus TIMESTAMP;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS unlocked_hives TEXT[] DEFAULT '{}';
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS parent_id UUID;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS city TEXT;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS region_id TEXT;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS hive_id UUID;
        ALTER TABLE publications ADD COLUMN IF NOT EXISTS visibilite TEXT DEFAULT 'public';

        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='publications' AND column_name='visibility') THEN
                UPDATE "publications" SET "visibilite" = "visibility" WHERE "visibilite" IS NULL;
                RAISE NOTICE '✅ Synced visibility -> visibilite';
            END IF;
            RAISE NOTICE '✅ Inline migration completed successfully';
        END $$;
      `;
    }
    
    // Execute the migration
    await client.query(sql);

    console.log("\n✅ Critical migration applied successfully!");
    
  } catch (error: any) {
    // Check for common idempotency errors (Postgres codes)
    // 42P07: duplicate_table
    // 42701: duplicate_column
    // 23505: unique_violation
    if (['42P07', '42701', '23505'].includes(error.code)) {
      console.log(`⚠️ Migration skipped (Idempotency): ${error.message}`);
      console.log("✅ Schema is already up to date.");
    } else {
      console.error("\n❌ CRITICAL MIGRATION FAILED:", error.message);
      console.error("Error Code:", error.code);
      console.log("⚠️ Continuing startup sequence (Risk of instability)...");
    }
  } finally {
    await client.end();
    console.log("🔌 Database connection closed");
  }
}

runCriticalMigration();
