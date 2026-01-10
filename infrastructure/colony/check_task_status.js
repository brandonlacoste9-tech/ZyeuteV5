
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment from root .env
config({ path: join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTask() {
    const taskId = process.argv[2] || '4f12d022-c32a-4e11-8555-fb9cb9cd81ef';
    console.log(`Checking task ${taskId}...`);

    const { data, error } = await supabase
        .from('colony_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Task Status:', data.status);
        console.log('Result:', data.result);
        console.log('Worker:', data.worker_id);
    }
}

checkTask();
