-- Diagnostic: Check what columns actually exist in the posts table
-- Run this in Supabase SQL Editor or Railway PostgreSQL console

-- 1. List all columns in the posts table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'posts'
ORDER BY ordinal_position;

-- 2. Check if specific critical columns exist
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'posts'
          AND column_name = 'content'
    ) THEN '✅ content column exists'
    ELSE '❌ content column MISSING (CRITICAL!)'
    END as content_status,

    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'posts'
          AND column_name = 'visibility'
    ) THEN '✅ visibility column exists'
    ELSE '❌ visibility column MISSING'
    END as visibility_status,

    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'posts'
          AND column_name = 'fire_count'
    ) THEN '✅ fire_count column exists'
    ELSE '❌ fire_count column MISSING'
    END as fire_count_status,

    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'posts'
          AND column_name = 'is_hidden'
    ) THEN '✅ is_hidden column exists'
    ELSE '❌ is_hidden column MISSING'
    END as is_hidden_status,

    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'posts'
          AND column_name = 'hive_id'
    ) THEN '✅ hive_id column exists'
    ELSE '❌ hive_id column MISSING'
    END as hive_id_status;

-- 3. Count total posts
SELECT COUNT(*) as total_posts FROM public.posts;

-- 4. Check for the legacy 'publications' table
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'publications'
    ) THEN '⚠️ Legacy "publications" table still exists (should be dropped)'
    ELSE '✅ No legacy "publications" table'
    END as publications_table_status;
