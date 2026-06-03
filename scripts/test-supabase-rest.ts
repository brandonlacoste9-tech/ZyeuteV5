import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env.local") });

async function testREST() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("URL:", supabaseUrl);
  console.log("Key:", supabaseKey?.substring(0, 10) + "...");

  const supabase = createClient(supabaseUrl!, supabaseKey!);
  
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id")
    .limit(1);

  if (error) {
    console.error("REST API Error:", error.message);
  } else {
    console.log("REST API Success! Users:", data);
  }
}

testREST();
