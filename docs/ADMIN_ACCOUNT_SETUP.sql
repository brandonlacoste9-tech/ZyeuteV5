-- Grant founder/moderator access for Zyeuté admin surfaces.
-- Run once in Supabase SQL Editor (founder: zyeutequebec@gmail.com).

-- 1) Profile role (backend requireModerator + frontend AuthContext)
UPDATE user_profiles
SET role = 'founder', is_admin = true
WHERE email = 'zyeutequebec@gmail.com';

-- 2) Supabase auth metadata (frontend checkIsAdmin fallback)
UPDATE auth.users
SET raw_user_meta_data =
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_admin": true, "role": "founder"}'::jsonb
WHERE email = 'zyeutequebec@gmail.com';

-- Verify
SELECT id, email, role, is_admin FROM user_profiles WHERE is_admin = true OR role IN ('founder', 'moderator');
