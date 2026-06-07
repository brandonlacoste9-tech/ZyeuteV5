import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ FATAL: Supabase credentials not found in .env');
    console.error('\nCreate .env file with:');
    console.error('VITE_SUPABASE_URL=https://[REF].supabase.co');
    console.error('VITE_SUPABASE_ANON_KEY=your_anon_key_here');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('\n📡 Testing auth.getSession()...');
        const start = Date.now();

        const { data, error } = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT after 5s')), 5000)
            )
        ]) as any;

        const duration = Date.now() - start;

        if (error) {
            console.error(`❌ Auth failed (${duration}ms):`, error.message);
            return false;
        }

        console.log(`✅ Auth success (${duration}ms)`);
        console.log('Session:', data.session ? 'Active' : 'No session (expected if not logged in)');

        // Test database connection
        console.log('\n📊 Testing database query...');
        const dbStart = Date.now();
        const { data: posts, error: dbError } = await supabase
            .from('publications')
            .select('id')
            .limit(1);

        const dbDuration = Date.now() - dbStart;

        if (dbError) {
            console.error(`❌ Database failed (${dbDuration}ms):`, dbError.message);
            return false;
        }

        console.log(`✅ Database success (${dbDuration}ms)`);
        console.log('Posts found:', posts?.length || 0);

        return true;
    } catch (err: any) {
        console.error('❌ Connection test failed:', err.message);
        return false;
    }
}

testConnection().then(success => {
    if (success) {
        console.log('\n✅ ✅ ✅ ALL TESTS PASSED ✅ ✅ ✅');
        console.log('Supabase is working correctly!');
        console.log('\nIf the app still has issues, the problem is in the frontend code.');
    } else {
        console.log('\n❌ ❌ ❌ TESTS FAILED ❌ ❌ ❌');
        console.log('Fix Supabase configuration before proceeding.');
    }
    process.exit(success ? 0 : 1);
});
