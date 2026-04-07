import axios from "axios";
import { TikApiService, type TikVideo } from "./tikapi-service.js";

const OMKAR_BASE_URL = "https://tiktok-scraper.omkar.cloud";
const TIKWM_DETAILS_URL = "https://www.tikwm.com/api/";
const APIFY_BASE_URL = "https://api.apify.com/v2";
const TIKTOK_SCRAPER_API_KEY = process.env.TIKTOK_SCRAPER_API_KEY;
const APIFY_API_KEY = process.env.APIFY_API_KEY;
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
  provider?: "omkar" | "tikapi" | "tikwm" | "apify";
}

function omkarHeaders() {
  return {
    "API-Key": TIKTOK_SCRAPER_API_KEY || "",
  };
}

/** Normalize user search text into a single hashtag token for TikAPI. */
function queryToHashtag(query: string): string {
  const t = query.replace(/^#/, "").trim();
  if (!t) return "quebec";
  const first = t.split(/\s+/)[0];
  return first.replace(/[^a-zA-Z0-9_]/g, "") || "quebec";
}

export function mapTikApiRawItemToVideo(
  item: Record<string, unknown> | null | undefined,
): TikTokVideo | null {
  if (!item || typeof item !== "object") return null;
  const videoId = item.id as string | undefined;
  if (!videoId) return null;
  const v = item.video as Record<string, unknown> | undefined;
  const playAddr = v?.play_addr as { url_list?: string[] } | undefined;
  const downloadAddr = v?.download_addr as { url_list?: string[] } | undefined;
  const videoUrl = playAddr?.url_list?.[0] || downloadAddr?.url_list?.[0];
  if (!videoUrl || typeof videoUrl !== "string") return null;
  const cover = v?.cover as { url_list?: string[] } | undefined;
  const author = item.author as Record<string, unknown> | undefined;
  const avatarThumb = author?.avatar_thumb as
    | { url_list?: string[] }
    | undefined;
  const stats = item.statistics as Record<string, number> | undefined;
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
      hd_video_url: downloadAddr?.url_list?.[0],
    },
    thumbnails: {
      cover_url: cover?.url_list?.[0] || "",
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

function mapTikApiServiceVideoToScraper(t: TikVideo): TikTokVideo {
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
  return "Aucun fournisseur TikTok configuré: définir TIKTOK_SCRAPER_API_KEY (Omkar), APIFY_API_KEY, et/ou TIKAPI_KEY.";
}

export class TikTokScraperService {
  private static async searchOmkar(
    query: string,
    maxResults: number,
  ): Promise<TikTokVideo[]> {
    const response = await axios.get(`${OMKAR_BASE_URL}/tiktok/videos/search`, {
      params: {
        search_query: query,
        market: "ca",
        max_results: maxResults,
      },
      headers: omkarHeaders(),
    });
    return response.data.videos || [];
  }

  private static async getTrendingOmkar(
    maxResults: number,
  ): Promise<TikTokVideo[]> {
    const response = await axios.get(
      `${OMKAR_BASE_URL}/tiktok/videos/trending`,
      {
        params: {
          market: "ca",
          max_results: maxResults,
        },
        headers: omkarHeaders(),
      },
    );
    return response.data.videos || [];
  }

  /**
   * Search for TikTok videos (Omkar when keyed, else TikAPI hashtag).
   */
  static async search(
    query: string,
    maxResults: number = 15,
  ): Promise<TikTokVideo[]> {
    if (TIKTOK_SCRAPER_API_KEY) {
      try {
        const videos = await this.searchOmkar(query, maxResults);
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
      const videos = await runApifyTikTokActor({
        searchQueries: [query],
        resultsPerPage: maxResults,
      });
      if (videos.length > 0) return videos;
    }

    throw new Error(missingTikTokProviderErrorMessage());
  }

  /**
   * Trending (Omkar when keyed, else TikAPI explore for CA).
   */
  static async getTrending(maxResults: number = 15): Promise<TikTokVideo[]> {
    if (TIKTOK_SCRAPER_API_KEY) {
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
    if (TIKTOK_SCRAPER_API_KEY) {
      try {
        const response = await axios.get(
          `${OMKAR_BASE_URL}/tiktok/videos/details`,
          {
            params: { video_url: videoUrl },
            headers: omkarHeaders(),
          },
        );
        if (response.data && typeof response.data === "object") {
          return {
            ...(response.data as TikTokVideo),
            provider: "omkar",
            original_url:
              (response.data as TikTokVideo).original_url || videoUrl,
          };
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
