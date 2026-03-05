import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from("publications")
    .select("id, type, created_at, caption, media_url, ai_generated, user_id")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log("--- LATEST 5 PUBLICATIONS ---");
  data?.forEach((pub, i) => {
    console.log(`${i + 1}. ID: ${pub.id}`);
    console.log(`   Created: ${pub.created_at}`);
    console.log(`   Type: ${pub.type}`);
    console.log(`   AI Generated: ${pub.ai_generated}`);
    console.log(`   User ID: ${pub.user_id}`);
    console.log(`   Caption: ${pub.caption}`);
    console.log(`   URL: ${pub.media_url?.substring(0, 60)}...`);
    console.log("");
  });
}

check();
