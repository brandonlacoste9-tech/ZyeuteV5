import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing supabase url/key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing RPC...");
  const { data, error } = await supabase.rpc("get_localized_explore_feed", {
    p_viewer_id: null,
    p_region_id: "quebec",
    p_affinity_tags: [],
    p_limit: 10,
    p_seed: 12345,
    p_seen_ids: []
  });

  if (error) {
    console.error("Supabase RPC Error:", error);
  } else {
    console.log("Success! Data length:", data?.length);
  }
}

test();
