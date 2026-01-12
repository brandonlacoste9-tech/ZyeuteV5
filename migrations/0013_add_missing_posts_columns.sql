-- Migration: Add missing columns to posts table
-- Critical: The schema.ts expects these columns but they don't exist in the database
-- This will prevent 500 errors when creating posts

-- CRITICAL: Add content column (marked as .notNull() in schema)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content TEXT;

-- Add missing media processing columns
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS original_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS enhanced_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_metadata JSONB DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS mux_asset_id TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS mux_upload_id TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS promo_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS mux_playback_id TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS aspect_ratio TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS visual_filter TEXT DEFAULT 'none';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS enhance_started_at TIMESTAMP;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS enhance_finished_at TIMESTAMP;

-- Add missing location/geography columns
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS region_id TEXT;

-- Add missing AI/ML columns
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS last_embedded_at TIMESTAMP;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS transcription TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS transcribed_at TIMESTAMP;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS ai_description TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS ai_labels JSONB DEFAULT '[]';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content_fr TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content_en TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS detected_themes TEXT[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS detected_items TEXT[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS viral_score INTEGER DEFAULT 0;

-- Add missing moderation columns
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS safety_flags JSONB DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_moderated BOOLEAN DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_approved BOOLEAN DEFAULT true;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_score INTEGER DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;

-- Add missing hive column (this might already exist as 'region', but schema expects 'hive_id')
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hive_id TEXT DEFAULT 'quebec';

-- Add missing ephemeral/burn columns
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_ephemeral BOOLEAN DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS max_views INTEGER DEFAULT 1;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS burned_at TIMESTAMP;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_vaulted BOOLEAN DEFAULT false;

-- Add missing gift_count if it doesn't exist (it should from migration)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS gift_count INTEGER DEFAULT 0;

-- Update existing rows to have content = caption as a fallback (since content is required)
UPDATE public.posts SET content = COALESCE(caption, '') WHERE content IS NULL;

-- Now make content NOT NULL since schema expects it
ALTER TABLE public.posts ALTER COLUMN content SET NOT NULL;

-- Create indexes for performance on new columns
CREATE INDEX IF NOT EXISTS idx_posts_location ON public.posts USING gist(location);
CREATE INDEX IF NOT EXISTS idx_posts_region_created_at ON public.posts(region_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_hive_created_at ON public.posts(hive_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON public.posts(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_expires_at ON public.posts(expires_at) WHERE expires_at IS NOT NULL;
