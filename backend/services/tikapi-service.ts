/**
 * TikAPI & Pollo AI Service Integration
 * Zyeuté V5 - Quebec Social Media Platform
 *
 * This service handles fetching real TikTok content (TikAPI)
 * and generating AI videos (Pollo AI).
 */

import axios from "axios";
import TikAPI from "tikapi";

function getTikApiClient(): ReturnType<typeof TikAPI> | null {
  const key = process.env.TIKAPI_KEY?.trim();
  return key ? TikAPI(key) : null;
}

const POLLO_API_KEY = process.env.POLLO_API_KEY ?? "";

export interface TikVideo {
  id: string;
  video_url: string;
  cover_url: string;
  description: string;
  author: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  };
  statistics: {
    play_count: number;
    digg_count: number;
    comment_count: number;
    share_count: number;
  };
}

export const TikApiService = {
  /**
   * Fetch trending videos from TikTok via TikAPI
   */
  async getTrendingVideos(region: string = "CA", count: number = 10) {
    try {
      const tikapi = getTikApiClient();
      if (!tikapi) {
        console.warn("[TikAPI] TIKAPI_KEY missing; skip trending.");
        return [];
      }
      console.log(`[TikAPI] Fetching trending videos for region: ${region}`);

      const response: any = await tikapi.public.search({
        category: "videos",
        query: "foryoupage"
      });

      if (!response?.json?.item_list) {
        return [];
      }

      return response.json.item_list.slice(0, count).map((item: any) => ({
        id: item.id || item.aweme_id,
        video_url:
          item.video?.playAddr ||
          item.video?.play_addr?.url_list?.[0] ||
          item.video?.download_addr?.url_list?.[0],
        cover_url: item.video?.cover || item.video?.cover?.url_list?.[0],
        description: item.desc,
        author: {
          id: item.author?.id,
          unique_id: item.author?.uniqueId || item.author?.unique_id,
          nickname: item.author?.nickname,
          avatar: item.author?.avatarThumb || item.author?.avatar_thumb?.url_list?.[0],
        },
        statistics: {
          play_count: item.stats?.playCount || item.statistics?.play_count || 0,
          digg_count: item.stats?.diggCount || item.statistics?.digg_count || 0,
          comment_count: item.stats?.commentCount || item.statistics?.comment_count || 0,
          share_count: item.stats?.shareCount || item.statistics?.share_count || 0,
        },
      })) as TikVideo[];
    } catch (error: any) {
      console.error(
        "[TikAPI] Error fetching trending:",
        error?.message || error,
      );
      return [];
    }
  },

  /**
   * Search videos by hashtag (e.g., #quebec, #montreal)
   */
  async searchByHashtag(hashtag: string, count: number = 10) {
    try {
      const tikapi = getTikApiClient();
      if (!tikapi) {
        console.warn("[TikAPI] TIKAPI_KEY missing; skip hashtag search.");
        return [];
      }
      const cleanTag = hashtag.replace("#", "");
      const response: any = await tikapi.public.search({
        category: "videos",
        query: cleanTag
      });

      return response?.json?.item_list?.slice(0, count) || [];
    } catch (error) {
      console.error(`[TikAPI] Error searching hashtag #${hashtag}:`, error);
      return [];
    }
  },
};

/**
 * Pollo AI Service
 * Handles high-end AI video generation
 */
const POLLO_BASE_URL = "https://api.pollo.ai/v1";

export const PolloService = {
  /**
   * Generate a video using Pollo AI
   */
  async generateVideo(params: {
    prompt: string;
    negative_prompt?: string;
    aspect_ratio?: "9:16" | "16:9" | "1:1";
    quality?: "hd" | "standard";
    duration?: 5 | 10;
  }) {
    try {
      console.log(
        `[Pollo AI] Generating video with prompt: ${params.prompt.substring(0, 50)}...`,
      );

      if (!POLLO_API_KEY) {
        throw new Error("POLLO_API_KEY is not set");
      }

      const response = await axios.post(
        `${POLLO_BASE_URL}/video/generate`,
        {
          prompt: params.prompt,
          negative_prompt:
            params.negative_prompt || "low quality, blurry, distorted",
          aspect_ratio: params.aspect_ratio || "9:16",
          quality: params.quality || "hd",
          duration: params.duration || 5,
        },
        {
          headers: {
            Authorization: `Bearer ${POLLO_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        taskId: response.data.task_id,
        status: response.data.status, // "pending"
        estimated_time: response.data.estimated_time,
      };
    } catch (error: any) {
      console.error(
        "[Pollo AI] Generation request failed:",
        error.response?.data || error.message,
      );
      throw new Error("Pollo AI Generation failed");
    }
  },

  /**
   * Check the status of a generation task
   */
  async getTaskStatus(taskId: string) {
    try {
      if (!POLLO_API_KEY) {
        return { status: "error" as const, error: "POLLO_API_KEY is not set" };
      }
      const response = await axios.get(
        `${POLLO_BASE_URL}/video/task/${taskId}`,
        {
          headers: { Authorization: `Bearer ${POLLO_API_KEY}` },
        },
      );

      return {
        status: response.data.status, // "completed", "processing", "failed"
        videoUrl: response.data.video_url,
        thumbnailUrl: response.data.thumbnail_url,
        error: response.data.error,
      };
    } catch (error: any) {
      console.error(
        `[Pollo AI] Failed to check task ${taskId}:`,
        error.message,
      );
      return { status: "error", error: error.message };
    }
  },
};
