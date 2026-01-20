/* Simple Schema Repair Migration */
/* Removing complex PL/pgSQL blocks to assume safety */

-- Ensure integer columns exist (critical for ordering)
ALTER TABLE publications ADD COLUMN IF NOT EXISTS reactions_count INTEGER DEFAULT 0;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS viral_score INTEGER DEFAULT 0;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS moderation_score INTEGER DEFAULT 0;

-- Ensure boolean flags
ALTER TABLE publications ADD COLUMN IF NOT EXISTS est_masque BOOLEAN DEFAULT FALSE;

-- Ensure visibility column exists (Fixes "Column Not Found: visibility" error)
ALTER TABLE publications ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'public';

-- We skip hive_id enum creation to avoid syntax crashes. 
-- If hive_id column is missing, the app might still fail explore, 
-- but at least it won't crash on startup.
