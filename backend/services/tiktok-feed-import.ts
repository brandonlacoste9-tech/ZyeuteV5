/**
 * Shared TikTok → publications import (HTTP curation + background job).
 */
import { db, storage } from "../storage.js";
import { posts, users } from "../../shared/schema.js";
import { sql } from "drizzle-orm";
import { v3Mod } from "../v3-swarm.js";
import {
  TikTokScraperService,
  type TikTokVideo,
} from "./tiktok-scraper-service.js";

export type TikTokFeedImportResult =
  | { ok: true; postId: string }
  | {
      ok: false;
      reason:
        | "duplicate"
        | "moderation"
        | "no_media"
        | "no_system_user"
        | "invalid_payload"
        | "details_fetch_failed"
        | "database_error";
      postId?: string;
      detail?: string;
    };

/** Failure shape only — used when resolving payload before import. */
export type TikTokResolveImportError = Extract<
  TikTokFeedImportResult,
  { ok: false }
>;

export async function resolveImportAuthorId(): Promise<string | null> {
  const bot = await storage.getUserByUsername("ti_guy_bot");
  if (bot) return bot.id;
  const scout = await storage.getUserByUsername("zyeute_scout");
  if (scout) return scout.id;
  const row = await db.select({ id: users.id }).from(users).limit(1);
  return row[0]?.id ?? null;
}

export function hasImportableVideoPayload(v: unknown): v is TikTokVideo {
  if (!v || typeof v !== "object") return false;
  const o = v as TikTokVideo;
  return Boolean(
    o.video_id &&
    o.media &&
    typeof o.media.video_url === "string" &&
    o.media.video_url.length > 0,
  );
}

export type ImportTikTokOptions = {
  /** Explicit page URL (e.g. from URL-only import). */
  videoUrlHint?: string;
  /** mediaMetadata.source (default tiktok-scraper). */
  metadataSource?: string;
};

/**
 * Resolve payload: use full video object, or fetch details when `videoUrl` is set (Omkar required).
 */
export async function resolveTikTokVideoForImport(
  raw: unknown,
  videoUrl: string | undefined,
): Promise<
  { video: TikTokVideo; provider: string } | { error: TikTokResolveImportError }
> {
  let v = raw;
  if (!hasImportableVideoPayload(v)) {
    const url = videoUrl?.trim();
    if (!url) {
      return {
        error: {
          ok: false,
          reason: "invalid_payload",
          detail: "Missing video object or URL.",
        },
      };
    }
    const fetched = await TikTokScraperService.getVideoDetails(url);
    if (!fetched || !hasImportableVideoPayload(fetched)) {
      return {
        error: {
          ok: false,
          reason: "details_fetch_failed",
          detail: "Could not load video details for URL.",
        },
      };
    }
    v = fetched;
  }

  return {
    video: v as TikTokVideo,
    provider: (v as TikTokVideo).provider ?? "tiktok-url-import",
  };
}

/**
 * Insert one TikTok video as a public post (moderation + dedupe by tiktok_id).
 */
export async function importTikTokVideoToFeed(
  video: TikTokVideo,
  opts: ImportTikTokOptions = {},
): Promise<TikTokFeedImportResult> {
  const videoUrlHint = opts.videoUrlHint?.trim() || "";
  const metadataSource = opts.metadataSource ?? "tiktok-scraper";

  const videoId = video.video_id;
  if (!videoId) {
    return { ok: false, reason: "invalid_payload", detail: "video_id" };
  }

  const existing = await db
    .select({ id: posts.id })
    .from(posts)
    .where(sql`${posts.mediaMetadata}->>'tiktok_id' = ${videoId}`)
    .limit(1);

  if (existing.length > 0) {
    return {
      ok: false,
      reason: "duplicate",
      postId: existing[0].id,
    };
  }

  const caption =
    typeof video.caption === "string"
      ? video.caption
      : "TikTok — import curation";
  const content = caption || "TikTok Import";
  const modResult = await v3Mod(`${caption} ${content}`);
  if (modResult.is_minor_danger || modResult.status !== "approved") {
    return {
      ok: false,
      reason: "moderation",
      detail: modResult.reason,
    };
  }

  const pageUrl =
    videoUrlHint ||
    video.original_url ||
    (video.author?.handle
      ? `https://www.tiktok.com/@${video.author.handle}/video/${videoId}`
      : "");

  const mediaUrl =
    video.media?.video_url ||
    video.media?.hd_video_url ||
    (video.media as { download_addr?: string } | undefined)?.download_addr;
  if (!mediaUrl || typeof mediaUrl !== "string") {
    return { ok: false, reason: "no_media" };
  }

  const hlsOrHd =
    video.media?.hd_video_url && video.media.hd_video_url !== mediaUrl
      ? video.media.hd_video_url
      : null;

  const thumbnailUrl =
    video.thumbnails?.cover_url ||
    (video.thumbnails as { origin_cover_url?: string } | undefined)
      ?.origin_cover_url ||
    (video as { video?: { cover?: string } }).video?.cover ||
    null;

  const authorHandle =
    video.author?.handle ||
    (video.author as { unique_id?: string } | undefined)?.unique_id ||
    video.author?.nickname ||
    null;

  const userId = await resolveImportAuthorId();
  if (!userId) {
    return { ok: false, reason: "no_system_user" };
  }

  const hiveUser = await storage.getUser(userId);
  const hiveId = hiveUser?.hiveId || "quebec";

  try {
    const post = await storage.createPost({
      userId,
      type: "video",
      mediaUrl,
      hlsUrl: hlsOrHd || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      content,
      caption,
      visibility: "public",
      hiveId,
      processingStatus: "completed",
      fireCount: typeof video.stats?.likes === "number" ? video.stats.likes : 0,
      mediaMetadata: {
        tiktok_id: videoId,
        author: authorHandle,
        source: metadataSource,
        stats: video.stats ?? {},
        original_url: pageUrl || undefined,
      },
      isModerated: true,
      moderationApproved: true,
      isHidden: false,
    } as any);

    return { ok: true, postId: post.id };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[TikTok import] insert failed:", msg);
    return {
      ok: false,
      reason: "database_error",
      detail: msg,
    };
  }
}
