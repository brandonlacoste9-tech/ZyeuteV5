import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "../.env") });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "https://vuanulvyqkfefmjcikfk.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Failed to list buckets:", error);
  } else {
    console.log("Available buckets:", data.map(b => b.name));
  }
}

listBuckets();
