import axios from "axios";
import { Post, User } from "../types";

const BASE_URL = "http://192.168.2.26:12001";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const getSovereignFeed = async (): Promise<Post[]> => {
  try {
    const response = await api.get("/api/feed");
    return response.data.posts.map(mapPost);
  } catch (error) {
    console.error("Failed to fetch feed:", error);
    return [];
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await api.get("/api/auth/me");
    return response.data.user;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    return null;
  }
};

export const getUserPosts = async (username: string): Promise<Post[]> => {
  try {
    const response = await api.get(`/api/users/${username}/posts`);
    return response.data.posts.map(mapPost);
  } catch (error) {
    console.error(`Failed to fetch posts for user ${username}:`, error);
    return [];
  }
};

export const chatWithTiGuy = async (message: string): Promise<any> => {
  try {
    const response = await api.post("/api/studio/chat", { message });
    return response.data;
  } catch (error) {
    console.error("Ti-Guy chat failed:", error);
    return { response: "Oups, j'ai eu une petite friture sur la ligne!" };
  }
};

export const generateImage = async (
  prompt: string,
  modelHint = "flux",
): Promise<any> => {
  try {
    const response = await api.post("/api/studio/generate-image", {
      prompt,
      modelHint,
    });
    return response.data;
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const analyzeImage = async (imageBase64: string): Promise<any> => {
  try {
    const response = await api.post("/api/ai/analyze-image", { imageBase64 });
    return response.data;
  } catch (error) {
    console.error("Image analysis failed:", error);
    throw error;
  }
};

export const generateVideo = async (
  prompt: string,
  modelHint = "kling",
): Promise<any> => {
  try {
    const response = await api.post("/api/studio/generate-video", {
      prompt,
      modelHint,
    });
    return response.data;
  } catch (error) {
    console.error("Video generation failed:", error);
    throw error;
  }
};

export const composePost = async (prompt: string): Promise<any> => {
  try {
    const response = await api.post("/api/studio/compose-post", {
      prompt,
      includeImage: true,
    });
    return response.data;
  } catch (error) {
    console.error("Compose post failed:", error);
    throw error;
  }
};

const ensureAbsoluteUrl = (url: string | undefined): string => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  // Remove leading slash if present
  const cleanUrl = url.startsWith("/") ? url.substring(1) : url;
  return `${BASE_URL}/${cleanUrl}`;
};

const mapPost = (raw: any): Post => {
  const mediaUrl = raw.mediaUrl || raw.media_url || "";
  const thumbnailUrl = raw.thumbnailUrl || raw.thumbnail_url || "";

  return {
    id: raw.id?.toString(),
    mediaUrl: ensureAbsoluteUrl(mediaUrl),
    thumbnailUrl: ensureAbsoluteUrl(thumbnailUrl),
    caption: raw.caption,
    type:
      raw.type || (mediaUrl.toLowerCase().endsWith(".mp4") ? "video" : "photo"),
    fireCount: raw.fireCount ?? raw.reactions_count ?? 0,
    commentCount: raw.commentCount ?? raw.comment_count ?? 0,
    user: {
      id: raw.userId || raw.user_id,
      username: raw.user?.username || "zyeute_user",
      displayName: raw.user?.displayName || raw.user?.display_name,
    },
    tiGuyInsight: raw.ai_description,
    aiPerception: raw.ai_perception,
    createdAt: raw.created_at || raw.createdAt,
  };
};

export default api;
