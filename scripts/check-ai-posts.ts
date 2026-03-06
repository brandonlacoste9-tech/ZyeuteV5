import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkAIPosts() {
  console.log("📝 Checking AI-generated publications...");
  const { data, error } = await supabase
    .from("publications")
    .select("id, user_id, caption, media_url, ai_generated")
    .eq("ai_generated", true)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("❌ Error:", error.message);
  } else {
    data?.forEach((p) =>
      console.log(`${p.id} | ${p.caption?.substring(0, 30)} | ${p.media_url}`),
    );
  }
}

checkAIPosts();
