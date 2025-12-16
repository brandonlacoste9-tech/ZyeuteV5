
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
config({ path: join(__dirname, '../../.env') });
config({ path: join(__dirname, '.env.colony') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTask() {
    const taskId = 'e78c7f01-a398-4695-a69c-cc5cd4e6df65';
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
    }
}

checkTask();
