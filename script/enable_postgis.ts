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

async function enablePostGIS() {
    console.log('🌍 Enabling PostGIS extension...');

    // We use the supabase.rpc('query_sql') if exists, or try to run via a trick
    // Actually, service_role key can often run raw SQL if the user has configured the RPC 'exec' or similar.
    // If not, we'll suggest the user run it.

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'CREATE EXTENSION IF NOT EXISTS postgis;' });

        if (error) {
            console.error('❌ Error enabling PostGIS via RPC:', error.message);
            console.log('ℹ️ You may need to enable PostGIS manually in the Supabase SQL Editor: CREATE EXTENSION IF NOT EXISTS postgis;');
        } else {
            console.log('✅ PostGIS extension enabled successfully.');
        }
    } catch (err) {
        console.error('❌ Failed to call exec_sql RPC:', err);
        console.log('ℹ️ PLEASE RUN THIS IN SUPABASE SQL EDITOR: CREATE EXTENSION IF NOT EXISTS postgis;');
    }
}

enablePostGIS();
