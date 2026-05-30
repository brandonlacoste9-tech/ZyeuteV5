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

async function applyEliteGeoV2() {
    console.log('🌍 Applying Elite Geo-discovery Enhancements (V2)...');

    const sqlCommands = `
    -- 1. Optimized Trend Reader (Fast API)
    CREATE OR REPLACE FUNCTION public.lire_tendances_par_region(
      p_region_id text, 
      p_limit int DEFAULT 50, 
      p_before timestamptz DEFAULT now()
    )
    RETURNS TABLE (publication_id uuid, score int, created_at timestamptz) 
    LANGUAGE sql 
    SECURITY INVOKER AS $$
      SELECT t.publication_id, t.score, t.created_at
      FROM public.tendances_par_region_mv t
      WHERE t.region_id = p_region_id
        AND t.created_at < p_before
      ORDER BY t.score DESC, t.created_at DESC
      LIMIT p_limit
    $$;

    -- 2. Regions Table (Polygons)
    CREATE TABLE IF NOT EXISTS public.regions (
      id text PRIMARY KEY,
      nom text NOT NULL,
      geom geometry(MultiPolygon, 4326) NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_regions_geom ON public.regions USING GIST (geom);

    -- 3. Region Auto-Population Helper
    CREATE OR REPLACE FUNCTION public.compute_region_id_from_point(pt geography)
    RETURNS text LANGUAGE sql STABLE AS $$
      SELECT r.id
      FROM public.regions r
      WHERE ST_Contains(r.geom, pt::geometry)
      LIMIT 1
    $$;

    -- 4. Trigger to set region_id on publications automatically
    CREATE OR REPLACE FUNCTION public.set_publication_region() 
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.location IS NOT NULL THEN
        NEW.region_id := public.compute_region_id_from_point(NEW.location);
      END IF;
      RETURN NEW;
    END $$;

    DROP TRIGGER IF EXISTS trg_publications_region ON public.publications;
    CREATE TRIGGER trg_publications_region
    BEFORE INSERT OR UPDATE OF location ON public.publications
    FOR EACH ROW EXECUTE FUNCTION public.set_publication_region();

    -- 5. Additional Performance Indices
    CREATE INDEX IF NOT EXISTS idx_publications_region_created_at ON public.publications(region_id, created_at DESC);
  `;

    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sqlCommands });

        if (error) {
            console.log('❌ Error applying SQL via RPC.');
            console.log('\n🚀 PLEASE RUN THIS SQL IN THE SUPABASE SQL EDITOR:\n');
            console.log(sqlCommands);
        } else {
            console.log('✅ Elite Geo-discovery enhancements applied successfully.');
        }
    } catch (err) {
        console.log('❌ Failed to call RPC.');
        console.log('\n🚀 PLEASE RUN THIS SQL IN THE SUPABASE SQL EDITOR:\n');
        console.log(sqlCommands);
    }
}

applyEliteGeoV2();
