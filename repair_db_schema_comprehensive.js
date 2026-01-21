import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  connectionString:
    "postgresql://postgres:kHDQJHWAPzxpUXQlXIsKwXPamtQPnwiU@trolley.proxy.rlwy.net:44815/railway",
  ssl: { rejectUnauthorized: false },
});

async function repairSchema() {
  const client = await pool.connect();
  try {
    console.log("⚙️ Starting COMPREHENSIVE Schema Repair...");

    // 1. Repair 'publications'
    console.log(" - Repairing 'publications' table...");
    await client.query(`
      ALTER TABLE "publications" 
      ADD COLUMN IF NOT EXISTS "location" text,
      ADD COLUMN IF NOT EXISTS "city" text,
      ADD COLUMN IF NOT EXISTS "region" text,
      ADD COLUMN IF NOT EXISTS "region_id" text,
      ADD COLUMN IF NOT EXISTS "reactions_count" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "comments_count" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "est_masque" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "visibility" text DEFAULT 'public',
      ADD COLUMN IF NOT EXISTS "hive_id" text DEFAULT 'quebec',
      ADD COLUMN IF NOT EXISTS "is_ephemeral" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "max_views" integer,
      ADD COLUMN IF NOT EXISTS "expires_at" timestamp,
      ADD COLUMN IF NOT EXISTS "burned_at" timestamp,
      ADD COLUMN IF NOT EXISTS "deleted_at" timestamp,
      ADD COLUMN IF NOT EXISTS "is_vaulted" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "ai_generated" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "viral_score" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "is_moderated" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "moderation_approved" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "moderation_score" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "moderated_at" timestamp,
      ADD COLUMN IF NOT EXISTS "ai_description" text,
      ADD COLUMN IF NOT EXISTS "ai_labels" jsonb DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS "content_fr" text,
      ADD COLUMN IF NOT EXISTS "content_en" text,
      ADD COLUMN IF NOT EXISTS "hashtags" text[] DEFAULT '{}'::text[],
      ADD COLUMN IF NOT EXISTS "detected_themes" text[] DEFAULT '{}'::text[],
      ADD COLUMN IF NOT EXISTS "detected_items" text[] DEFAULT '{}'::text[],
      ADD COLUMN IF NOT EXISTS "embedding" text,
      ADD COLUMN IF NOT EXISTS "last_embedded_at" timestamp;
    `);

    // 2. Repair 'user_profiles'
    console.log(" - Repairing 'user_profiles' table...");
    await client.query(`
      ALTER TABLE "user_profiles" 
      ADD COLUMN IF NOT EXISTS "location" text,
      ADD COLUMN IF NOT EXISTS "city" text,
      ADD COLUMN IF NOT EXISTS "region" text,
      ADD COLUMN IF NOT EXISTS "region_id" text,
      ADD COLUMN IF NOT EXISTS "hive_id" text DEFAULT 'quebec',
      ADD COLUMN IF NOT EXISTS "credits" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'citoyen',
      ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "is_premium" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "plan" text DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS "piasse_balance" double precision DEFAULT 0.0,
      ADD COLUMN IF NOT EXISTS "total_karma" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "subscription_tier" text DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS "ti_guy_comments_enabled" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "karma_credits" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "cash_credits" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "total_gifts_sent" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "total_gifts_received" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "legendary_badges" jsonb DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS "tax_id" text,
      ADD COLUMN IF NOT EXISTS "bee_alias" text,
      ADD COLUMN IF NOT EXISTS "nectar_points" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "current_streak" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "max_streak" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "last_daily_bonus" timestamp,
      ADD COLUMN IF NOT EXISTS "unlocked_hives" jsonb DEFAULT '["quebec"]'::jsonb,
      ADD COLUMN IF NOT EXISTS "parent_id" uuid,
      ADD COLUMN IF NOT EXISTS "custom_permissions" jsonb DEFAULT '{}'::jsonb;
    `);

    console.log("✅ COMPREHENSIVE Schema Repair Complete!");
  } catch (err) {
    console.error("❌ Schema Repair Failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

repairSchema();
