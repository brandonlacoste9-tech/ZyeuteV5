
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function queueTask() {
    console.log("🚀 Queueing vitals task...");

    const { data, error } = await supabase.from('colony_tasks').insert({
        command: 'check_vitals',
        status: 'pending',
        metadata: {
            scope: 'full_system',
            target_bee: 'health_bee'
        }
    }).select();

    if (error) {
        console.error("❌ Error queueing task:", error);
    } else {
        console.log(`✅ Task Queued: ${data[0].id}`);
    }
}

queueTask();
