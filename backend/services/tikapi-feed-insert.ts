/**
 * Insert TikAPI-sourced videos into publications (Postgres or Supabase REST).
 * Mirrors MP4s to Supabase Storage so Pour toi playback survives CDN expiry.
 */
import { randomUUID } from "crypto";
import pg from "pg";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TikTokVideo } from "./tiktok-scraper-service.js";
import type { FeedSeedCandidate } from "./tikapi-hashtag.js";
import { resolvePlayableTikTokMediaUrl } from "./tiktok-mirror-storage.js";
import {
  ingestTikTokVideoToMux,
  isMuxIngestConfigured,
} from "./tiktok-mux-ingest.js";
import { isExpiringTikTokCdnUrl } from "../utils/playable-media.js";

const { Pool } = pg;

export type TikApiInsertStats = {
  imported: number;
  skipped: number;
  duplicate: number;
  failed: number;
  mirrored: number;
  muxIngested: number;
};

async function buildPublicationRow(
  userId: string,
  video: TikTokVideo,
  regionId: string,
  source: string,
  supabase: SupabaseClient | null,
): Promise<Record<string, unknown> | null> {
  const hd = video.media?.hd_video_url;
  const sd = video.media?.video_url;
  const caption = (video.caption || "TikTok").slice(0, 500);

  const muxResult =
    isMuxIngestConfigured() &&
    (await ingestTikTokVideoToMux({
      tiktokId: video.video_id,
      hdUrl: hd,
      sdUrl: sd,
      supabase,
    }));

  if (muxResult) {
    return {
      user_id: userId,
      type: "video",
      media_url: muxResult.hlsUrl,
      hls_url: muxResult.hlsUrl,
      mux_playback_id: muxResult.muxPlaybackId,
      original_url: video.original_url || muxResult.hlsUrl,
      thumbnail_url:
        video.thumbnails?.cover_url || muxResult.thumbnailUrl || null,
      caption,
      content: caption,
      visibility: "public",
      hive_id: "quebec",
      region_id: regionId,
      video_source: "tiktok",
      processing_status: "processing",
      is_moderated: true,
      moderation_approved: true,
      est_masque: false,
      reactions_count: video.stats?.likes ?? 0,
      view_count: video.stats?.views ?? 0,
      comments_count: video.stats?.comments ?? 0,
      shares_count: video.stats?.shares ?? 0,
      viral_score: video.stats?.likes ?? video.stats?.views ?? 0,
      aspect_ratio: "9:16",
      media_metadata: {
        tiktok_id: video.video_id,
        author: video.author?.handle ?? null,
        source,
        stats: video.stats ?? {},
        original_url: video.original_url,
        mux_asset_id: muxResult.muxAssetId,
        mux_playback_id: muxResult.muxPlaybackId,
        mux_ingested: true,
        staging_url: muxResult.stagingUrl,
      },
    };
  }

  const mediaUrl = await resolvePlayableTikTokMediaUrl(
    supabase,
    video.video_id,
    hd,
    sd,
    source.includes("apify") ? "apify" : "tikapi",
  );
  if (!mediaUrl) return null;

  const mirrored = !isExpiringTikTokCdnUrl(mediaUrl);

  return {
    user_id: userId,
    type: "video",
    media_url: mediaUrl,
    original_url: video.original_url || mediaUrl,
    thumbnail_url: video.thumbnails?.cover_url || null,
    caption,
    content: caption,
    visibility: "public",
    hive_id: "quebec",
    region_id: regionId,
    video_source: "tiktok",
    processing_status: "completed",
    is_moderated: true,
    moderation_approved: true,
    est_masque: false,
    reactions_count: video.stats?.likes ?? 0,
    view_count: video.stats?.views ?? 0,
    comments_count: video.stats?.comments ?? 0,
    shares_count: video.stats?.shares ?? 0,
    viral_score: video.stats?.likes ?? video.stats?.views ?? 0,
    aspect_ratio: "9:16",
    media_metadata: {
      tiktok_id: video.video_id,
      author: video.author?.handle ?? null,
      source,
      stats: video.stats ?? {},
      original_url: video.original_url,
      storage_mirrored: mirrored,
      mirrored_at: mirrored ? new Date().toISOString() : undefined,
    },
  };
}

