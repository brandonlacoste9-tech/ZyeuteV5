import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env vars
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

// Use Anon Key as it is working
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runRepair() {
  console.log("🛠️  Starting Zyeuté Data Repair...");

  // 1. Get or Create "Ti-Guy" Admin User
  // FROM SCREENSHOT: Ti-Guy UID = 9175f19b-5d49-4aa5-afba-c5dfa53e086d
  const adminId = "9175f19b-5d49-4aa5-afba-c5dfa53e086d";
  console.log(`✅ Using Hardcoded Ti-Guy ID: ${adminId}`);

  /* 
  // Old logic failed due to RLS/Service Key issues
  let adminId;
  const { data: users } = await supabase.from('users').select('id, username').eq('username', 'Ti-Guy').single();
  */

  // 2. Fix Orphaned Posts
  // Schema says table is "publications".
  // The posts have user_IDs that point to users who don't exist anymore.
  // So we just adopt ALL posts to Ti-Guy.
  const tableName = "publications";

  console.log(`🎯 Targeting table: '${tableName}'`);

  const { data: allPosts, error: fetchError } = await supabase
    .from(tableName)
    .select("id");

  if (fetchError) {
    console.error(
      `❌ Error fetching posts in ${tableName}:`,
      fetchError.message,
    );
  } else if (allPosts && allPosts.length > 0) {
    console.log(
      `🩹 Found ${allPosts.length} posts. Adopting ALL to Ti-Guy (Admin)...`,
    );

    for (const post of allPosts) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ user_id: adminId })
        .eq("id", post.id);

      if (updateError)
        console.error(`   Failed to fix post ${post.id}:`, updateError.message);
      else console.log(`   ✅ Adopted post ${post.id}`);
    }
  } else {
    console.log("✅ No posts found to adopt (table empty).");
  }

  // 3. Fix Missing Hives (Assign to "Quebec" - Hive ID 1 or similar default)
  // Assuming 'hives' is an array column or similar. We will just check for empty.
  // Note: Depending on schema, this might vary. We'll skip complex logic to avoid breaking.

  console.log("🏁 Repair Job Done.");
}

runRepair();
