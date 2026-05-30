import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFeed() {
    console.log("🔍 Checking Feed for Ti-Guy content...");

    // 1. Check if Ti-Guy exists
    const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', 'ti_guy_bot')
        .single();

    if (userError || !user) {
        console.log("❌ Ti-Guy Bot User NOT found yet.");
    } else {
        console.log(`✅ Found Ti-Guy! ID: ${user.id}`);

        // 2. Check for recent posts
        const { data: posts, error: postError } = await supabase
            .from('publications') // Updated to correct table
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (postError) {
            console.error("❌ Error fetching publications:", postError);
        } else {
            if (posts.length === 0) {
                console.log("⏳ No publications for Ti-Guy yet.");
            } else {
                console.log(`🎉 Found ${posts.length} publications for Ti-Guy!`);
                posts.forEach(p => {
                    console.log(`   - ${p.created_at}: ${p.caption?.substring(0, 50)}...`);
                    console.log(`     Media: ${p.media_url}`);
                });
            }
        }
    }

    // 3. Check Task Status
    const { data: tasks, error: taskError } = await supabase
        .from('colony_tasks')
        .select('*');

    if (taskError) console.error("Task Fetch Error:", taskError);
    if (!tasks) console.error("Tasks data is null");
    else console.log(`Found ${tasks.length} tasks.`);


    console.log("\n📋 Recent Colony Tasks:");
    tasks?.forEach(t => {
        console.log(`   - ${t.command} [${t.status}] (Worker: ${t.worker_id})`);
        if (t.error) console.log(`     ❌ Error: ${t.error}`);
        if (t.status === 'async_waiting') console.log(`     ⏳ Waiting for async job...`);
    });
}

checkFeed();
