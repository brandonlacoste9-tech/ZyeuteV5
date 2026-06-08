import axios from "axios";
import { TikApiService, type TikVideo } from "./tikapi-service.js";
import { TikHubService } from "./tikhub-service.js";
import {
  getOmkarApiKeys,
  isOmkarKeyConfigured,
  omkarRequest,
} from "../utils/omkar-keys.js";

const OMKAR_BASE_URL = "https://tiktok-scraper.omkar.cloud";
const TIKWM_DETAILS_URL = "https://www.tikwm.com/api/";
const APIFY_BASE_URL = "https://api.apify.com/v2";
const APIFY_API_KEY = process.env.APIFY_API_KEY;
const TIKHUB_API_KEY = process.env.TIKHUB_API_KEY;
const APIFY_TIKTOK_ACTOR =
  process.env.APIFY_TIKTOK_ACTOR_ID || "clockworks/free-tiktok-scraper";

export interface TikTokVideo {
  video_id: string;
  caption: string;
  author: {
    handle: string;
    nickname: string;
    avatar: string;
  };
  media: {
    video_url: string;
    hd_video_url?: string;
  };
  thumbnails: {
    cover_url: string;
  };
  stats: {
    likes: number;
    views: number;
    shares: number;
    comments?: number;
  };
  original_url?: string;
  provider?: "omkar" | "tikapi" | "tikwm" | "apify" | "tikhub";
}

function omkarHeaders(apiKey: string) {
  return {
    "API-Key": apiKey,
  };
}

