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

async function applyEnumUpdate() {
    console.log('🔄 Updating user_role enum to include "banned"...');

    const sqlCommands = `
    -- Try to add 'banned' to the user_role type
    -- Using a DO block to handle errors if it already exists or if it's the first time
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'banned') THEN
            ALTER TYPE public.user_role ADD VALUE 'banned';
        END IF;
    END $$;
    `;

    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sqlCommands });

        if (error) {
            console.log('❌ Error applying SQL via RPC.');
            console.log('\n🚀 PLEASE RUN THIS SQL IN THE SUPABASE SQL EDITOR:\n');
            console.log(sqlCommands);
        } else {
            console.log('✅ user_role enum updated successfully.');
        }
    } catch (err) {
        console.log('❌ Failed to call RPC.');
        console.log('\n🚀 PLEASE RUN THIS SQL IN THE SUPABASE SQL EDITOR:\n');
        console.log(sqlCommands);
    }
}

applyEnumUpdate();
