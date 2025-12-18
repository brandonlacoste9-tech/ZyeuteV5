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

async function applyVectorSearch() {
    console.log('🤖 Applying Phase 8: Vector (Smart Feed) changes...');

    const sqlCommands = `
    -- 1. Enable pgvector
    CREATE EXTENSION IF NOT EXISTS vector;

    -- 2. Add embedding support to publications
    ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS embedding vector(384);
    ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS last_embedded_at timestamptz;
    ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS embedding_version int DEFAULT 1;

    -- 3. Create HNSW index for ultra-fast semantic search
    -- Using cosine distance (<=>) which is standard for GTE
    CREATE INDEX IF NOT EXISTS idx_publications_embedding ON public.publications 
    USING hnsw (embedding vector_cosine_ops);

    -- 4. Hybrid Smart Feed Function
    -- Combines semantic similarity with popularity and recency
    CREATE OR REPLACE FUNCTION public.recommandations_pour_toi(
      p_embedding vector(384),
      p_limit int DEFAULT 20,
      p_min_similarity float DEFAULT 0.5
    )
    RETURNS SETOF public.publications
    LANGUAGE sql
    SECURITY INVOKER
    AS $$
      SELECT *
      FROM public.publications
      WHERE deleted_at IS NULL
        AND est_masque = false
        AND embedding IS NOT NULL
        AND (1 - (embedding <=> p_embedding)) > p_min_similarity
      ORDER BY 
        (1 - (embedding <=> p_embedding)) * 0.7 + -- Semantic weight
        (reactions_count * 0.2 + comments_count * 0.1) DESC -- Popularity weight
      LIMIT p_limit;
    $$;

    -- 5. Semantic Search by Text (Helper)
    -- This function will be useful for the initial "Pour Toi" generation
    CREATE OR REPLACE FUNCTION public.recherche_semantique(
      p_query_embedding vector(384),
      p_limit int DEFAULT 20
    )
    RETURNS SETOF public.publications
    LANGUAGE sql
    SECURITY INVOKER
    AS $$
      SELECT *
      FROM public.publications
      WHERE deleted_at IS NULL
        AND est_masque = false
        AND embedding IS NOT NULL
      ORDER BY embedding <=> p_query_embedding
      LIMIT p_limit;
    $$;
  `;

    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sqlCommands });

        if (error) {
            console.log('❌ Error applying SQL via RPC.');
            console.log('\n🚀 PLEASE RUN THIS SQL IN THE SUPABASE SQL EDITOR:\n');
            console.log(sqlCommands);
        } else {
            console.log('✅ Phase 8: Vector search applied successfully.');
        }
    } catch (err) {
        console.log('❌ Failed to call RPC.');
        console.log('\n🚀 PLEASE RUN THIS SQL IN THE SUPABASE SQL EDITOR:\n');
        console.log(sqlCommands);
    }
}

applyVectorSearch();