/** Normalize user search text into a single hashtag token for TikAPI. */
function queryToHashtag(query: string): string {
  const t = query.replace(/^#/, "").trim();
  if (!t) return "quebec";
  const first = t.split(/\s+/)[0];
  return first.replace(/[^a-zA-Z0-9_]/g, "") || "quebec";
}

function urlFromTikApiMediaField(field: unknown): string | undefined {
  if (typeof field === "string" && field.startsWith("http")) return field;
  if (!field || typeof field !== "object") return undefined;
  const list =
    (field as { url_list?: string[] }).url_list ??
    (field as { urlList?: string[] }).urlList;
  return list?.[0];
}

export function mapTikApiRawItemToVideo(
  item: Record<string, unknown> | null | undefined,
): TikTokVideo | null {
  if (!item || typeof item !== "object") return null;
  const videoId = item.id as string | undefined;
  if (!videoId) return null;
  const v = item.video as Record<string, unknown> | undefined;
  const videoUrl =
    urlFromTikApiMediaField(v?.play_addr) ||
    urlFromTikApiMediaField(v?.playAddr) ||
    urlFromTikApiMediaField(v?.download_addr) ||
    urlFromTikApiMediaField(v?.downloadAddr);
  if (!videoUrl) return null;
  const coverUrl =
    urlFromTikApiMediaField(v?.cover) ||
    urlFromTikApiMediaField(v?.dynamicCover) ||
    urlFromTikApiMediaField(v?.originCover);
  const author = item.author as Record<string, unknown> | undefined;
  const avatarThumb = author?.avatar_thumb as
    | { url_list?: string[] }
    | undefined;
  const statsRaw = (item.statistics ?? item.stats) as
    | Record<string, number>
    | undefined;
  const stats = statsRaw
    ? {
        digg_count: statsRaw.digg_count ?? statsRaw.diggCount,
        play_count: statsRaw.play_count ?? statsRaw.playCount,
        share_count: statsRaw.share_count ?? statsRaw.shareCount,
        comment_count: statsRaw.comment_count ?? statsRaw.commentCount,
      }
    : undefined;
  const handle =
    (author?.unique_id as string) || (author?.nickname as string) || "unknown";
  const nickname = (author?.nickname as string) || handle;
  return {
    video_id: String(videoId),
    caption: typeof item.desc === "string" ? item.desc : "",
    author: {
      handle,
      nickname,
      avatar: avatarThumb?.url_list?.[0] || "",
    },
    media: {
      video_url: videoUrl,
      hd_video_url:
        urlFromTikApiMediaField(v?.download_addr) ||
        urlFromTikApiMediaField(v?.downloadAddr),
    },
    thumbnails: {
      cover_url: coverUrl || "",
    },
    stats: {
      likes: stats?.digg_count ?? 0,
      views: stats?.play_count ?? 0,
      shares: stats?.share_count ?? 0,
      comments: stats?.comment_count,
    },
    original_url: `https://www.tiktok.com/@${handle}/video/${videoId}`,
    provider: "tikapi",
  };
}

function mapTikWmDetailsToVideo(
  payload: Record<string, unknown> | null | undefined,
  originalUrl: string,
): TikTokVideo | null {
  if (!payload || typeof payload !== "object") return null;
  const code = payload.code;
  if (code !== 0) return null;

  const data = payload.data as Record<string, unknown> | undefined;
  if (!data) return null;

  const videoId = data.id;
  const play = data.play;
  const hdPlay = data.hdplay;
  if (typeof videoId !== "string") return null;
  if (typeof play !== "string" && typeof hdPlay !== "string") return null;

  const author = (data.author as Record<string, unknown> | undefined) ?? {};
  const handle =
    (typeof author.unique_id === "string" && author.unique_id) ||
    (typeof author.nickname === "string" && author.nickname) ||
    "unknown";

  return {
    video_id: videoId,
    caption: typeof data.title === "string" ? data.title : "",
    author: {
      handle,
      nickname:
        (typeof author.nickname === "string" && author.nickname) || handle,
      avatar: typeof author.avatar === "string" ? author.avatar : "",
    },
    media: {
      video_url:
        (typeof play === "string" && play) ||
        (typeof hdPlay === "string" ? hdPlay : ""),
      hd_video_url: typeof hdPlay === "string" ? hdPlay : undefined,
    },
    thumbnails: {
      cover_url:
        (typeof data.cover === "string" && data.cover) ||
        (typeof data.origin_cover === "string" ? data.origin_cover : ""),
    },
    stats: {
      likes: typeof data.digg_count === "number" ? data.digg_count : 0,
      views: typeof data.play_count === "number" ? data.play_count : 0,
      shares: typeof data.share_count === "number" ? data.share_count : 0,
      comments: typeof data.comment_count === "number" ? data.comment_count : 0,
    },
    original_url: originalUrl,
    provider: "tikwm",
  };
}

function mapApifyItemToVideo(
  item: Record<string, unknown> | null | undefined,
): TikTokVideo | null {
  if (!item || typeof item !== "object") return null;
  const videoId = item.id as string | undefined;
  if (!videoId) return null;

  const authorMeta =
    (item.authorMeta as Record<string, unknown> | undefined) ?? {};
  const videoMeta =
    (item.videoMeta as Record<string, unknown> | undefined) ?? {};
  const handle =
    (typeof authorMeta.name === "string" && authorMeta.name) ||
    (typeof authorMeta.nickName === "string" && authorMeta.nickName) ||
    "unknown";
  const webVideoUrl =
    typeof item.webVideoUrl === "string" ? item.webVideoUrl : undefined;

  return {
    video_id: videoId,
    caption: typeof item.text === "string" ? item.text : "",
    author: {
      handle,
      nickname:
        (typeof authorMeta.nickName === "string" && authorMeta.nickName) ||
        handle,
      avatar: typeof authorMeta.avatar === "string" ? authorMeta.avatar : "",
    },
    media: {
      // Apify search/trending results usually omit direct MP4s.
      video_url: "",
    },
    thumbnails: {
      cover_url:
        (typeof videoMeta.coverUrl === "string" && videoMeta.coverUrl) || "",
    },
    stats: {
      likes: typeof item.diggCount === "number" ? item.diggCount : 0,
      views: typeof item.playCount === "number" ? item.playCount : 0,
      shares: typeof item.shareCount === "number" ? item.shareCount : 0,
      comments: typeof item.commentCount === "number" ? item.commentCount : 0,
    },
    original_url: webVideoUrl,
    provider: "apify",
  };
}

async function runApifyTikTokActor(
  input: Record<string, unknown>,
): Promise<TikTokVideo[]> {
  if (!APIFY_API_KEY) return [];

  try {
    const actorPath = APIFY_TIKTOK_ACTOR.replace("/", "~");
    const response = await axios.post(
      `${APIFY_BASE_URL}/acts/${actorPath}/run-sync-get-dataset-items`,
      input,
      {
        params: {
          token: APIFY_API_KEY,
          memory: 4096,
        },
        headers: { "Content-Type": "application/json" },
        timeout: 120000,
      },
    );

    const list = Array.isArray(response.data) ? response.data : [];
    return list
      .map((item) => mapApifyItemToVideo(item as Record<string, unknown>))
      .filter((x): x is TikTokVideo => x != null);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[TikTok Service] Apify actor failed:", msg);
    return [];
  }
}

export function mapTikApiServiceVideoToScraper(t: TikVideo): TikTokVideo {
  const handle = t.author.unique_id || t.author.nickname || "unknown";
  return {
    video_id: t.id,
    caption: t.description,
    author: {
      handle,
      nickname: t.author.nickname || handle,
      avatar: t.author.avatar,
    },
    media: {
      video_url: t.video_url,
    },
    thumbnails: {
      cover_url: t.cover_url,
    },
    stats: {
      likes: t.statistics.digg_count,
      views: t.statistics.play_count,
      shares: t.statistics.share_count,
      comments: t.statistics.comment_count,
    },
    original_url: `https://www.tiktok.com/@${handle}/video/${t.id}`,
    provider: "tikapi",
  };
}

export function missingTikTokProviderErrorMessage(): string {
  return "Aucun fournisseur TikTok configuré: définir TIKTOK_SCRAPER_API_KEY (Omkar), APIFY_API_KEY, TIKAPI_KEY, ou TIKHUB_API_KEY.";
}

export function isOmkarConfigured(): boolean {
  return isOmkarKeyConfigured();
}

/** Map Omkar REST JSON → internal TikTokVideo (display_name, avatar_url, etc.). */
export function mapOmkarItemToVideo(
  raw: Record<string, unknown> | null | undefined,
  originalUrl?: string,
): TikTokVideo | null {
  if (!raw || typeof raw !== "object") return null;

  const videoId = raw.video_id != null ? String(raw.video_id) : "";
  if (!videoId) return null;

  const author = (raw.author as Record<string, unknown> | undefined) ?? {};
  const handle =
    (typeof author.handle === "string" && author.handle) || "unknown";
  const nickname =
    (typeof author.display_name === "string" && author.display_name) ||
    (typeof author.nickname === "string" && author.nickname) ||
    handle;
  const avatar =
    (typeof author.avatar_url === "string" && author.avatar_url) ||
    (typeof author.avatar === "string" && author.avatar) ||
    "";

  const mediaRaw = (raw.media as Record<string, unknown> | undefined) ?? {};
  const standardUrl =
    typeof mediaRaw.video_url === "string" ? mediaRaw.video_url : "";
  const hdUrl =
    typeof mediaRaw.hd_video_url === "string" ? mediaRaw.hd_video_url : "";
  const videoUrl =
    (hdUrl.startsWith("http") ? hdUrl : "") ||
    (standardUrl.startsWith("http") ? standardUrl : "");
  if (!videoUrl.startsWith("http")) return null;

  const thumbs = (raw.thumbnails as Record<string, unknown> | undefined) ?? {};
  const coverUrl =
    (typeof thumbs.cover_url === "string" && thumbs.cover_url) ||
    (typeof thumbs.original_cover_url === "string" &&
      thumbs.original_cover_url) ||
    "";

  const statsRaw = (raw.stats as Record<string, unknown> | undefined) ?? {};
  const pageUrl =
    originalUrl?.trim() ||
    (typeof raw.original_url === "string" ? raw.original_url : "") ||
    `https://www.tiktok.com/@${handle}/video/${videoId}`;

  return {
    video_id: videoId,
    caption: typeof raw.caption === "string" ? raw.caption : "",
    author: { handle, nickname, avatar },
    media: {
      video_url: videoUrl,
      hd_video_url:
        hdUrl.startsWith("http") && hdUrl !== videoUrl ? hdUrl : undefined,
    },
    thumbnails: { cover_url: coverUrl },
    stats: {
      likes: Number(statsRaw.likes ?? 0) || 0,
      views: Number(statsRaw.views ?? 0) || 0,
      shares: Number(statsRaw.shares ?? 0) || 0,
      comments: Number(statsRaw.comments ?? 0) || 0,
    },
    original_url: pageUrl,
    provider: "omkar",
  };
}

function mapOmkarList(
  list: unknown,
  originalUrlForSingle?: string,
): TikTokVideo[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) =>
      mapOmkarItemToVideo(
        item as Record<string, unknown>,
        originalUrlForSingle,
      ),
    )
    .filter((x): x is TikTokVideo => x != null);
}

