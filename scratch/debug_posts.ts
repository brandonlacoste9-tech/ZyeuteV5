
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkPosts() {
  const { data, error } = await supabase
    .from("publications")
    .select("id, user_id, hive_id")
    .limit(5);

  if (error) {
    console.error("Error fetching posts:", error);
    return;
  }

  console.log("Posts user_ids:", data);
}

checkPosts();
