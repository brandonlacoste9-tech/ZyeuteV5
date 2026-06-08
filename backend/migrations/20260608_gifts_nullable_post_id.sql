-- Allow gifts without a post (e.g. live stream gifts)
ALTER TABLE gifts ALTER COLUMN post_id DROP NOT NULL;
