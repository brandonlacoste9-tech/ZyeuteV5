import axios from "axios";
import {
  TikApiService,
  type TikVideo,
} from "./tikapi-service.js";

const OMKAR_BASE_URL = "https://tiktok-scraper.omkar.cloud";
const TIKTOK_SCRAPER_API_KEY = process.env.TIKTOK_SCRAPER_API_KEY;

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

export function mapTikApiRawItemToVideo(item: Record<string, unknown> | null | undefined): TikTokVideo | null {
  if (!item || typeof item !== "object") return null;
  const videoId = item.id as string | undefined;
  if (!videoId) return null;
  const v = item.video as Record<string, unknown> | undefined;
  const playAddr = v?.play_addr as { url_list?: string[] } | undefined;
  const downloadAddr = v?.download_addr as { url_list?: string[] } | undefined;
  const videoUrl =
    playAddr?.url_list?.[0] || downloadAddr?.url_list?.[0];
  if (!videoUrl || typeof videoUrl !== "string") return null;
  const cover = v?.cover as { url_list?: string[] } | undefined;
  const author = item.author as Record<string, unknown> | undefined;
  const avatarThumb = author?.avatar_thumb as { url_list?: string[] } | undefined;
  const stats = item.statistics as Record<string, number> | undefined;
  const handle =
    (author?.unique_id as string) ||
    (author?.nickname as string) ||
    "unknown";
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
  };
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
  };
}

export function missingTikTokProviderErrorMessage(): string {
  return "Aucun fournisseur TikTok configuré: définir TIKTOK_SCRAPER_API_KEY (Omkar) et/ou TIKAPI_KEY.";
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

  private static async getTrendingOmkar(maxResults: number): Promise<TikTokVideo[]> {
    const response = await axios.get(`${OMKAR_BASE_URL}/tiktok/videos/trending`, {
      params: {
        market: "ca",
        max_results: maxResults,
      },
      headers: omkarHeaders(),
    });
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
      return list
        .map((item) => mapTikApiRawItemToVideo(item as Record<string, unknown>))
        .filter((x): x is TikTokVideo => x != null);
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
      return items.map(mapTikApiServiceVideoToScraper);
    }

    throw new Error(missingTikTokProviderErrorMessage());
  }

  /**
   * Video details from URL (Omkar only — TikAPI has no stable public URL resolver here).
   */
  static async getVideoDetails(videoUrl: string): Promise<TikTokVideo | null> {
    if (!TIKTOK_SCRAPER_API_KEY) return null;

    try {
      const response = await axios.get(`${OMKAR_BASE_URL}/tiktok/videos/details`, {
        params: { video_url: videoUrl },
        headers: omkarHeaders(),
      });
      return response.data;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[TikTok Service] Details Error:", msg);
      return null;
    }
  }
}
