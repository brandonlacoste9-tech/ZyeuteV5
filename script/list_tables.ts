import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function introspectSchema() {
    try {
        console.log("🔍 Introspecting columns via sample queries...");

        const tables = ['user_profiles', 'publications', 'stories', 'reactions'];

        for (const table of tables) {
            console.log(`\n--- Table: ${table} ---`);
            const { data, error } = await supabase.from(table).select('*').limit(1);

            if (error) {
                console.error(`❌ Error querying ${table}:`, error.message);
                if (error.hint) console.log(`💡 Hint: ${error.hint}`);
            } else if (data && data.length > 0) {
                console.log(`✅ ${table} has data. Columns:`, Object.keys(data[0]).join(', '));
            } else {
                console.log(`⚠️ ${table} is empty, but exists. Checking schema via empty select...`);
                // If empty, we can't see keys this way, but we've confirmed it exists.
            }
        }
    } catch (err) {
        console.error(err);
    }
}
introspectSchema();
