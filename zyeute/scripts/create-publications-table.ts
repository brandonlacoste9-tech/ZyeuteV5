#!/usr/bin/env tsx
/**
 * Create Publications Table
 * Creates the publications table that matches the schema and seed migration
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";
import { config } from "dotenv";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}

async function createPublicationsTable() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Check if publications table already exists
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'publications'
      );
    `);

    if (checkTable.rows[0].exists) {
      console.log("⚠️  Publications table already exists. Skipping creation.");
      await client.end();
      return;
    }

    console.log("📄 Creating publications table...\n");

    // Create hive_id enum if it doesn't exist
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE hive_id AS ENUM('quebec', 'brazil', 'argentina', 'mexico');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create publications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS publications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        caption TEXT,
        media_url TEXT,
        visibilite TEXT DEFAULT 'public',
        hive_id hive_id DEFAULT 'quebec',
        region_id TEXT,
        reactions_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        est_masque BOOLEAN DEFAULT false,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS publications_user_id_idx ON publications(user_id);
      CREATE INDEX IF NOT EXISTS publications_created_at_idx ON publications(created_at);
      CREATE INDEX IF NOT EXISTS publications_hive_id_idx ON publications(hive_id);
      CREATE INDEX IF NOT EXISTS publications_region_id_idx ON publications(region_id);
    `);

    console.log("✅ Publications table created successfully!");
    console.log("📊 Table is ready for seed data\n");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createPublicationsTable();
