import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  // Try to find them in other places or just print env keys present
  console.log(
    "Keys present:",
    Object.keys(process.env).filter((k) => k.includes("SUPABASE")),
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseVideoFeed() {
  console.log("🔍 Diagnosing Video Feed...");

  const { data: posts, error } = await supabase
    .from("publications")
    .select("*")
    .limit(10);

  if (error) {
    console.error("❌ Error fetching publications:", error);
  } else {
    console.log(`📊 Found ${posts?.length || 0} publications total.`);
    posts?.forEach((p, i) => {
      const hasMux = !!p.mux_playback_id;
      const hasUrl = !!p.media_url;
      console.log(
        `[${i + 1}] ID: ${p.id.slice(0, 8)} | Hive: ${p.hive_id} | Type: ${p.type} | Mux: ${hasMux} | URL: ${hasUrl ? p.media_url.slice(0, 40) + "..." : "none"}`,
      );
    });
  }

  const { data: users, error: userError } = await supabase
    .from("user_profiles")
    .select("count")
    .single();

  if (userError) console.error("❌ Error checking users:", userError);
  else console.log(`\n👥 User count: ${users?.count || "unknown"}`);
}

diagnoseVideoFeed();
