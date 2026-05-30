import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("--- Inspecting POSTS ---");
  const { data: posts, error: pErr } = await supabase
    .from("posts")
    .select("*")
    .limit(1);
  if (pErr) console.log("Error posts:", pErr.message);
  else if (posts && posts.length)
    console.log("Posts Keys:", Object.keys(posts[0]));
  else console.log("Posts table empty or not found");

  console.log("\n--- Inspecting PUBLICATIONS ---");
  const { data: pubs, error: pubErr } = await supabase
    .from("publications")
    .select("*")
    .limit(1);
  if (pubErr) console.log("Error publications:", pubErr.message);
  else if (pubs && pubs.length)
    console.log("Publications Keys:", Object.keys(pubs[0]));
  else console.log("Publications table empty or not found");
}

inspect();