export class TikTokScraperService {
  private static async searchOmkar(
    query: string,
    maxResults: number,
    sortBy: "relevance" | "most_liked" | "latest" = "relevance",
  ): Promise<TikTokVideo[]> {
    const data = await omkarRequest<{ videos?: unknown }>((apiKey) => ({
      method: "get",
      url: `${OMKAR_BASE_URL}/tiktok/videos/search`,
      params: {
        search_query: query,
        market: "ca",
        max_results: maxResults,
        sort_by: sortBy,
      },
      headers: omkarHeaders(apiKey),
      timeout: 45000,
    }));
    return mapOmkarList(data?.videos);
  }

  private static async getTrendingOmkar(
    maxResults: number,
  ): Promise<TikTokVideo[]> {
    const data = await omkarRequest<{ videos?: unknown }>((apiKey) => ({
      method: "get",
      url: `${OMKAR_BASE_URL}/tiktok/videos/trending`,
      params: {
        market: "ca",
        max_results: maxResults,
      },
      headers: omkarHeaders(apiKey),
      timeout: 45000,
    }));
    return mapOmkarList(data?.videos);
  }

  /**
   * Search for TikTok videos (Omkar when keyed, else TikAPI hashtag).
   */
  static async search(
    query: string,
    maxResults: number = 15,
  ): Promise<TikTokVideo[]> {
    if (isOmkarKeyConfigured()) {
      try {
        const { isQuebecQuery } = await import("../utils/quebec-relevance.js");
        const sortBy = isQuebecQuery(query) ? "most_liked" : "relevance";
        const videos = await this.searchOmkar(query, maxResults, sortBy);
        if (videos.length > 0) return videos;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[TikTok Service] Omkar search failed:", msg);
      }
    }

    if (process.env.TIKAPI_KEY) {
      const tag = queryToHashtag(query);
      const items = await TikApiService.searchByHashtag(tag, maxResults);
      const list = Array.isArray(items) ? items : [];
      const mapped = list
        .map((item) => mapTikApiRawItemToVideo(item as Record<string, unknown>))
        .filter((x): x is TikTokVideo => x != null);
      if (mapped.length > 0) return mapped;
    }

    if (APIFY_API_KEY) {
      try {
        const videos = await runApifyTikTokActor({
          searchQueries: [query],
          resultsPerPage: maxResults,
        });
        if (videos.length > 0) return videos;
      } catch (err: any) {
        console.warn("[TikTok Service] Apify search failed:", err.message);
      }
    }

    if (TIKHUB_API_KEY) {
      try {
        const items = await TikHubService.searchVideos(query, maxResults);
        const mapped = items
          .map((item: any) => mapTikApiRawItemToVideo(item))
          .filter((x: any): x is TikTokVideo => x != null)
          .map((v: any) => ({ ...v, provider: "tikhub" as const }));
        if (mapped.length > 0) return mapped;
      } catch (err: any) {
        console.warn("[TikTok Service] TikHub search failed:", err.message);
      }
    }

    throw new Error(missingTikTokProviderErrorMessage());
  }

