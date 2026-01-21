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
    console.log("⚙️ Starting Schema Repair...");

    // 1. Enable PostGIS
    console.log(" - Enabling PostGIS...");
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");

    // 2. Enable Vector
    console.log(" - Enabling pgvector...");
    await client.query("CREATE EXTENSION IF NOT EXISTS vector;");

    // 3. Fix publications table
    console.log(" - Repairing 'publications' table...");
    await client.query(`
      ALTER TABLE "publications" 
      ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326),
      ADD COLUMN IF NOT EXISTS "reactions_count" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "comments_count" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "est_masque" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "visibility" text DEFAULT 'public',
      ADD COLUMN IF NOT EXISTS "hive_id" text DEFAULT 'quebec';
    `);

    // 4. Fix user_profiles table
    console.log(" - Repairing 'user_profiles' table...");
    await client.query(`
      ALTER TABLE "user_profiles" 
      ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326),
      ADD COLUMN IF NOT EXISTS "hive_id" text DEFAULT 'quebec',
      ADD COLUMN IF NOT EXISTS "credits" integer DEFAULT 0;
    `);

    console.log("✅ Schema Repair Complete!");
  } catch (err) {
    console.error("❌ Schema Repair Failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

repairSchema();
