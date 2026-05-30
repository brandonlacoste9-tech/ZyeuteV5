import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hiuemmkhwiaarpdyncgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdWVtbWtod2lhYXJwZHluY2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDgxNDAsImV4cCI6MjA4MDc4NDE0MH0.FRHPXLUx-okrpdVUnhBPZdagg4MCTvUDGowa0dsSMrQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const columns = ['user_id', 'media_url', 'caption', 'visibilite', 'reactions_count', 'comments_count', 'est_masque', 'deleted_at', 'created_at'];

    for (const col of columns) {
        try {
            const { error } = await supabase.from('publications').select(col).limit(1);
            if (error) {
                console.log(`❌ Column '${col}': MISSING or Error (${error.message})`);
            } else {
                console.log(`✅ Column '${col}': EXISTS`);
            }
        } catch (e) {
            console.log(`❌ Column '${col}': Error`);
        }
    }
}

checkColumns();
