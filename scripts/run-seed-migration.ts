#!/usr/bin/env tsx
/**
 * Run Seed Migration Script
 * Executes migrations/0012_seed_initial_data.sql to populate database with Quebec posts
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

// Load environment variables from .env file
config({ path: join(__dirname, "../.env") });

// DATABASE_URL can come from .env file OR from environment variable (takes precedence)
const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  console.error("   Set DATABASE_URL or DIRECT_DATABASE_URL in .env file");
  process.exit(1);
}

async function runSeedMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log("🔗 Connecting to database...");
    await client.connect();
    console.log("✅ Connected to database\n");

    // Check if users exist first
    const userCheck = await client.query("SELECT COUNT(*) as count FROM user_profiles");
    const userCount = parseInt(userCheck.rows[0].count);

    if (userCount === 0) {
      console.log("⚠️  No users found in user_profiles table!");
      console.log("   The migration requires at least one user to exist.");
      console.log("   Please create a user account at https://www.zyeute.com/signup first.\n");
      await client.end();
      process.exit(1);
    }

    console.log(`✅ Found ${userCount} user(s) in database\n`);

    // Read migration file
    const migrationPath = join(__dirname, "../migrations/0012_seed_initial_data.sql");
    const sql = readFileSync(migrationPath, "utf-8");

    console.log("📄 Executing migration: 0012_seed_initial_data.sql");
    console.log("   This will insert 15 Quebec-themed posts into the publications table\n");

    // Execute the migration
    await client.query(sql);

    // Verify posts were inserted
    const postCheck = await client.query(
      "SELECT COUNT(*) as count FROM publications WHERE hive_id = 'quebec'"
    );
    const postCount = parseInt(postCheck.rows[0].count);

    console.log("\n✅ Migration completed successfully!");
    console.log(`📊 Found ${postCount} Quebec posts in publications table`);

    if (postCount >= 15) {
      console.log("🎉 Seed data populated successfully!");
    } else {
      console.log(`⚠️  Expected 15 posts, but found ${postCount}. Some may have already existed.`);
    }

    // Show sample posts
    const samplePosts = await client.query(
      "SELECT id, content, created_at FROM publications WHERE hive_id = 'quebec' ORDER BY created_at DESC LIMIT 5"
    );

    if (samplePosts.rows.length > 0) {
      console.log("\n📝 Sample posts:");
      samplePosts.rows.forEach((post, index) => {
        const content = post.content.substring(0, 60) + (post.content.length > 60 ? "..." : "");
        console.log(`   ${index + 1}. ${content}`);
      });
    }

  } catch (error: any) {
    console.error("\n❌ Migration failed:", error.message);
    if (error.code === "ENOENT") {
      console.error("   Migration file not found. Make sure migrations/0012_seed_initial_data.sql exists.");
    } else if (error.message.includes("relation") && error.message.includes("does not exist")) {
      console.error("   Database tables don't exist. Please run schema migrations first.");
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n🔌 Database connection closed");
  }
}

runSeedMigration();
