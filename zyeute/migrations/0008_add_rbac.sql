-- Add role type enum
CREATE TYPE user_role AS ENUM ('visitor', 'citoyen', 'moderator', 'founder');

-- Add role column to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN role user_role DEFAULT 'citoyen';

-- Update existing users
UPDATE user_profiles SET role = 'citoyen' WHERE role IS NULL;
UPDATE user_profiles SET role = 'founder' WHERE is_admin = true;

-- Add permissions column for granular overrides (optional, good for "Access Tokens")
ALTER TABLE user_profiles
ADD COLUMN custom_permissions JSONB DEFAULT '{}'::jsonb;
