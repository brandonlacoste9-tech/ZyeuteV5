import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hiuemmkhwiaarpdyncgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdWVtbWtod2lhYXJwZHluY2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDgxNDAsImV4cCI6MjA4MDc4NDE0MH0.FRHPXLUx-okrpdVUnhBPZdagg4MCTvUDGowa0dsSMrQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    try {
        console.log("🚀 Testing posts query...");
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                user:user_profiles!user_id(*)
            `)
            .limit(1);

        if (error) {
            console.error("❌ Query failed:", error);
            console.log("🔍 Trying without join...");
            const { data: data2, error: error2 } = await supabase
                .from('posts')
                .select('*')
                .limit(1);
            if (error2) {
                console.error("❌ Basic select failed:", error2);
            } else {
                console.log("✅ Basic select worked. JOIN is the problem.");
                console.log("Sample row:", data2[0]);
            }
        } else {
            console.log("✅ Query worked!");
            console.log("Sample data:", data[0]);
        }
    } catch (err) {
        console.error("💥 Execution error:", err);
    }
}

testQuery();
