import axios from "axios";

const TIKHUB_API_KEY = process.env.TIKHUB_API_KEY;
const BASE_URL = "https://api.tikhub.io/api/v1/tiktok/web";

export interface TikHubVideo {
  id: string;
  desc: string;
  video: {
    play_addr: {
      url_list: string[];
    };
    cover: {
      url_list: string[];
    };
    duration: number;
  };
  author: {
    unique_id: string;
    nickname: string;
    avatar_thumb: {
      url_list: string[];
    };
  };
  statistics: {
    digg_count: number;
    play_count: number;
    share_count: number;
    comment_count: number;
  };
}

export const TikHubService = {
  /**
   * Search for TikTok videos using TikHub
   */
  async searchVideos(keyword: string, count: number = 20, offset: number = 0) {
    if (!TIKHUB_API_KEY) {
      throw new Error("TIKHUB_API_KEY is missing");
    }

    try {
      const response = await axios.get(`${BASE_URL}/fetch_search_video`, {
        headers: {
          "Authorization": `Bearer ${TIKHUB_API_KEY}`
        },
        params: {
          keyword,
          count,
          offset
        }
      });

      // TikHub usually returns { code: 200, data: { aweme_list: [...] } } or similar
      const data = response.data;
      if (data.code !== 200 && data.status !== "success") {
        throw new Error(data.message_en || data.msg || "TikHub API error");
      }

      return data.data?.aweme_list || data.aweme_list || [];
    } catch (error: any) {
      const msg = error.response?.data?.message_en || error.message;
      console.error("[TikHub Service] Search failed:", msg);
      throw new Error(msg);
    }
  }
};
