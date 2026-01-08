-- ============================================================================
-- PHASE 2: ADMIN ACCESS MIGRATION
-- Grant Admin Privileges via Supabase User Metadata
-- ============================================================================
-- Created: 2025-12-15
-- Purpose: Migrate admin access control from Express sessions to Supabase
--          user metadata for the new authentication architecture
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Grant Admin Access to Specific User
-- ----------------------------------------------------------------------------
-- INSTRUCTION: Replace 'your-email@example.com' with your actual admin email
-- This updates the user_metadata to include the is_admin flag

UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT 
  id,
  email,
  raw_user_meta_data->>'is_admin' as is_admin,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com';

-- ----------------------------------------------------------------------------
-- STEP 2 (OPTIONAL): Grant Admin to First Registered User
-- ----------------------------------------------------------------------------
-- Uncomment this if you want the first user to automatically be admin

-- UPDATE auth.users
-- SET raw_user_meta_data = 
--   COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
-- WHERE id = (
--   SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
-- );

-- ----------------------------------------------------------------------------
-- STEP 3 (OPTIONAL): Create Admin Role Function
-- ----------------------------------------------------------------------------
-- This function allows you to programmatically grant/revoke admin access

CREATE OR REPLACE FUNCTION public.set_user_admin_status(
  user_email TEXT,
  is_admin BOOLEAN
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) 
    || jsonb_build_object('is_admin', is_admin)
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$;

-- Usage examples:
-- SELECT public.set_user_admin_status('admin@example.com', true);  -- Grant admin
-- SELECT public.set_user_admin_status('user@example.com', false);  -- Revoke admin

-- ----------------------------------------------------------------------------
-- STEP 4 (OPTIONAL): List All Admin Users
-- ----------------------------------------------------------------------------
-- Query to see all users with admin privileges

SELECT 
  id,
  email,
  raw_user_meta_data->>'is_admin' as is_admin,
  raw_app_meta_data->>'role' as app_role,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE 
  raw_user_meta_data->>'is_admin' = 'true'
  OR raw_app_meta_data->>'role' = 'admin'
  OR raw_app_meta_data->>'role' = 'service_role'
ORDER BY created_at ASC;

-- ----------------------------------------------------------------------------
-- VERIFICATION CHECKLIST
-- ----------------------------------------------------------------------------
-- [ ] Replace email in STEP 1 with your actual email
-- [ ] Run STEP 1 query to grant yourself admin access
-- [ ] Run verification query to confirm is_admin = true
-- [ ] (Optional) Run STEP 3 to create the helper function
-- [ ] Test by logging into /admin route in the application
-- [ ] Check browser console for: "[Admin] Admin status confirmed via Supabase"
-- ----------------------------------------------------------------------------
