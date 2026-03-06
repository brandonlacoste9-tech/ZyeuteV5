import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function test() {
  console.log("Connecting to Supabase API...");
  const { data, error } = await supabase
    .from("publications")
    .select("count")
    .limit(1);
  if (error) {
    console.error("❌ Failed!", error.message);
  } else {
    console.log("✅ Success!", data);
  }
}

test();
