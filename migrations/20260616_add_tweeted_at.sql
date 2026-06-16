-- Add tweeted_at to publications table for Twitter Bot
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "tweeted_at" timestamp;
