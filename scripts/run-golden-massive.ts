#!/usr/bin/env tsx
/**
 * Run Golden Massive Seed Script
 * Executes seed-golden-massive.sql to populate Zyeuté with epic Quebec content
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

async function runGoldenSeed() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log("🔗 Connecting to database...");
    await client.connect();
    
    // Check for user
    const userCheck = await client.query("SELECT id FROM user_profiles LIMIT 1");
    if (userCheck.rows.length === 0) {
      console.log("⚠️ No users found. Seed requires at least one user.");
      await client.end();
      return;
    }

    const sql = readFileSync(join(__dirname, "../seed-golden-massive.sql"), "utf-8");
    console.log("📄 Executing Golden Massive Seed...");
    await client.query(sql);
    console.log("✅ Seed completed successfully! ⚜️");

  } catch (error: any) {
    console.error("❌ Seed failed:", error.message);
  } finally {
    await client.end();
  }
}

runGoldenSeed();
