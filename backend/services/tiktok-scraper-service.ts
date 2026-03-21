import axios from "axios";

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

export class TikTokScraperService {
  private static getHeaders() {
    return {
      "API-Key": TIKTOK_SCRAPER_API_KEY || "",
    };
  }

  /**
   * Search for TikTok videos
   */
  static async search(
    query: string,
    maxResults: number = 15,
  ): Promise<TikTokVideo[]> {
    if (!TIKTOK_SCRAPER_API_KEY)
      throw new Error("TIKTOK_SCRAPER_API_KEY is missing");

    try {
      const response = await axios.get(
        `${OMKAR_BASE_URL}/tiktok/videos/search`,
        {
          params: {
            search_query: query,
            market: "ca",
            max_results: maxResults,
          },
          headers: this.getHeaders(),
        },
      );

      return response.data.videos || [];
    } catch (error: any) {
      console.error("[TikTok Service] Search Error:", error.message);
      throw error;
    }
  }

  /**
   * Get trending TikTok videos
   */
  static async getTrending(maxResults: number = 15): Promise<TikTokVideo[]> {
    if (!TIKTOK_SCRAPER_API_KEY)
      throw new Error("TIKTOK_SCRAPER_API_KEY is missing");

    try {
      const response = await axios.get(
        `${OMKAR_BASE_URL}/tiktok/videos/trending`,
        {
          params: {
            market: "ca",
            max_results: maxResults,
          },
          headers: this.getHeaders(),
        },
      );

      return response.data.videos || [];
    } catch (error: any) {
      console.error("[TikTok Service] Trending Error:", error.message);
      throw error;
    }
  }

  /**
   * Get specific video details
   */
  static async getVideoDetails(videoUrl: string): Promise<TikTokVideo | null> {
    if (!TIKTOK_SCRAPER_API_KEY)
      throw new Error("TIKTOK_SCRAPER_API_KEY is missing");

    try {
      const response = await axios.get(
        `${OMKAR_BASE_URL}/tiktok/videos/details`,
        {
          params: { video_url: videoUrl },
          headers: this.getHeaders(),
        },
      );

      return response.data;
    } catch (error: any) {
      console.error("[TikTok Service] Details Error:", error.message);
      return null;
    }
  }
}
