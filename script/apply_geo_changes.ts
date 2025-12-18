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

async function applyGeoChanges() {
    console.log('🌍 Applying Geo-discovery changes...');

    const sqlCommands = `
    -- 1. Enable PostGIS
    CREATE EXTENSION IF NOT EXISTS postgis;

    -- 2. Add columns to user_profiles
    ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS location geography(Point, 4326);
    ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS region_id text;

    -- 3. Add columns to publications
    ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS location geography(Point, 4326);
    ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS region_id text;

    -- 4. Create GIST indexes
    CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON public.user_profiles USING GIST (location);
    CREATE INDEX IF NOT EXISTS idx_publications_location ON public.publications USING GIST (location);

    -- 5. Create Tendance Nearby Function
    CREATE OR REPLACE FUNCTION public.get_publications_nearby(
      p_lat double precision,
      p_lon double precision,
      p_radius_meters integer DEFAULT 50000
    )
    RETURNS SETOF public.publications
    LANGUAGE sql
    SECURITY INVOKER
    AS $$
      SELECT *
      FROM public.publications
      WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography,
        p_radius_meters
      )
      AND deleted_at IS NULL
      AND est_masque = false
      ORDER BY created_at DESC;
    $$;

    -- 6. Create Regional Trends View
    CREATE OR REPLACE VIEW public.tendances_par_region AS
    SELECT 
      region_id,
      id as publication_id,
      reactions_count,
      comments_count,
      created_at
    FROM public.publications
    WHERE region_id IS NOT NULL
      AND deleted_at IS NULL
      AND est_masque = false
    ORDER BY region_id, (reactions_count * 2 + comments_count) DESC;

    -- 7. RLS for realtime.messages (Elite Phase)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'realtime' AND tablename = 'messages' AND policyname = 'post_engagement_read'
      ) THEN
        CREATE POLICY post_engagement_read ON realtime.messages
          FOR SELECT TO authenticated
          USING (topic LIKE 'publication:%:presence' OR topic LIKE 'publication:%:engagement');
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'realtime' AND tablename = 'messages' AND policyname = 'post_engagement_write'
      ) THEN
        CREATE POLICY post_engagement_write ON realtime.messages
          FOR INSERT TO authenticated
          WITH CHECK (topic LIKE 'publication:%:presence' OR topic LIKE 'publication:%:engagement');
      END IF;
    END $$;
  `;

    // Try to execute via a hypothetical 'exec_sql' RPC if available, 
    // but if it fails we just tell the user what to do.
    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sqlCommands });

        if (error) {
            console.log('❌ Error applying SQL via RPC. This is expected if exec_sql is not defined.');
            console.log('\n🚀 PLEASE RUN THIS SQL IN THE SUPABASE SQL EDITOR:\n');
            console.log(sqlCommands);
        } else {
            console.log('✅ Geo-discovery changes applied successfully.');
        }
    } catch (err) {
        console.log('❌ Failed to call RPC.');
        console.log('\n🚀 PLEASE RUN THIS SQL IN THE SUPABASE SQL EDITOR:\n');
        console.log(sqlCommands);
    }
}

applyGeoChanges();
