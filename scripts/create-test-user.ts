#!/usr/bin/env tsx
/**
 * Create Test User
 * Creates a test user account for seed data migration
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";
import { config } from "dotenv";
import { randomUUID } from "crypto";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}

async function createTestUser() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Check if users already exist
    const userCheck = await client.query("SELECT COUNT(*) as count FROM user_profiles");
    const userCount = parseInt(userCheck.rows[0].count);

    if (userCount > 0) {
      console.log(`✅ Found ${userCount} existing user(s). No need to create test user.`);
      const users = await client.query("SELECT id, username FROM user_profiles LIMIT 3");
      console.log("\n📋 Existing users:");
      users.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.id})`);
      });
      await client.end();
      return;
    }

    console.log("📝 Creating test user for seed data...\n");

    const userId = randomUUID();
    const testUser = {
      id: userId,
      username: "test_user_quebec",
      email: "test@zyeute.quebec",
      display_name: "Test User Québec",
      bio: "Test account for Zyeuté seed data",
      region: "quebec",
    };

    await client.query(
      `INSERT INTO user_profiles (id, username, email, display_name, bio, region, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (username) DO NOTHING`,
      [
        testUser.id,
        testUser.username,
        testUser.email,
        testUser.display_name,
        testUser.bio,
        testUser.region,
      ]
    );

    console.log("✅ Test user created successfully!");
    console.log(`   Username: ${testUser.username}`);
    console.log(`   ID: ${testUser.id}\n`);

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.code === "23505") {
      console.error("   User already exists. This is okay!");
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestUser();
