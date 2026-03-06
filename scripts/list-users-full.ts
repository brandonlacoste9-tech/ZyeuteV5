import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkUsers() {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, username, email")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error:", error.message);
  } else {
    data?.forEach((u) => console.log(`${u.id} | ${u.username} | ${u.email}`));
  }
}

checkUsers();
