#!/usr/bin/env tsx
// Run all database migrations in chronological order
import { Pool } from "pg";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

async function runMigrations() {
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

  const client = await pool.connect();
  console.log("✅ Connected to database");

  try {
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _zyeute_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get list of already-applied migrations
    const applied = await client.query(
      "SELECT filename FROM _zyeute_migrations",
    );
    const appliedSet = new Set(applied.rows.map((r: any) => r.filename));

    // Read all SQL files from backend/migrations directory
    const migrationsDir = join(process.cwd(), "backend/migrations");
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort(); // Alphabetical = chronological (YYYYMMDD_ prefix)

    console.log(`\n📋 Found ${files.length} migration files`);

    let applied_count = 0;
    let skipped_count = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`   ⏭️  Skipping (already applied): ${file}`);
        skipped_count++;
        continue;
      }

      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, "utf-8");

      console.log(`   🔄 Running: ${file}`);
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          "INSERT INTO _zyeute_migrations (filename) VALUES ($1)",
          [file],
        );
        await client.query("COMMIT");
        console.log(`   ✅ Done: ${file}`);
        applied_count++;
      } catch (err: any) {
        await client.query("ROLLBACK");
        console.error(`   ❌ Failed: ${file} — ${err.message}`);
        // Continue with next migration (don't abort entire run)
      }
    }

    console.log(`\n🚀 Migration complete!`);
    console.log(`   Applied: ${applied_count}`);
    console.log(`   Skipped: ${skipped_count}`);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error("❌ Migration runner crashed:", err);
  process.exit(1);
});
