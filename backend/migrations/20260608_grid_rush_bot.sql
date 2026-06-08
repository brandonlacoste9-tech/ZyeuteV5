-- Grid Rush bot support (startup runner copy — mirrors migrations/0020_grid_rush_bot.sql)

ALTER TABLE grid_rush_matches
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false NOT NULL;
