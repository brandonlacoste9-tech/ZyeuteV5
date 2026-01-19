-- GOLDEN LIBRARY SEED
-- Injecting high-quality starter content directly into the database
-- This ensures the feed feels alive even before the first user uploads.

DO $$
DECLARE
    sys_user_id UUID;
BEGIN
    -- 1. Get the system user (Ti-Guy or similar)
    SELECT id INTO sys_user_id FROM user_profiles WHERE username = 'ti_guy' LIMIT 1;
    
    -- Fallback to first user if ti_guy doesn't exist
    IF sys_user_id IS NULL THEN
        SELECT id INTO sys_user_id FROM user_profiles LIMIT 1;
    END IF;

    IF sys_user_id IS NOT NULL THEN
        -- 2. Insert Starter Videos (Direct Supabase Storage or stable public URLs)
        INSERT INTO publications (
            user_id, 
            content, 
            caption, 
            media_url, 
            processing_status, 
            hive_id, 
            visibility,
            reactions_count,
            created_at
        ) VALUES 
        (
            sys_user_id, 
            'Bienvenue sur Zyeuté! Le premier TikTok du Québec est arrivé. ⚜️', 
            'Bienvenue sur Zyeuté! ⚜️', 
            'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4', 
            'completed', 
            'quebec', 
            'public',
            150,
            NOW() - INTERVAL '1 hour'
        ),
        (
            sys_user_id, 
            'Ite missa est! Venez découvrir la culture d''ici. 🍁', 
            'Culture Québécoise 🍁', 
            'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', 
            'completed', 
            'quebec', 
            'public',
            85,
            NOW() - INTERVAL '2 hours'
        );
        
        RAISE NOTICE '✅ Golden Library Seeded successfully!';
    ELSE
        RAISE NOTICE '⚠️ No user found to attribute seed content to.';
    END IF;
END $$;
