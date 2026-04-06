/**
 * Delete publications from Supabase so you can "start over" with the feed.
 *
 * Requires SUPABASE_URL (or VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
 * in .env (service role bypasses RLS).
 *
 * Usage:
 *   npx tsx scripts/wipe-publications.ts --videos-only --i-am-sure
 *   npx tsx scripts/wipe-publications.ts --all --i-am-sure
 *
 * Notes:
 * - Child rows with ON DELETE CASCADE (comments, reactions, gifts tied to posts, etc.)
 *   are removed by Postgres when a publication is deleted.
 * - This does NOT delete Mux assets or Supabase Storage objects; those may still
 *   bill or use space until you clean them in the Mux dashboard / Storage UI.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const args = new Set(process.argv.slice(2));
const videosOnly = args.has("--videos-only");
const allPosts = args.has("--all");
const confirmed = args.has("--i-am-sure");

async function main() {
  if (!confirmed) {
    console.error(
      "Refusing to run: pass --i-am-sure to confirm destructive delete.",
    );
    console.error(
      "Example: npx tsx scripts/wipe-publications.ts --videos-only --i-am-sure",
    );
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
    process.exit(1);
  }

  if (videosOnly === allPosts) {
    console.error("Pass exactly one of: --videos-only  OR  --all");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { count: beforeTotal, error: countErr } = await supabase
    .from("publications")
    .select("*", { count: "exact", head: true });

  if (countErr) {
    console.error("Count failed:", countErr.message);
    process.exit(1);
  }

  console.log(`Publications before: ${beforeTotal ?? "?"}`);

  if (videosOnly) {
    const { data, error } = await supabase
      .from("publications")
      .delete()
      .in("type", ["video", "Video"])
      .select("id");

    if (error) {
      console.error("Delete failed:", error.message);
      process.exit(1);
    }
    console.log(`Deleted ${data?.length ?? 0} video row(s).`);
  } else {
    let deleted = 0;
    for (;;) {
      const { data: batch, error: selErr } = await supabase
        .from("publications")
        .select("id")
        .limit(500);

      if (selErr) {
        console.error("Select batch failed:", selErr.message);
        process.exit(1);
      }
      if (!batch?.length) break;

      const ids = batch.map((r) => r.id);
      const { data: delRows, error: delErr } = await supabase
        .from("publications")
        .delete()
        .in("id", ids)
        .select("id");

      if (delErr) {
        console.error("Delete batch failed:", delErr.message);
        process.exit(1);
      }
      deleted += delRows?.length ?? 0;
      process.stdout.write(`\rDeleted ${deleted} publication(s)...`);
    }
    console.log(`\nDeleted ${deleted} publication(s) total (--all).`);
  }

  const { count: afterTotal } = await supabase
    .from("publications")
    .select("*", { count: "exact", head: true });

  console.log(`Publications after: ${afterTotal ?? "?"}`);
  console.log("Done. Re-seed or upload new videos when ready.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
