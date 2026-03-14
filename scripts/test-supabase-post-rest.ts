import { config } from "dotenv";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: join(process.cwd(), ".env") });

async function main() {
  const url = process.env.VITE_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
  
  const supabase = createClient(url, key);
  
  console.log("Testing REST Post Creation...");
  
  // Need a valid user ID. Let's try to get the first user from user_profiles.
  const { data: users } = await supabase.from('user_profiles').select('id').limit(1);
  if (!users || users.length === 0) {
      console.error("No users found to test with.");
      return;
  }
  const userId = users[0].id;
  console.log("Using User ID:", userId);

  const testPost = {
    user_id: userId,
    content: "Test post from REST API 🚀",
    media_url: "https://v3b.fal.media/files/b/0a920095/lcvQ3kLTn3rY0bPgvkPb6_JFdNm6Qe.mp4",
    type: "video",
    visibility: "public",
    hive_id: "quebec",
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from('publications').insert([testPost]).select();
    
    if (error) {
      console.error("❌ REST Insert Error:", error.message);
    } else {
      console.log("✅ REST Insert Success!");
      console.log("New Post:", data[0]);
    }
  } catch (err: any) {
    console.error("❌ Unexpected Error:", err.message);
  }
}

main();
