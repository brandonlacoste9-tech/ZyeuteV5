/**
 * Normalize /api/seed/custom payloads → Mux-aware TikAPI import pipeline.
 */
import type { FeedSeedCandidate } from "./tikapi-hashtag.js";
import type { TikTokVideo } from "./tiktok-scraper-service.js";
import { importFeedSeedCandidates } from "./tikapi-feed-insert.js";

export function rowToFeedSeedCandidate(
  row: Record<string, unknown>,
): FeedSeedCandidate | null {
  const meta =
    typeof row.media_metadata === "object" && row.media_metadata
      ? (row.media_metadata as Record<string, unknown>)
      : {};
  const tiktokId = String(meta.tiktok_id ?? "");
  const mediaUrl = String(row.media_url ?? "");
  if (!tiktokId || !mediaUrl.startsWith("http")) return null;

  const video: TikTokVideo = {
    video_id: tiktokId,
    caption: String(row.caption ?? row.content ?? "TikTok"),
    author: {
      handle: String(meta.author ?? "unknown"),
      nickname: String(meta.author ?? "unknown"),
      avatar: "",
    },
    media: {
      video_url: mediaUrl,
      hd_video_url: String(row.hls_url ?? mediaUrl),
    },
    thumbnails: {
      cover_url: String(row.thumbnail_url ?? ""),
    },
    stats: {
      likes: Number(row.reactions_count ?? 0),
      views: Number(row.view_count ?? 0),
      shares: Number(row.shares_count ?? 0),
      comments: Number(row.comments_count ?? 0),
    },
    original_url: String(meta.original_url ?? row.original_url ?? ""),
    provider: (meta.provider as TikTokVideo["provider"]) ?? "tikwm",
  };

  return {
    video,
    region: String(row.region_id ?? "montreal"),
    source: String(meta.source ?? "custom-seed"),
  };
}

export async function importCustomSeedVideos(options: {
  videos: Record<string, unknown>[];
  supabaseUrl: string;
  supabaseServiceKey: string;
  databaseUrl?: string;
}): Promise<{
  muxPipeline: Awaited<ReturnType<typeof importFeedSeedCandidates>>;
  legacyInserted: number;
  legacyFailed: number;
}> {
  const candidates: FeedSeedCandidate[] = [];
  const legacy: Record<string, unknown>[] = [];

  for (const row of options.videos) {
    const c = rowToFeedSeedCandidate(row);
    if (c) candidates.push(c);
    else legacy.push(row);
  }

  const muxPipeline =
    candidates.length > 0
      ? await importFeedSeedCandidates({
          candidates,
          maxImport: candidates.length,
          databaseUrl: options.databaseUrl,
          supabaseUrl: options.supabaseUrl,
          supabaseServiceKey: options.supabaseServiceKey,
        })
      : {
          imported: 0,
          skipped: 0,
          duplicate: 0,
          failed: 0,
          mirrored: 0,
          muxIngested: 0,
        };

  let legacyInserted = 0;
  let legacyFailed = 0;

  if (legacy.length > 0) {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      options.supabaseUrl,
      options.supabaseServiceKey,
    );
    for (const video of legacy) {
      const { error } = await supabase.from("publications").insert({
        ...video,
        type: "video",
        visibility: "public",
        est_masque: false,
        moderation_approved: true,
        processing_status: video.processing_status ?? "completed",
      });
      if (error) legacyFailed++;
      else legacyInserted++;
    }
  }

  return { muxPipeline, legacyInserted, legacyFailed };
}
