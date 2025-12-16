
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
    const taskId = 'b12e88a8-68f8-4f97-aea1-c234e7b2418a';
    console.log(`🔍 Checking status for task ${taskId}...`);

    const { data, error } = await supabase
        .from('colony_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    if (error) {
        console.error("❌ Error fetching task:", error);
    } else {
        console.log(`✅ Task Status: ${data.status}`);
        if (data.status === 'failed') {
            console.log(`❌ Failure Reason: ${data.error}`);
        }
        if (data.status === 'completed') {
            console.log(`🎉 Result:`, data.result);
        }
    }
}

checkStatus();
