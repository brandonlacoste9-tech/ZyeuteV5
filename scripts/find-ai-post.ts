import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function findPost() {
  const { data, error } = await supabase
    .from("publications")
    .select("id, caption, media_url, ai_generated")
    .ilike("caption", "%Coucher de soleil majestueux%")
    .limit(1);

  if (error) {
    console.error("❌ Error:", error.message);
  } else if (data && data.length > 0) {
    console.log("✅ Found post:", data[0]);
  } else {
    console.log("❌ Post not found by caption.");
  }
}

findPost();
