/**
 * Backfill: re-ingest broken TikTok CDN rows into Mux (preferred) or Supabase.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isExpiringTikTokCdnUrl,
  isReliablePlaybackMedia,
} from "../utils/playable-media.js";
import { ingestTikTokVideoToMux } from "./tiktok-mux-ingest.js";
import { mirrorTikTokVideoToSupabase } from "./tiktok-mirror-storage.js";

export type BackfillMirrorStats = {
  scanned: number;
  muxIngested: number;
  mirrored: number;
  skipped: number;
  failed: number;
};

export async function backfillTikTokToMuxOrStorage(options: {
  supabaseUrl: string;
  supabaseServiceKey: string;
  limit?: number;
  hiveId?: string;
}): Promise<BackfillMirrorStats> {
  const stats: BackfillMirrorStats = {
    scanned: 0,
    muxIngested: 0,
    mirrored: 0,
    skipped: 0,
    failed: 0,
  };

  const limit = Math.min(options.limit ?? 10, 50);
  const hiveId = options.hiveId ?? "quebec";
  const supabase = createClient(
    options.supabaseUrl,
    options.supabaseServiceKey,
  );

  const rows = await findUnmirroredTikTokPosts(supabase, hiveId, limit);
  stats.scanned = rows.length;

  for (const row of rows) {
    const tiktokId = String(
      (row.media_metadata as { tiktok_id?: string } | null)?.tiktok_id ??
        row.id,
    );
    const sourceUrl = String(row.media_url ?? "");
    if (!isExpiringTikTokCdnUrl(sourceUrl)) {
      stats.skipped++;
      continue;
    }

    const muxResult = await ingestTikTokVideoToMux({
      tiktokId,
      hdUrl: sourceUrl,
      sdUrl: sourceUrl,
      supabase,
    });

    if (muxResult) {
      const meta = buildUpdatedMeta(row.media_metadata, {
        mux_asset_id: muxResult.muxAssetId,
        mux_playback_id: muxResult.muxPlaybackId,
        mux_ingested: true,
        previous_media_url: sourceUrl,
      });
      const { error } = await supabase
        .from("publications")
        .update({
          media_url: muxResult.hlsUrl,
          hls_url: muxResult.hlsUrl,
          mux_playback_id: muxResult.muxPlaybackId,
          thumbnail_url: row.thumbnail_url || muxResult.thumbnailUrl,
          processing_status: "processing",
          media_metadata: meta,
        })
        .eq("id", row.id);
      if (error) {
        stats.failed++;
        continue;
      }
      stats.muxIngested++;
      continue;
    }

    const mirrored = await mirrorTikTokVideoToSupabase(
      supabase,
      tiktokId,
      sourceUrl,
      "backfill",
    );
    if (!mirrored) {
      stats.failed++;
      continue;
    }

    const meta = buildUpdatedMeta(row.media_metadata, {
      storage_mirrored: true,
      previous_media_url: sourceUrl,
    });
    const { error } = await supabase
      .from("publications")
      .update({ media_url: mirrored, media_metadata: meta })
      .eq("id", row.id);

    if (error) {
      stats.failed++;
      continue;
    }
    stats.mirrored++;
  }

  return stats;
}

function buildUpdatedMeta(
  existing: unknown,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(typeof existing === "object" && existing ? existing : {}),
    ...patch,
    mirrored_at: new Date().toISOString(),
  };
}

async function findUnmirroredTikTokPosts(
  supabase: SupabaseClient,
  hiveId: string,
  limit: number,
) {
  const { data, error } = await supabase
    .from("publications")
    .select("id, media_url, mux_playback_id, thumbnail_url, media_metadata")
    .eq("visibility", "public")
    .eq("hive_id", hiveId)
    .is("deleted_at", null)
    .or(
      "media_url.ilike.%v16-webapp%,media_url.ilike.%v19-webapp%,media_url.ilike.%tiktokv%,media_url.ilike.%byteoversea%,media_url.ilike.%muscdn%",
    )
    .order("created_at", { ascending: false })
    .limit(Math.min(limit * 3, 150));

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => {
      const media = String(row.media_url ?? "");
      if (isReliablePlaybackMedia(media, row.mux_playback_id)) return false;
      return isExpiringTikTokCdnUrl(media);
    })
    .slice(0, limit);
}
