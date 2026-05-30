import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkSchema() {
  const { data, error } = await supabase
    .from("publications")
    .select("*")
    .limit(1);

  if (error) {
    console.error("❌ Error:", error.message);
  } else if (data && data.length > 0) {
    console.log("📋 Columns in publications:", Object.keys(data[0]));
    console.log("Sample AI Generated value:", data[0].ai_generated);
  }
}

checkSchema();
