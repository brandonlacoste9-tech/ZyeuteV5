import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env vars
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

// Use Anon Key as it works for public schema reading usually
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log("🕵️‍♀️ Diagnosing Database Schema...");
  console.log(`📡 URL: ${supabaseUrl}`);

  // 1. Try to list all tables in public schema via a hack text query or just checking common names
  const commonTables = [
    "users",
    "profiles",
    "accounts",
    "posts",
    "hives",
    "comments",
  ];

  for (const table of commonTables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      if (error.code === "42P01") {
        // undefined_table
        console.log(`❌ Table '${table}': DOES NOT EXIST`);
      } else {
        console.log(`⚠️  Table '${table}': Access Error (${error.message})`);
      }
    } else {
      console.log(`✅ Table '${table}': Found ${count} rows`);
    }
  }

  // 2. Try to check 'auth.users' (Will likely fail with Anon key, but worth a try if RLS is loose)
  // Supabase client usually hides auth schema, so this is just a connectivity check mainly.
}

diagnose();
