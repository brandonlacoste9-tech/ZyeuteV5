-- Migration: Seed Initial Data for Zyeuté
-- Created: 2025-12-31
-- Purpose: Populate database with sample Quebec-themed posts for testing

-- This migration inserts sample posts into the publications table
-- It uses existing users from user_profiles table
-- If no users exist, the inserts will be skipped (WHERE clause check)

-- Note: This migration assumes at least one user exists in user_profiles
-- If no users exist, create users first through the auth system or run backend/seed.ts

-- Insert sample Quebec-themed posts
-- These posts will appear in the feed and discover pages

-- Only insert if users exist
DO $$
DECLARE
  first_user_id UUID;
  second_user_id UUID;
  third_user_id UUID;
  user_count INTEGER;
BEGIN
  -- Check if users exist
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  
  IF user_count = 0 THEN
    RAISE NOTICE 'No users found in user_profiles. Skipping post creation. Please create users first.';
    RETURN;
  END IF;
  
  -- Get user IDs (cycle through available users)
  SELECT id INTO first_user_id FROM user_profiles ORDER BY created_at LIMIT 1;
  SELECT id INTO second_user_id FROM user_profiles ORDER BY created_at LIMIT 1 OFFSET LEAST(1, user_count - 1);
  SELECT id INTO third_user_id FROM user_profiles ORDER BY created_at LIMIT 1 OFFSET LEAST(2, user_count - 1);
  
  -- Use first user if we don't have enough users
  IF second_user_id IS NULL THEN
    second_user_id := first_user_id;
  END IF;
  IF third_user_id IS NULL THEN
    third_user_id := first_user_id;
  END IF;

  -- Insert sample posts
  INSERT INTO "publications" (
    "id",
    "user_id",
    "content",
    "caption",
    "media_url",
    "visibility",
    "hive_id",
    "region_id",
    "reactions_count",
    "comments_count",
    "est_masque",
    "deleted_at",
    "created_at"
  ) VALUES
  -- Post 1: Welcome to Zyeuté
  (
    gen_random_uuid(),
    first_user_id,
    'Bienvenue sur Zyeuté! L''app sociale du Québec 🔥⚜️ Rejoins la communauté québécoise!',
    'Bienvenue sur Zyeuté! L''app sociale du Québec 🔥⚜️ Rejoins la communauté québécoise!',
    'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?w=800',
    'public',
    'quebec',
    'montreal',
    156,
    12,
    false,
    NULL,
    NOW() - INTERVAL '2 days'
  ),
  -- Post 2: Montreal Old Port
  (
    gen_random_uuid(),
    second_user_id,
    'Le vieux port de Montréal au coucher du soleil 🌅 C''est tellement beau! #Montreal #Quebec',
    'Le vieux port de Montréal au coucher du soleil 🌅 C''est tellement beau! #Montreal #Quebec',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'public',
    'quebec',
    'montreal',
    89,
    5,
    false,
    NULL,
    NOW() - INTERVAL '1 day'
  ),
  -- Post 3: Château Frontenac
  (
    gen_random_uuid(),
    third_user_id,
    'Le Château Frontenac, toujours aussi majestueux! 🏰 #patrimoine #Quebec',
    'Le Château Frontenac, toujours aussi majestueux! 🏰 #patrimoine #Quebec',
    'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800',
    'public',
    'quebec',
    'quebec',
    234,
    18,
    false,
    NULL,
    NOW() - INTERVAL '3 days'
  ),
  -- Post 4: Poutine
  (
    gen_random_uuid(),
    first_user_id,
    'La meilleure poutine de Montréal! 🍟🧀 #Poutine #Montreal #Food',
    'La meilleure poutine de Montréal! 🍟🧀 #Poutine #Montreal #Food',
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800',
    'public',
    'quebec',
    'montreal',
    312,
    24,
    false,
    NULL,
    NOW() - INTERVAL '4 hours'
  ),
  -- Post 5: Mont-Royal
  (
    gen_random_uuid(),
    second_user_id,
    'Randonnée au Mont-Royal avec une vue incroyable! 🏔️ #Montreal #Nature',
    'Randonnée au Mont-Royal avec une vue incroyable! 🏔️ #Montreal #Nature',
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
    'public',
    'quebec',
    'montreal',
    145,
    8,
    false,
    NULL,
    NOW() - INTERVAL '6 hours'
  ),
  -- Post 6: Hockey
  (
    gen_random_uuid(),
    third_user_id,
    'Go Habs Go! 🏒⚜️ Le hockey, c''est dans notre sang! #Hockey #Canadiens #Quebec',
    'Go Habs Go! 🏒⚜️ Le hockey, c''est dans notre sang! #Hockey #Canadiens #Quebec',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800',
    'public',
    'quebec',
    'montreal',
    567,
    45,
    false,
    NULL,
    NOW() - INTERVAL '12 hours'
  ),
  -- Post 7: Festival
  (
    gen_random_uuid(),
    first_user_id,
    'Juste du plaisir au Festival de Jazz de Montréal! 🎵🎷 #Festival #Montreal #Music',
    'Juste du plaisir au Festival de Jazz de Montréal! 🎵🎷 #Festival #Montreal #Music',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    'public',
    'quebec',
    'montreal',
    278,
    19,
    false,
    NULL,
    NOW() - INTERVAL '8 hours'
  ),
  -- Post 8: Maple Syrup
  (
    gen_random_uuid(),
    second_user_id,
    'Cabane à sucre traditionnelle! Le sirop d''érable, c''est notre or! 🍁 #MapleSyrup #Quebec',
    'Cabane à sucre traditionnelle! Le sirop d''érable, c''est notre or! 🍁 #MapleSyrup #Quebec',
    'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800',
    'public',
    'quebec',
    'quebec',
    189,
    14,
    false,
    NULL,
    NOW() - INTERVAL '5 days'
  ),
  -- Post 9: Winter in Quebec
  (
    gen_random_uuid(),
    third_user_id,
    'L''hiver québécois dans toute sa splendeur! ❄️⛄ #Winter #Quebec',
    'L''hiver québécois dans toute sa splendeur! ❄️⛄ #Winter #Quebec',
    'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e8?w=800',
    'public',
    'quebec',
    'quebec',
    423,
    32,
    false,
    NULL,
    NOW() - INTERVAL '6 days'
  ),
  -- Post 10: St. Lawrence River
  (
    gen_random_uuid(),
    first_user_id,
    'Le fleuve Saint-Laurent, notre fierté! 🌊 #StLawrence #Quebec #Nature',
    'Le fleuve Saint-Laurent, notre fierté! 🌊 #StLawrence #Quebec #Nature',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    'public',
    'quebec',
    'quebec',
    298,
    21,
    false,
    NULL,
    NOW() - INTERVAL '3 hours'
  ),
  -- Post 11: Quebec City
  (
    gen_random_uuid(),
    second_user_id,
    'Les rues pavées de la vieille ville de Québec! 🏛️ #QuebecCity #History',
    'Les rues pavées de la vieille ville de Québec! 🏛️ #QuebecCity #History',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    'public',
    'quebec',
    'quebec',
    167,
    11,
    false,
    NULL,
    NOW() - INTERVAL '7 hours'
  ),
  -- Post 12: Poutine Varieties
  (
    gen_random_uuid(),
    third_user_id,
    'Découvrez les différentes variétés de poutine! 🍟🧀 #Poutine #Food #Quebec',
    'Découvrez les différentes variétés de poutine! 🍟🧀 #Poutine #Food #Quebec',
    'https://images.unsplash.com/photo-1526234362653-3b75a0c074bf?w=800',
    'public',
    'quebec',
    'montreal',
    445,
    28,
    false,
    NULL,
    NOW() - INTERVAL '10 hours'
  ),
  -- Post 13: Montreal Metro
  (
    gen_random_uuid(),
    first_user_id,
    'Le métro de Montréal, notre réseau souterrain! 🚇 #Montreal #Metro',
    'Le métro de Montréal, notre réseau souterrain! 🚇 #Montreal #Metro',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
    'public',
    'quebec',
    'montreal',
    134,
    9,
    false,
    NULL,
    NOW() - INTERVAL '1 day'
  ),
  -- Post 14: Quebec Flag
  (
    gen_random_uuid(),
    second_user_id,
    'Notre drapeau, notre fierté! ⚜️🇨🇦 #Quebec #FleurDeLys',
    'Notre drapeau, notre fierté! ⚜️🇨🇦 #Quebec #FleurDeLys',
    'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800',
    'public',
    'quebec',
    'quebec',
    678,
    52,
    false,
    NULL,
    NOW() - INTERVAL '2 hours'
  ),
  -- Post 15: Laval
  (
    gen_random_uuid(),
    third_user_id,
    'Belle journée à Laval! 🌸 #Laval #Quebec',
    'Belle journée à Laval! 🌸 #Laval #Quebec',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    'public',
    'quebec',
    'laval',
    98,
    6,
    false,
    NULL,
    NOW() - INTERVAL '9 hours'
  )
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Successfully inserted seed posts into publications table';
END $$;
