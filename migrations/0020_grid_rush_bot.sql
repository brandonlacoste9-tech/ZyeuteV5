-- Grid Rush: bot opponent support (solo testing vs simulated player)
-- Created: 2026-06-08

BEGIN;

ALTER TABLE grid_rush_matches
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false NOT NULL;

COMMIT;
