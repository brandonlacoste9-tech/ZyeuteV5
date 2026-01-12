-- Diagnostic Script: Check Database Column State
-- Purpose: Verify which columns exist/missing in publications table
-- Run this BEFORE and AFTER migration to confirm changes

-- ============================================
-- 1. Check Critical Required Columns
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN ('content', 'hive_id', 'mux_asset_id') THEN '⚠️ CRITICAL'
    WHEN column_name IN ('embedding', 'transcription', 'is_ephemeral') THEN '✅ IMPORTANT'
    ELSE 'ℹ️ OPTIONAL'
  END as priority
FROM information_schema.columns 
WHERE table_name = 'publications' 
AND column_name IN (
  -- Critical (will cause 500 errors if missing)
  'content',
  'hive_id',
  
  -- Mux Video Processing
  'mux_asset_id',
  'mux_upload_id',
  'mux_playback_id',
  'processing_status',
  'duration',
  'aspect_ratio',
  
  -- AI/ML
  'embedding',
  'transcription',
  'ai_description',
  'ai_labels',
  'viral_score',
  
  -- Moderation
  'is_moderated',
  'moderation_approved',
  'safety_flags',
  
  -- Ephemeral/Burn
  'is_ephemeral',
  'is_vaulted',
  'expires_at',
  'max_views',
  
  -- Location
  'location',
  'city',
  'region_id'
)
ORDER BY 
  CASE 
    WHEN column_name IN ('content', 'hive_id', 'mux_asset_id') THEN 1
    WHEN column_name IN ('embedding', 'transcription', 'is_ephemeral') THEN 2
    ELSE 3
  END,
  column_name;

-- ============================================
-- 2. Check for French Column Names (Old Schema)
-- ============================================
SELECT 
  column_name,
  '⚠️ FRENCH COLUMN NAME - May need renaming' as warning
FROM information_schema.columns 
WHERE table_name = 'publications' 
AND column_name IN (
  'visibilite',      -- Should be 'visibility'
  'reactions_count', -- Should be 'fire_count'
  'comments_count',  -- Should be 'comment_count'
  'est_masque'       -- Should be 'is_hidden'
);

-- ============================================
-- 3. Check Indexes
-- ============================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'publications'
AND indexname LIKE 'idx_publications%'
ORDER BY indexname;

-- ============================================
-- 4. Check PostGIS Extension (for geography columns)
-- ============================================
SELECT 
  extname,
  extversion
FROM pg_extension 
WHERE extname = 'postgis';

-- ============================================
-- 5. Check pgvector Extension (for embeddings)
-- ============================================
SELECT 
  extname,
  extversion
FROM pg_extension 
WHERE extname = 'vector';

-- ============================================
-- 6. Check Hive ID Enum Type
-- ============================================
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'hive_id'
ORDER BY e.enumsortorder;

-- ============================================
-- 7. Sample Data Check (Verify content column has data)
-- ============================================
SELECT 
  COUNT(*) as total_posts,
  COUNT(content) as posts_with_content,
  COUNT(*) - COUNT(content) as posts_missing_content
FROM publications;

-- ============================================
-- 8. Expected vs Actual Column Count
-- ============================================
SELECT 
  COUNT(*) as total_columns_in_publications
FROM information_schema.columns 
WHERE table_name = 'publications';

-- Expected: ~50+ columns (based on schema.ts)
-- If less than 30, migration likely incomplete
