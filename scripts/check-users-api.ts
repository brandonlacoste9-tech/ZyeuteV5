import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkUsers() {
  console.log("👥 Checking users in 'user_profiles' table...");
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, username, email")
    .limit(10);

  if (error) {
    console.error("❌ Error:", error.message);
  } else {
    console.table(data);
  }
}

checkUsers();
