import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, username, display_name")
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  console.log("--- USERS ---");
  data.forEach((u) =>
    console.log(`${u.id}: ${u.username} (${u.display_name})`),
  );
}

check();