  /**
   * Trending (Omkar when keyed, else TikAPI explore for CA).
   */
  static async getTrending(maxResults: number = 15): Promise<TikTokVideo[]> {
    if (isOmkarKeyConfigured()) {
      try {
        const videos = await this.getTrendingOmkar(maxResults);
        if (videos.length > 0) return videos;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[TikTok Service] Omkar trending failed:", msg);
      }
    }

    if (process.env.TIKAPI_KEY) {
      const items = await TikApiService.getTrendingVideos("CA", maxResults);
      const mapped = items.map(mapTikApiServiceVideoToScraper);
      if (mapped.length > 0) return mapped;
    }

    if (APIFY_API_KEY) {
      const videos = await runApifyTikTokActor({
        hashtags: ["fyp", "viral", "trending", "foryoupage"],
        resultsPerPage: Math.max(1, Math.min(5, maxResults)),
      });
      return videos
        .sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0))
        .slice(0, maxResults);
    }

    throw new Error(missingTikTokProviderErrorMessage());
  }

  /**
   * Video details from URL.
   * Priority: Omkar when configured, then TikWM public fallback.
   */
  static async getVideoDetails(videoUrl: string): Promise<TikTokVideo | null> {
    if (isOmkarKeyConfigured()) {
      try {
        const data = await omkarRequest<Record<string, unknown>>((apiKey) => ({
          method: "get",
          url: `${OMKAR_BASE_URL}/tiktok/videos/details`,
          params: { video_url: videoUrl },
          headers: omkarHeaders(apiKey),
          timeout: 45000,
        }));
        if (data && typeof data === "object") {
          return mapOmkarItemToVideo(data, videoUrl);
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn(
          "[TikTok Service] Omkar details failed, trying TikWM:",
          msg,
        );
      }
    }

    try {
      const body = new URLSearchParams();
      body.set("url", videoUrl);
      body.set("hd", "1");
      const response = await axios.post(TIKWM_DETAILS_URL, body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        timeout: 20000,
      });
      return mapTikWmDetailsToVideo(response.data, videoUrl);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[TikTok Service] TikWM details failed:", msg);
      return null;
    }
  }
}
