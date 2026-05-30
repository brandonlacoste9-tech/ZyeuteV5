import { config } from "dotenv";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: join(process.cwd(), ".env") });

async function main() {
  const url = process.env.VITE_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
  
  console.log("Testing Supabase REST Client...");
  console.log("URL:", url);
  
  const supabase = createClient(url, key);
  
  try {
    const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error("❌ REST Error:", error.message);
      if (error.details) console.error("Details:", error.details);
      if (error.hint) console.error("Hint:", error.hint);
    } else {
      console.log("✅ REST Success!");
      console.log("User profiles count:", data);
    }
  } catch (err: any) {
    console.error("❌ Unexpected Error:", err.message);
  }
}

main();
