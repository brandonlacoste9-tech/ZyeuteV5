/**
 * Remove junk rows from `publications` that cause blank/test feeds:
 * - processing_status pending or failed
 * - caption/content containing DIAGNOSTIC
 * - type video with no playable URL (no mux id, no hls, no http media_url)
 *
 * Requires SUPABASE_URL (or VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage:
 *   npx tsx scripts/cleanup-junk-publications.ts --dry-run
 *   npx tsx scripts/cleanup-junk-publications.ts --i-am-sure
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const args = new Set(process.argv.slice(2));
const confirmed = args.has("--i-am-sure");
const dryRun = args.has("--dry-run");

function playableRow(row: {
  media_url?: string | null;
  hls_url?: string | null;
  mux_playback_id?: string | null;
}): boolean {
  const mux = String(row.mux_playback_id ?? "").trim();
  if (mux.length >= 8) return true;
  const hls = String(row.hls_url ?? "").trim();
  if (hls.length >= 12 && /^https?:\/\//i.test(hls)) return true;
  const media = String(row.media_url ?? "").trim();
  if (media.length >= 12 && /^https?:\/\//i.test(media)) return true;
  return false;
}

async function main() {
  if (!dryRun && !confirmed) {
    console.error("Pass --i-am-sure to delete, or --dry-run to preview only.");
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const tag = dryRun ? "[DRY RUN]" : "[DELETE]";
  let totalDeleted = 0;

  async function deleteByQuery(
    label: string,
    filter: (q: ReturnType<typeof supabase.from>) => any,
  ) {
    const base = supabase.from("publications").select("id");
    const { data, error } = await filter(base);
    if (error) {
      console.error(`${label}:`, error.message);
      return;
    }
    const ids = (data ?? []).map((r: { id: string }) => r.id);
    console.log(`${tag} ${label}: ${ids.length} row(s)`);
    if (ids.length === 0 || dryRun) return;

    const chunk = 200;
    for (let i = 0; i < ids.length; i += chunk) {
      const slice = ids.slice(i, i + chunk);
      const { error: delErr } = await supabase
        .from("publications")
        .delete()
        .in("id", slice);
      if (delErr) {
        console.error(`${label} delete failed:`, delErr.message);
        return;
      }
      totalDeleted += slice.length;
    }
  }

  await deleteByQuery("processing_status = pending", (q) =>
    q.eq("processing_status", "pending"),
  );
  await deleteByQuery("processing_status = failed", (q) =>
    q.eq("processing_status", "failed"),
  );
  await deleteByQuery("caption ILIKE %DIAGNOSTIC%", (q) =>
    q.ilike("caption", "%DIAGNOSTIC%"),
  );
  await deleteByQuery("content ILIKE %DIAGNOSTIC%", (q) =>
    q.ilike("content", "%DIAGNOSTIC%"),
  );

  // Unplayable videos: keyset pagination on created_at
  let cursor: string | null = null;
  let orphanTotal = 0;
  let pages = 0;
  const maxPages = 500;

  for (;;) {
    pages++;
    if (pages > maxPages) {
      console.warn(`${tag} orphan scan stopped after ${maxPages} pages (safety cap).`);
      break;
    }

    let q = supabase
      .from("publications")
      .select("id, media_url, hls_url, mux_playback_id, created_at")
      .eq("type", "video")
      .order("created_at", { ascending: false })
      .limit(300);

    if (cursor) {
      q = q.lt("created_at", cursor);
    }

    const { data: batch, error } = await q;
    if (error) {
      console.error("Orphan scan:", error.message);
      break;
    }
    if (!batch?.length) break;

    const badIds = batch.filter((r) => !playableRow(r)).map((r) => r.id);
    if (badIds.length > 0) {
      console.log(`${tag} unplayable video: ${badIds.length} row(s)`);
      orphanTotal += badIds.length;
      if (!dryRun) {
        const { error: delErr } = await supabase
          .from("publications")
          .delete()
          .in("id", badIds);
        if (delErr) {
          console.error("Orphan delete failed:", delErr.message);
          break;
        }
        totalDeleted += badIds.length;
      }
    }

    const last = batch[batch.length - 1];
    cursor = last.created_at as string;
    if (batch.length < 300) break;
  }

  if (dryRun && orphanTotal > 0) {
    console.log(`${tag} unplayable video total (estimated from scan): ${orphanTotal}`);
  }

  if (dryRun) {
    console.log("\nDry run finished. Re-run with --i-am-sure to delete.");
  } else {
    console.log(`\nDone. Deleted at least ${totalDeleted} publication(s).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
