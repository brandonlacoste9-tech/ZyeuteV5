-- Enable pgvector extension if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- PUBLICATIONS TABLE REPAIRS
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "region" text;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "region_id" text;

ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "last_embedded_at" timestamp;

ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "transcription" text;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "transcribed_at" timestamp;

ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "ai_description" text;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "ai_labels" jsonb DEFAULT '[]';
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "content_fr" text;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "content_en" text;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "hashtags" jsonb DEFAULT '[]';
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "detected_themes" jsonb DEFAULT '[]';
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "detected_items" jsonb DEFAULT '[]';

ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "ai_generated" boolean DEFAULT false;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "viral_score" integer DEFAULT 0;

ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "safety_flags" jsonb DEFAULT '[]';
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "is_moderated" boolean DEFAULT false;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "moderation_approved" boolean DEFAULT false;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "moderation_score" integer DEFAULT 0;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "moderated_at" timestamp;

ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "hive_id" text DEFAULT 'quebec';
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "is_ephemeral" boolean DEFAULT false;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "max_views" integer;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "expires_at" timestamp;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "burned_at" timestamp;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "is_vaulted" boolean DEFAULT false;

-- Visibility (ensure it exists as it was previous blocker)
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "visibility" text DEFAULT 'public';
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "reactions_count" integer DEFAULT 0;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "comments_count" integer DEFAULT 0;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "est_masque" boolean DEFAULT false;


-- USER_PROFILES TABLE REPAIRS
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "region" text;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user';
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "custom_permissions" jsonb DEFAULT '[]';
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT false;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "is_premium" boolean DEFAULT false;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "plan" text DEFAULT 'free';
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "credits" integer DEFAULT 0;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "piasse_balance" integer DEFAULT 0;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "total_karma" integer DEFAULT 0;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "subscription_tier" text DEFAULT 'free';
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "region_id" text;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "ti_guy_comments_enabled" boolean DEFAULT true;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "hive_id" text DEFAULT 'quebec';
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "karma_credits" integer DEFAULT 0;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "cash_credits" integer DEFAULT 0;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "total_gifts_sent" integer DEFAULT 0;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "total_gifts_received" integer DEFAULT 0;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "legendary_badges" jsonb DEFAULT '[]';
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "tax_id" text;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "bee_alias" text;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "nectar_points" integer DEFAULT 0;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "current_streak" integer DEFAULT 0;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "max_streak" integer DEFAULT 0;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "last_daily_bonus" timestamp;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "unlocked_hives" jsonb DEFAULT '[]';
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "parent_id" uuid;
