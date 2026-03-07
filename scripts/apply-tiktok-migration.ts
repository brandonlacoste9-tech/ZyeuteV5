/**
 * Apply TikTok Support Migration to Supabase
 * Adds tiktok_url, youtube_url, and video_source columns
 */

import pg from "pg";
import * as fs from "fs";
import * as path from "path";

const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  console.log(
    "Usage: DATABASE_URL=your_connection_string npm run tsx scripts/apply-tiktok-migration.ts",
  );
  process.exit(1);
}

async function applyMigration() {
  console.log("🚀 Applying TikTok support migration...\n");

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      "..",
      "backend",
      "migrations",
      "20260307_add_tiktok_support.sql",
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("📄 Executing migration...\n");

    // Execute migration
    await client.query(migrationSQL);

    console.log("✅ Migration applied successfully!\n");

    // Verify columns were added
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'publications' 
      AND column_name IN ('tiktok_url', 'youtube_url', 'video_source')
      ORDER BY column_name;
    `);

    console.log("📊 New columns:");
    result.rows.forEach((row) => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
