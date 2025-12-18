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

async function applyModerationChanges() {
    console.log('🛡️ Applying Phase 9: AI Moderation & Transcription changes...');

    const sqlCommands = `
    -- 1. Add moderation and transcription columns
    ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS transcription text;
    ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS transcribed_at timestamptz;
    ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS is_moderated boolean DEFAULT false;
    ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS moderation_approved boolean DEFAULT true;
    ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS moderation_score int DEFAULT 0;
    ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS moderated_at timestamptz;

    -- 2. Create moderated content view (only approved posts)
    CREATE OR REPLACE VIEW public.publications_moderee AS
    SELECT *
    FROM public.publications
    WHERE deleted_at IS NULL
      AND est_masque = false
      AND (moderation_approved = true OR is_moderated = false);

    -- 3. Create index for moderation queries
    CREATE INDEX IF NOT EXISTS idx_publications_moderation ON public.publications(is_moderated, moderation_approved);

    -- 4. Helper function to trigger moderation (called manually or via trigger)
    CREATE OR REPLACE FUNCTION public.trigger_moderation(p_publication_id uuid)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_caption text;
      v_content text;
    BEGIN
      SELECT caption, content INTO v_caption, v_content
      FROM public.publications
      WHERE id = p_publication_id;

      -- Call Edge Function via pg_net (requires pg_net extension)
      -- This is a placeholder - you'll invoke the Edge Function from your app
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/moderate-content',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
          'publicationId', p_publication_id,
          'caption', v_caption,
          'content', v_content
        )
      );
    END;
    $$;

    -- 5. Grant access to the moderated view
    GRANT SELECT ON public.publications_moderee TO authenticated;
    GRANT SELECT ON public.publications_moderee TO anon;
  `;

    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sqlCommands });

        if (error) {
            console.log('❌ Error applying SQL via RPC.');
            console.log('\n🚀 PLEASE RUN THIS SQL IN THE SUPABASE SQL EDITOR:\n');
            console.log(sqlCommands);
        } else {
            console.log('✅ Phase 9: Moderation schema applied successfully.');
        }
    } catch (err) {
        console.log('❌ Failed to call RPC.');
        console.log('\n🚀 PLEASE RUN THIS SQL IN THE SUPABASE SQL EDITOR:\n');
        console.log(sqlCommands);
    }
}

applyModerationChanges();