async function resolveAuthorPg(client: pg.PoolClient): Promise<string | null> {
  for (const username of [
    "ti_guy_bot",
    "zyeute_scout",
    "zyeute_ai",
    "zyeute_seed",
  ]) {
    const res = await client.query(
      `SELECT id FROM user_profiles WHERE username = $1 LIMIT 1`,
      [username],
    );
    if (res.rows[0]?.id) return res.rows[0].id as string;
  }
  const res = await client.query(`SELECT id FROM user_profiles LIMIT 1`);
  return (res.rows[0]?.id as string) ?? null;
}

async function resolveAuthorSupabase(
  supabase: SupabaseClient,
): Promise<string | null> {
  for (const username of [
    "ti_guy_bot",
    "zyeute_scout",
    "zyeute_ai",
    "zyeute_seed",
  ]) {
    const { data } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }
  const { data } = await supabase.from("user_profiles").select("id").limit(1);
  return (data?.[0]?.id as string) ?? null;
}

async function isDuplicatePg(
  client: pg.PoolClient,
  tiktokId: string,
): Promise<boolean> {
  const res = await client.query(
    `SELECT id FROM publications WHERE media_metadata->>'tiktok_id' = $1 LIMIT 1`,
    [tiktokId],
  );
  return res.rows.length > 0;
}

async function isDuplicateSupabase(
  supabase: SupabaseClient,
  tiktokId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("publications")
    .select("id")
    .contains("media_metadata", { tiktok_id: tiktokId })
    .limit(1);
  return !!data?.length;
}

async function insertPg(
  client: pg.PoolClient,
  row: Record<string, unknown>,
): Promise<void> {
  await client.query(
    `INSERT INTO publications (
      id, user_id, type, media_url, hls_url, mux_playback_id, original_url, thumbnail_url,
      content, caption, hive_id, region_id, visibility,
      processing_status, moderation_approved, est_masque,
      reactions_count, view_count, comments_count, shares_count, viral_score,
      aspect_ratio, media_metadata
    ) VALUES (
      $1, $2, 'video', $3, $4, $5, $6, $7,
      $8, $9, 'quebec', $10, 'public',
      $11, true, false,
      $12, $13, $14, $15, $16,
      $17, $18::jsonb
    )`,
    [
      randomUUID(),
      row.user_id,
      row.media_url,
      row.hls_url ?? null,
      row.mux_playback_id ?? null,
      row.original_url,
      row.thumbnail_url,
      row.content,
      row.caption,
      row.region_id,
      row.processing_status ?? "completed",
      row.reactions_count,
      row.view_count,
      row.comments_count,
      row.shares_count,
      row.viral_score,
      row.aspect_ratio,
      JSON.stringify(row.media_metadata),
    ],
  );
}

function trackImportStats(
  stats: TikApiInsertStats,
  row: Record<string, unknown>,
): void {
  if (row.mux_playback_id) {
    stats.muxIngested++;
    return;
  }
  if (String(row.media_url).includes("supabase.co/storage")) {
    stats.mirrored++;
  }
}

export async function countPublicFeedPostsPg(
  connectionString: string,
  hiveId = "quebec",
): Promise<number> {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  try {
    const res = await pool.query(
      `SELECT COUNT(*)::int AS c FROM publications
       WHERE visibility = 'public'
         AND (est_masque = false OR est_masque IS NULL)
         AND deleted_at IS NULL
         AND hive_id = $1
         AND processing_status = 'completed'
         AND media_url IS NOT NULL`,
      [hiveId],
    );
    return res.rows[0]?.c ?? 0;
  } finally {
    await pool.end();
  }
}

