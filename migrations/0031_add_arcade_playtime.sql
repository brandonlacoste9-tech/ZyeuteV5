-- Migration: Add arcade_playtime to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS arcade_playtime INTEGER DEFAULT 0;
