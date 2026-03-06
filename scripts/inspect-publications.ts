import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function inspectPublications() {
  console.log("🕵️ Inspecting publications table...");

  const { data, error, count } = await supabase
    .from("publications")
    .select(
      "id, caption, visibility, est_masque, deleted_at, type, media_url, hive_id, processing_status",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("❌ Error:", error.message);
  } else {
    console.log(`📊 Total posts found: ${count}`);
    data?.forEach((p) => {
      console.log(
        `- [${p.id}] ${p.caption?.substring(0, 30)}... | Vis: ${p.visibility} | Masked: ${p.est_masque} | Deleted: ${p.deleted_at} | Hive: ${p.hive_id} | Status: ${p.processing_status}`,
      );
    });
  }
}

inspectPublications();
