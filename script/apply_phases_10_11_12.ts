import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPhases10to12() {
    console.log('🚀 Applying Phases 10-12: Push, Offline, Analytics...');

    const sqlCommands = `
    -- ============================================
    -- PHASE 10: PUSH NOTIFICATIONS
    -- ============================================
    
    -- 1. Device tokens table
    CREATE TABLE IF NOT EXISTS public.poussoirs_appareils (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
      device_token text NOT NULL,
      platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now() NOT NULL,
      last_used_at timestamptz DEFAULT now(),
      UNIQUE(user_id, device_token)
    );

    CREATE INDEX IF NOT EXISTS idx_push_devices_user_id ON public.poussoirs_appareils(user_id);
    CREATE INDEX IF NOT EXISTS idx_push_devices_active ON public.poussoirs_appareils(is_active) WHERE is_active = true;

    -- 2. Notification queue table
    CREATE TABLE IF NOT EXISTS public.notification_queue (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
      title text NOT NULL,
      body text NOT NULL,
      data jsonb,
      status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
      sent_at timestamptz,
      created_at timestamptz DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON public.notification_queue(user_id);

    -- 3. Function to queue notification on "Fire"
    CREATE OR REPLACE FUNCTION public.queue_fire_notification()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_post_author uuid;
      v_liker_username text;
    BEGIN
      -- Get the post author
      SELECT user_id INTO v_post_author FROM public.publications WHERE id = NEW.publication_id;
      
      -- Get the liker's username
      SELECT username INTO v_liker_username FROM public.user_profiles WHERE id = NEW.user_id;
      
      -- Don't notify if user liked their own post
      IF v_post_author = NEW.user_id THEN
        RETURN NEW;
      END IF;
      
      -- Queue notification
      INSERT INTO public.notification_queue (user_id, title, body, data)
      VALUES (
        v_post_author,
        'Nouveau feu! 🔥',
        v_liker_username || ' a mis le feu à ta publication',
        jsonb_build_object('type', 'fire', 'publication_id', NEW.publication_id, 'from_user_id', NEW.user_id)
      );
      
      RETURN NEW;
    END;
    $$;

    DROP TRIGGER IF EXISTS trigger_fire_notification ON public.reactions;
    CREATE TRIGGER trigger_fire_notification
      AFTER INSERT ON public.reactions
      FOR EACH ROW
      WHEN (NEW.deleted_at IS NULL)
      EXECUTE FUNCTION public.queue_fire_notification();

    -- 4. Function to queue notification on Comment
    CREATE OR REPLACE FUNCTION public.queue_comment_notification()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_post_author uuid;
      v_commenter_username text;
    BEGIN
      -- Get the post author
      SELECT user_id INTO v_post_author FROM public.publications WHERE id = NEW.publication_id;
      
      -- Get commenter's username
      SELECT username INTO v_commenter_username FROM public.user_profiles WHERE id = NEW.user_id;
      
      -- Don't notify if user commented on their own post
      IF v_post_author = NEW.user_id THEN
        RETURN NEW;
      END IF;
      
      -- Queue notification
      INSERT INTO public.notification_queue (user_id, title, body, data)
      VALUES (
        v_post_author,
        'Nouveau commentaire 💬',
        v_commenter_username || ' a commenté ta publication',
        jsonb_build_object('type', 'comment', 'publication_id', NEW.publication_id, 'from_user_id', NEW.user_id, 'comment_id', NEW.id)
      );
      
      RETURN NEW;
    END;
    $$;

    DROP TRIGGER IF EXISTS trigger_comment_notification ON public.commentaires;
    CREATE TRIGGER trigger_comment_notification
      AFTER INSERT ON public.commentaires
      FOR EACH ROW
      EXECUTE FUNCTION public.queue_comment_notification();

    -- ============================================
    -- PHASE 11: OFFLINE SYNC (Database Support)
    -- ============================================
    
    -- 1. Offline actions queue (client will sync these)
    CREATE TABLE IF NOT EXISTS public.offline_actions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
      action_type text NOT NULL, -- 'fire', 'comment', 'follow', etc.
      target_id uuid,
      payload jsonb,
      status text DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed')),
      created_at timestamptz DEFAULT now() NOT NULL,
      synced_at timestamptz
    );

    CREATE INDEX IF NOT EXISTS idx_offline_actions_user_status ON public.offline_actions(user_id, status);

    -- ============================================
    -- PHASE 12: ADVANCED ANALYTICS & ML
    -- ============================================
    
    -- 1. User interactions tracking
    CREATE TABLE IF NOT EXISTS public.user_interactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
      publication_id uuid REFERENCES public.publications(id) ON DELETE SET NULL,
      interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'skip', 'fire', 'comment', 'share', 'profile_visit')),
      duration int, -- milliseconds for views
      metadata jsonb,
      created_at timestamptz DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.user_interactions(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_interactions_publication_id ON public.user_interactions(publication_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_type ON public.user_interactions(interaction_type);

    -- 2. Trending score calculation view
    CREATE OR REPLACE VIEW public.trending_dashboard AS
    SELECT 
      p.id,
      p.caption,
      p.region_id,
      p.created_at,
      p.reactions_count,
      p.comments_count,
      COUNT(DISTINCT ui.user_id) as unique_viewers,
      AVG(ui.duration) as avg_view_duration,
      (
        p.reactions_count * 3 + 
        p.comments_count * 5 + 
        COUNT(DISTINCT ui.user_id) * 1 +
        (CASE WHEN AVG(ui.duration) > 5000 THEN 2 ELSE 0 END)
      ) as trending_score
    FROM public.publications p
    LEFT JOIN public.user_interactions ui ON ui.publication_id = p.id AND ui.interaction_type = 'view'
    WHERE p.deleted_at IS NULL 
      AND p.est_masque = false
      AND p.created_at > now() - interval '7 days'
    GROUP BY p.id
    ORDER BY trending_score DESC;

    -- 3. User affinity model (simple collaborative filtering)
    CREATE OR REPLACE VIEW public.user_affinities AS
    SELECT 
      ui1.user_id as user_a,
      ui2.user_id as user_b,
      COUNT(DISTINCT ui1.publication_id) as shared_interactions,
      ARRAY_AGG(DISTINCT ui1.publication_id) as common_posts
    FROM public.user_interactions ui1
    JOIN public.user_interactions ui2 
      ON ui1.publication_id = ui2.publication_id 
      AND ui1.user_id != ui2.user_id
    WHERE ui1.interaction_type IN ('fire', 'comment')
      AND ui2.interaction_type IN ('fire', 'comment')
    GROUP BY ui1.user_id, ui2.user_id
    HAVING COUNT(DISTINCT ui1.publication_id) >= 3
    ORDER BY shared_interactions DESC;

    -- 4. Next video recommendation function
    CREATE OR REPLACE FUNCTION public.get_next_video_recommendations(
      p_user_id uuid,
      p_limit int DEFAULT 5
    )
    RETURNS SETOF public.publications
    LANGUAGE sql
    SECURITY INVOKER
    AS $$
      -- Find users with similar taste
      WITH similar_users AS (
        SELECT user_b as similar_user_id
        FROM public.user_affinities
        WHERE user_a = p_user_id
        ORDER BY shared_interactions DESC
        LIMIT 10
      ),
      -- Get what similar users liked that current user hasn't seen
      recommended_posts AS (
        SELECT DISTINCT ui.publication_id
        FROM public.user_interactions ui
        JOIN similar_users su ON ui.user_id = su.similar_user_id
        WHERE ui.interaction_type IN ('fire', 'view')
          AND ui.publication_id NOT IN (
            SELECT publication_id 
            FROM public.user_interactions 
            WHERE user_id = p_user_id AND publication_id IS NOT NULL
          )
        LIMIT p_limit * 2
      )
      SELECT p.*
      FROM public.publications p
      JOIN recommended_posts rp ON p.id = rp.publication_id
      WHERE p.deleted_at IS NULL
        AND p.est_masque = false
        AND p.moderation_approved = true
      ORDER BY p.reactions_count DESC, p.created_at DESC
      LIMIT p_limit;
    $$;

    -- 5. Automated trend refresh (daily via pg_cron)
    SELECT cron.schedule(
      'refresh_trending_dashboard',
      '0 0 * * *', -- Daily at midnight
      $$ REFRESH MATERIALIZED VIEW CONCURRENTLY public.trending_dashboard; $$
    );

    -- ============================================
    -- PERMISSIONS
    -- ============================================
    
    GRANT SELECT, INSERT, UPDATE ON public.poussoirs_appareils TO authenticated;
    GRANT SELECT ON public.notification_queue TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON public.offline_actions TO authenticated;
    GRANT SELECT, INSERT ON public.user_interactions TO authenticated;
    GRANT SELECT ON public.trending_dashboard TO authenticated;
    GRANT SELECT ON public.user_affinities TO authenticated;
  `;

    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sqlCommands });

        if (error) {
            console.log('❌ Error applying SQL via RPC.');
            console.log('\n🚀 PLEASE RUN THIS SQL IN THE SUPABASE SQL EDITOR:\n');
            console.log(sqlCommands);
        } else {
            console.log('✅ Phases 10-12 applied successfully.');
        }
    } catch (err) {
        console.log('❌ Failed to call RPC.');
        console.log('\n🚀 PLEASE RUN THIS SQL IN THE SUPABASE SQL EDITOR:\n');
        console.log(sqlCommands);
    }
}

applyPhases10to12();
