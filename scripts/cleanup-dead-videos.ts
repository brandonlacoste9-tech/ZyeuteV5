import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env.local"), override: true });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Identifiers of the 10 publications flagged as dead (404, invalid storage, or missing media URLs)
const DEAD_PUBLICATION_IDS = [
  "ad5e8938-3ae4-4f79-9f89-8314ab5b3908", // supabase.co invalid object
  "2381aa81-4afd-4a4b-a83e-600268ad07c0", // 404 apify
  "bd353377-b215-4123-9d88-ec123905aef3", // 404 apify
  "25972d89-7533-4eb5-a7bd-3d211e3b2562", // 404 apify
  "4785d66d-7a7c-49e1-91d7-cc0bf17dbac9", // 404 apify
  "2953baf3-3688-4cb6-ad5f-9d88e0862df4", // 404 apify
  "1618c6f8-f6fc-4075-8273-d05293661de3", // 404 apify
  "41f3e713-7f4a-4530-8efc-341cbb1b44de", // 404 apify
  "b4a156be-21e7-4aba-8427-1eb42fbb1ee8", // No media URL
  "77750fa1-7740-4256-acfe-2358200895c6", // No media URL
];

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`🧹 Deleting ${DEAD_PUBLICATION_IDS.length} dead publications from Supabase...`);

  const { data, error } = await supabase
    .from("publications")
    .delete()
    .in("id", DEAD_PUBLICATION_IDS)
    .select("id");

  if (error) {
    console.error("❌ Error deleting publications:", error.message);
    process.exit(1);
  }

  console.log(`\n🎉 Cleanup complete! Successfully deleted ${data?.length || 0} dead publication(s) from the feed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
