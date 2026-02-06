#!/usr/bin/env tsx
// Run database migration directly
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigration() {
  // Use DATABASE_PUBLIC_URL for external access, fallback to DATABASE_URL
  const databaseUrl =
    process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not set");
    console.error("Run with: railway run tsx scripts/run-migration.ts");
    process.exit(1);
  }

  console.log("🔧 Connecting to database...");
  console.log(`   URL: ${databaseUrl.substring(0, 30)}...`);

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log("✅ Connected to database");

    const migrationPath = join(
      process.cwd(),
      "backend/migrations/20260206_add_remix_type_column.sql",
    );
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("📊 Running migration...");
    await client.query(migrationSQL);
    console.log("✅ Migration completed successfully!");

    client.release();
    await pool.end();

    console.log("");
    console.log("🚀 Videos should now load! Test at:");
    console.log("   https://zyeutev5-production.up.railway.app/api/posts/feed");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
