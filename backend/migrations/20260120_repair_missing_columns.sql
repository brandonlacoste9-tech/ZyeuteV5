/* Safe Schema Repair Migration */

-- 1. Ensure Hive Enum Exists
DO $$ BEGIN
    CREATE TYPE hive_id AS ENUM('quebec', 'brazil', 'argentina', 'mexico', 'france', 'usa');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Repair Publications Table Columns
ALTER TABLE publications ADD COLUMN IF NOT EXISTS reactions_count INTEGER DEFAULT 0;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS est_masque BOOLEAN DEFAULT FALSE;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS hive_id hive_id DEFAULT 'quebec';
ALTER TABLE publications ADD COLUMN IF NOT EXISTS viral_score INTEGER DEFAULT 0;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS moderation_score INTEGER DEFAULT 0;

-- 3. Ensure User Columns for Gamification (just in case)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nectar_points INTEGER DEFAULT 0;
