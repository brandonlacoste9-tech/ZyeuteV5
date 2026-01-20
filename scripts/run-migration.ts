#!/usr/bin/env tsx
/**
 * Migration Runner
 * Executes all *.sql files in the backend/migrations folder in alphabetical order.
 * Intended to be run locally or as part of Railway's pre‑deploy step.
 */
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

// Load .env (Railway injects env vars, but local dev may need .env file)
config({ path: join(__dirname, "..", ".env") });

const DATABASE_URL =
  process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set – cannot run migrations");
  process.exit(1);
}

const maskedUrl = DATABASE_URL.replace(/:[^:@]*@/, ":****@");
console.log(`🔌 Connecting to database at ${maskedUrl}`);

async function runMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const migrationsDir = join(__dirname, "..", "backend", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort(); // alphabetical = chronological

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    console.log(`▶️ Executing migration ${file}`);
    try {
      await client.query(sql);
    } catch (e) {
      console.error(`❌ Migration ${file} failed:`, e);
      await client.end();
      process.exit(1);
    }
  }
  await client.end();
  console.log("✅ All migrations applied successfully");
}

runMigrations().catch((e) => {
  console.error("❌ Unexpected error:", e);
  process.exit(1);
});
