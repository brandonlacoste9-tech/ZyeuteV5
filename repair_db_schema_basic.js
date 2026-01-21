import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function repairSchema() {
  const client = await pool.connect();
  try {
    console.log("⚙️ Starting Schema Repair (Non-PostGIS version)...");

    // 1. Enable Vector (Usually available if it's a newer Railway image or manually added)
    console.log(" - Trying to enable pgvector...");
    try {
      await client.query("CREATE EXTENSION IF NOT EXISTS vector;");
    } catch (e) {
      console.warn(
        "⚠️ pgvector extension failed, skipping (might already exist or not supported):",
        e.message,
      );
    }

    // 2. Fix publications table - using TEXT for location to avoid PostGIS dependency for now
    console.log(" - Repairing 'publications' table...");
    await client.query(`
      ALTER TABLE "publications" 
      ADD COLUMN IF NOT EXISTS "location" text,
      ADD COLUMN IF NOT EXISTS "reactions_count" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "comments_count" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "est_masque" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "visibility" text DEFAULT 'public',
      ADD COLUMN IF NOT EXISTS "hive_id" text DEFAULT 'quebec';
    `);

    // 3. Fix user_profiles table
    console.log(" - Repairing 'user_profiles' table...");
    await client.query(`
      ALTER TABLE "user_profiles" 
      ADD COLUMN IF NOT EXISTS "location" text,
      ADD COLUMN IF NOT EXISTS "hive_id" text DEFAULT 'quebec',
      ADD COLUMN IF NOT EXISTS "credits" integer DEFAULT 0;
    `);

    console.log("✅ Schema Repair Complete (Basic Columns Added)!");
  } catch (err) {
    console.error("❌ Schema Repair Failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

repairSchema();
