import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function createBot() {
    console.log("🤖 Summoning Ti-Guy...");

    // Check if exists
    const { data: existing } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', 'ti_guy_bot')
        .single();

    if (existing) {
        console.log("✅ Ti-Guy already exists:", existing.id);
        return;
    }

    // Create auth user (Optional: Supabase usually requires auth.users entry)
    // But we are inserting into 'user_profiles' which might reference auth.users.
    // In `schema.ts`: `id: uuid("id").primaryKey(), // FK to auth.users.id`
    // So we MUST create an auth user first.

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: 'ti-guy@zyeute.com',
        password: 'secure_bot_password_123!',
        email_confirm: true,
        user_metadata: {
            username: 'ti_guy_bot',
            full_name: 'Ti-Guy ⚜️'
        }
    });

    let userId;

    if (authError) {
        // If error is "User already registered", try to fetch
        // BUT checking existing failed earlier.
        // Let's assume we can fetch by email via admin?
        // Or just fail. 
        // BUT we saw "Auth user created" in logs. So if I run again, it fails.
        console.log("⚠️ Auth Create Error (User likely exists). Fetching...");
        const { data: listData } = await supabase.auth.admin.listUsers();
        // find user
        const found = listData.users.find(u => u.email === 'ti-guy@zyeute.com');
        if (found) userId = found.id;
        else {
            console.error("❌ Could not find existing user.");
            return;
        }
    } else {
        userId = authUser.user.id;
    }

    console.log("✅ Using User ID:", userId);

    // Now create profile (Upsert)
    const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
            id: userId,
            username: 'ti_guy_bot',
            display_name: 'Ti-Guy ⚜️',
            bio: 'Je suis le Cerveau Numérique. I create stuff.',
            avatar_url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=TiGuy',
            region: 'quebec',
            is_admin: true
        });

    if (profileError) {
        console.error("❌ Profile Create Failed:", profileError);
    } else {
        console.log("✨ Ti-Guy is ALIVE!");
    }
}

createBot();
