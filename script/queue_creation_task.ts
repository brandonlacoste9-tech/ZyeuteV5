import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function queueTask() {
    const prompt = process.argv[2] || "A cinematic drone shot of Chateau Frontenac in Quebec City, winter, snowy, 4k, photorealistic";
    const type = process.argv[3] === 'image' ? 'generate_image' : 'generate_video';

    console.log(`🎨 Queuing Creation Task (${type}): "${prompt}"`);

    // Remove explicit priority to rely on DB default
    const { data, error } = await supabase
        .from('colony_tasks')
        .insert({
            command: type,
            status: 'pending',
            metadata: {
                target_bee: 'creation_bee',
                prompt: prompt
            }
        })
        .select();

    if (error) {
        console.error("❌ Error queuing task:", error);
    } else {
        console.log("✅ Task queued successfully:", data[0].id);
    }
}

queueTask();
