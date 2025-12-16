-- ============================================================================
-- PHASE 5: CLEANUP - Remove Legacy Session Tables
-- Drop Express Session Infrastructure
-- ============================================================================
-- Created: 2025-12-15
-- Purpose: Remove deprecated session storage tables after migrating to
--          100% Supabase JWT-based authentication
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Drop User Sessions Table (Express Session Store)
-- ----------------------------------------------------------------------------
-- This table was created by connect-pg-simple for storing Express sessions
-- Now that we use Supabase JWT authentication, it's no longer needed

DROP TABLE IF EXISTS "user_sessions" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;

-- Remove indexes if they exist
DROP INDEX IF EXISTS "IDX_session_expire";

-- ----------------------------------------------------------------------------
-- VERIFICATION: Confirm Tables Are Removed
-- ----------------------------------------------------------------------------
-- Run this query to verify the tables no longer exist

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_sessions', 'sessions');

-- Expected result: 0 rows (tables successfully dropped)

-- ----------------------------------------------------------------------------
-- CLEANUP NOTES
-- ----------------------------------------------------------------------------
-- ✅ Safe to run multiple times (uses IF EXISTS)
-- ✅ CASCADE ensures dependent objects are also dropped
-- ✅ No data loss - sessions were temporary (7-day cookies)
-- ✅ Frontend now uses Supabase JWT (stored in localStorage)
-- ✅ Backend verifies JWT via Authorization header

-- Impact:
-- - Reduces database table count by 2
-- - Frees up storage space (sessions accumulated over time)
-- - Removes technical debt from hybrid auth architecture
-- - Simplifies backup/restore procedures

-- Rollback (if needed):
-- If you need to restore session tables, they will be auto-created by
-- connect-pg-simple on server restart (if you re-add the middleware).
-- However, this is NOT recommended - stick with Supabase auth.
-- ----------------------------------------------------------------------------
