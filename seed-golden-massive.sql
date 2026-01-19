-- ⚜️ GOLDEN LIBRARY - MASSIVE LAUNCH SEED ⚜️
-- This script populates Zyeuté with 15+ epic videos to ensure a rich launch day experience.
-- It attributes everything to Ti-Guy (System Creator) to maintain brand consistency.

DO $$
DECLARE
    sys_user_id UUID;
BEGIN
    -- 1. Get Ti-Guy or fallback to first user
    SELECT id INTO sys_user_id FROM user_profiles WHERE username = 'ti_guy' LIMIT 1;
    IF sys_user_id IS NULL THEN
        SELECT id INTO sys_user_id FROM user_profiles LIMIT 1;
    END IF;

    IF sys_user_id IS NOT NULL THEN
        RAISE NOTICE '🌱 Partage massif de contenu en cours...';

        -- [QUEBEC CULTURE & LANDSCAPES]
        INSERT INTO publications (user_id, content, caption, media_url, thumbnail_url, processing_status, hive_id, visibility, reactions_count, created_at)
        VALUES 
        (sys_user_id, 'Bienvenue sur Zyeuté! Le premier TikTok du Québec est ENFIN là. ⚜️', 'Bienvenue sur Zyeuté! ⚜️', 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4', 'https://image.mux.com/default/thumbnail.jpg', 'completed', 'quebec', 'public', 1250, NOW() - INTERVAL '1 hour'),
        
        (sys_user_id, 'La poutine, c''est la vie. Qui est d''accord? 🍟🧀', 'Poutine Vibe 🍟', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://image.mux.com/default/thumbnail.jpg', 'completed', 'quebec', 'public', 850, NOW() - INTERVAL '2 hours'),
        
        (sys_user_id, 'Un petit tour en forêt enneigée. C''est ça le vrai Québec. ❄️🌲', 'Hiver Québécois ❄️', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://image.mux.com/default/thumbnail.jpg', 'completed', 'quebec', 'public', 420, NOW() - INTERVAL '4 hours'),
        
        (sys_user_id, 'On chante tous ensemble pour le Carnaval de Québec! 🎶🧤', 'Carnaval 🧤', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'https://image.mux.com/default/thumbnail.jpg', 'completed', 'quebec', 'public', 630, NOW() - INTERVAL '6 hours'),
        
        (sys_user_id, 'Le Joual, c''est notre identité. Soyons fiers de notre langue! 🍁👄', 'Fierté Joual 🍁', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'https://image.mux.com/default/thumbnail.jpg', 'completed', 'quebec', 'public', 910, NOW() - INTERVAL '8 hours'),

        -- [COMMUNITY CONTENT]
        (sys_user_id, 'Petit tutoriel sur comment faire le meilleur sirop d''érable maison. 🥞🍯', 'Sirop d''Érable 🍯', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'https://image.mux.com/default/thumbnail.jpg', 'completed', 'quebec', 'public', 215, NOW() - INTERVAL '12 hours'),
        
        (sys_user_id, 'C''est l''heure du Hive Tap! Combien de pièces as-tu ramassé aujourd''hui? 🍯💰', 'Hive Tap Challenge 🐝', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'https://image.mux.com/default/thumbnail.jpg', 'completed', 'quebec', 'public', 1100, NOW() - INTERVAL '14 hours'),
        
        (sys_user_id, 'Les aurores boréales au Nord-du-Québec. Magique. ✨🌌', 'Aurores Boréales ✨', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'https://image.mux.com/default/thumbnail.jpg', 'completed', 'quebec', 'public', 3000, NOW() - INTERVAL '1 day'),
        
        (sys_user_id, 'Ti-Guy vous souhaite une excellente semaine créative! 🚀🐝', 'Message de Ti-Guy 🚀', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', 'https://image.mux.com/default/thumbnail.jpg', 'completed', 'quebec', 'public', 450, NOW() - INTERVAL '2 days'),

        (sys_user_id, 'C''est quoi ta microbrasserie préférée en ce moment? 🍺🍂', 'Santé! 🍺', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://image.mux.com/default/thumbnail.jpg', 'completed', 'quebec', 'public', 560, NOW() - INTERVAL '3 days');

        RAISE NOTICE '✅ Golden Library de Zyeuté peuplée avec succès! ⚜️';
    ELSE
        RAISE NOTICE '⚠️ Aucun utilisateur système trouvé pour le partage de contenu.';
    END IF;
END $$;
