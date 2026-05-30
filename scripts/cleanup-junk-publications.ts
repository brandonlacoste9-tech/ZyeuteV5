/**
 * Remove junk rows from `publications` that cause blank/test feeds.
 * Logic matches frontend `postHasPlayableMedia` + obvious test captions.
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

/** Same rules as frontend `postHasPlayableMedia` (api.ts). */
function publicationHasPlayableMedia(row: {
  media_url?: string | null;
  hls_url?: string | null;
  mux_playback_id?: string | null;
}): boolean {
  const mux = String(row.mux_playback_id ?? "").trim();
  if (mux.length >= 8) return true;
  const hls = String(row.hls_url ?? "").trim();
  if (hls.length >= 12 && /^https?:\/\//i.test(hls)) {
    if (/fal\.media|\.fal\.run/i.test(hls) && mux.length < 8) return false;
    return true;
  }
  const media = String(row.media_url ?? "").trim();
  if (media.length < 12 || !/^https?:\/\//i.test(media)) return false;
  if (/fal\.media|\.fal\.run/i.test(media)) return false;
  return true;
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
    // Supabase query builder chain; exact generic is verbose for a one-off script.
    filter: (
      q: ReturnType<typeof supabase.from>,
    ) => ReturnType<ReturnType<typeof supabase.from>["select"]>,
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

  // --- Exact status junk ---
  await deleteByQuery("processing_status = pending", (q) =>
    q.eq("processing_status", "pending"),
  );
  await deleteByQuery("processing_status = failed", (q) =>
    q.eq("processing_status", "failed"),
  );

  // --- Diagnostic / QA captions (align with feed filters) ---
  await deleteByQuery("caption ILIKE %DIAGNOSTIC%", (q) =>
    q.ilike("caption", "%DIAGNOSTIC%"),
  );
  await deleteByQuery("content ILIKE %DIAGNOSTIC%", (q) =>
    q.ilike("content", "%DIAGNOSTIC%"),
  );
  await deleteByQuery("caption ILIKE %TEST VIDEO%", (q) =>
    q.ilike("caption", "%TEST VIDEO%"),
  );
  await deleteByQuery("content ILIKE %TEST VIDEO%", (q) =>
    q.ilike("content", "%TEST VIDEO%"),
  );
  await deleteByQuery("caption ILIKE %VIDEO TEST%", (q) =>
    q.ilike("caption", "%VIDEO TEST%"),
  );
  await deleteByQuery("content ILIKE %VIDEO TEST%", (q) =>
    q.ilike("content", "%VIDEO TEST%"),
  );
  await deleteByQuery("caption ILIKE %PLACEHOLDER%", (q) =>
    q.ilike("caption", "%PLACEHOLDER%"),
  );
  await deleteByQuery("content ILIKE %PLACEHOLDER%", (q) =>
    q.ilike("content", "%PLACEHOLDER%"),
  );
  await deleteByQuery("caption ILIKE %DUMMY VIDEO%", (q) =>
    q.ilike("caption", "%DUMMY VIDEO%"),
  );
  await deleteByQuery("caption ILIKE %SEED CONTENT%", (q) =>
    q.ilike("caption", "%SEED CONTENT%"),
  );

  // --- Expired / non-feed FAL CDN URLs ---
  await deleteByQuery("media_url ILIKE %fal.media%", (q) =>
    q.ilike("media_url", "%fal.media%"),
  );
  await deleteByQuery("media_url ILIKE %.fal.run%", (q) =>
    q.ilike("media_url", "%.fal.run%"),
  );
  await deleteByQuery("hls_url ILIKE %fal.media%", (q) =>
    q.ilike("hls_url", "%fal.media%"),
  );
  await deleteByQuery("hls_url ILIKE %.fal.run%", (q) =>
    q.ilike("hls_url", "%.fal.run%"),
  );

  // --- Stuck in processing for a long time (likely abandoned uploads) ---
  const stuckCutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  await deleteByQuery(
    `processing_status = processing AND created_at < ${stuckCutoff.slice(0, 10)} (48h)`,
    (q) =>
      q.eq("processing_status", "processing").lt("created_at", stuckCutoff),
  );

  // --- Unplayable videos: keyset pagination on created_at ---
  let cursor: string | null = null;
  let orphanTotal = 0;
  let pages = 0;
  const maxPages = 800;

  for (;;) {
    pages++;
    if (pages > maxPages) {
      console.warn(
        `${tag} unplayable scan stopped after ${maxPages} pages (safety cap).`,
      );
      break;
    }

    let q = supabase
      .from("publications")
      .select("id, media_url, hls_url, mux_playback_id, created_at")
      .eq("type", "video")
      .order("created_at", { ascending: false })
      .limit(400);

    if (cursor) {
      q = q.lt("created_at", cursor);
    }

    const { data: batch, error } = await q;
    if (error) {
      console.error("Unplayable scan:", error.message);
      break;
    }
    if (!batch?.length) break;

    const badIds = batch
      .filter((r) => !publicationHasPlayableMedia(r))
      .map((r) => r.id);
    if (badIds.length > 0) {
      console.log(`${tag} unplayable video (batch): ${badIds.length} row(s)`);
      orphanTotal += badIds.length;
      if (!dryRun) {
        const { error: delErr } = await supabase
          .from("publications")
          .delete()
          .in("id", badIds);
        if (delErr) {
          console.error("Unplayable delete failed:", delErr.message);
          break;
        }
        totalDeleted += badIds.length;
      }
    }

    const last = batch[batch.length - 1];
    cursor = last.created_at as string;
    if (batch.length < 400) break;
  }

  if (dryRun && orphanTotal > 0) {
    console.log(
      `${tag} unplayable video total (estimated from scan): ${orphanTotal}`,
    );
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
