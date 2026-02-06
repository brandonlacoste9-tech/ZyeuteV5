#!/usr/bin/env tsx
// Run complete TikTok features migration
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigration() {
  const databaseUrl =
    process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  console.log("🔧 Connecting to database...");

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log("✅ Connected to database");

    const migrationPath = join(
      process.cwd(),
      "backend/migrations/20260206_add_tiktok_features.sql",
    );
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("📊 Running complete TikTok features migration...");
    console.log(
      "   Adding: original_post_id, remix_count, sound_id, sound_start_time",
    );

    await client.query(migrationSQL);

    console.log("✅ Migration completed successfully!");
    console.log("");
    console.log("🎉 All TikTok-style columns now exist:");
    console.log("   ✓ remix_type");
    console.log("   ✓ original_post_id");
    console.log("   ✓ remix_count");
    console.log("   ✓ sound_id");
    console.log("   ✓ sound_start_time");

    client.release();
    await pool.end();

    console.log("");
    console.log("🚀 Test the API:");
    console.log("   https://zyeutev5-production.up.railway.app/api/posts/feed");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