export async function countPublicFeedPostsSupabase(
  supabase: SupabaseClient,
  hiveId = "quebec",
): Promise<number> {
  const { count, error } = await supabase
    .from("publications")
    .select("id", { count: "exact", head: true })
    .eq("visibility", "public")
    .eq("est_masque", false)
    .is("deleted_at", null)
    .eq("hive_id", hiveId)
    .eq("processing_status", "completed")
    .not("media_url", "is", null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Posts that actually play in Pour toi (Supabase/Mux, not expiring TikTok CDN). */
export async function countPlayableFeedPostsSupabase(
  supabase: SupabaseClient,
  hiveId = "quebec",
): Promise<number> {
  const { data, error } = await supabase
    .from("publications")
    .select("id, media_url, mux_playback_id, hls_url")
    .eq("visibility", "public")
    .eq("est_masque", false)
    .is("deleted_at", null)
    .eq("hive_id", hiveId)
    .or(
      "processing_status.eq.completed,mux_playback_id.not.is.null,media_url.ilike.%stream.mux.com%",
    )
    .not("media_url", "is", null)
    .limit(5000);

  if (error) throw new Error(error.message);
  const { isExplorePlayablePost } = await import("../utils/playable-media.js");
  return (data ?? []).filter((p) =>
    isExplorePlayablePost(p as Record<string, unknown>),
  ).length;
}

export async function importFeedSeedCandidates(options: {
  candidates: FeedSeedCandidate[];
  maxImport: number;
  databaseUrl?: string;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
}): Promise<TikApiInsertStats> {
  const stats: TikApiInsertStats = {
    imported: 0,
    skipped: 0,
    duplicate: 0,
    failed: 0,
    mirrored: 0,
    muxIngested: 0,
  };

  const dbUrl = options.databaseUrl?.trim();
  const supabaseUrl = options.supabaseUrl?.trim();
  const serviceKey = options.supabaseServiceKey?.trim();
  const mirrorClient =
    supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

  if (dbUrl) {
    try {
      const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
      });
      const client = await pool.connect();
      try {
        const userId = await resolveAuthorPg(client);
        if (!userId) throw new Error("no_system_user");

        for (const c of options.candidates) {
          if (stats.imported >= options.maxImport) break;
          if (await isDuplicatePg(client, c.video.video_id)) {
            stats.duplicate++;
            continue;
          }
          try {
            const row = await buildPublicationRow(
              userId,
              c.video,
              c.region,
              c.source,
              mirrorClient,
            );
            if (!row) {
              stats.skipped++;
              continue;
            }
            trackImportStats(stats, row);
            await insertPg(client, row);
            stats.imported++;
          } catch {
            stats.failed++;
          }
        }
      } finally {
        client.release();
        await pool.end();
      }
      return stats;
    } catch (err) {
      if (!(supabaseUrl && serviceKey)) throw err;
      console.warn(
        "[TikAPI insert] DATABASE_URL failed, using Supabase HTTP:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  if (supabaseUrl && serviceKey) {
    const supabase = createClient(supabaseUrl, serviceKey);
    const userId = await resolveAuthorSupabase(supabase);
    if (!userId) throw new Error("no_system_user");

    for (const c of options.candidates) {
      if (stats.imported >= options.maxImport) break;
      if (await isDuplicateSupabase(supabase, c.video.video_id)) {
        stats.duplicate++;
        continue;
      }
      const row = await buildPublicationRow(
        userId,
        c.video,
        c.region,
        c.source,
        supabase,
      );
      if (!row) {
        stats.skipped++;
        continue;
      }
      trackImportStats(stats, row);
      const { error } = await supabase.from("publications").insert(row);
      if (error) {
        stats.failed++;
        continue;
      }
      stats.imported++;
    }
    return stats;
  }

  throw new Error(
    "No database target: set DATABASE_URL or VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY",
  );
}
