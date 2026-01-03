import axios from "axios";
import { Post } from "../types";

const BASE_URL = "http://192.168.2.26:5000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const getSovereignFeed = async (): Promise<Post[]> => {
  try {
    const response = await api.get("/api/feed");
    return response.data.map(mapPost);
  } catch (error) {
    console.error("Failed to fetch feed:", error);
    return [];
  }
};

export const chatWithTiGuy = async (message: string, history: any[] = []) => {
  try {
    const response = await api.post("/api/tiguy/chat", {
      message,
      history,
    });
    return response.data;
  } catch (error) {
    console.error("Ti-Guy Chat Error:", error);
    return {
      response:
        "Oups! J'ai eu un glitch dans mon cerveau de castor. Réessaie plus tard, mon chum.",
    };
  }
};

const mapPost = (raw: any): Post => {
  return {
    id: raw.id,
    mediaUrl: raw.media_url,
    thumbnailUrl: raw.thumbnail_url,
    caption: raw.caption,
    type: raw.type || (raw.media_url?.endsWith(".mp4") ? "video" : "photo"),
    fireCount: raw.reactions_count || 0,
    commentCount: raw.comment_count || 0,
    user: {
      id: raw.user_id,
      username: raw.user?.username || "zyeute_user",
      displayName: raw.user?.display_name,
    },
    tiGuyInsight: raw.ai_description,
    aiPerception: raw.ai_perception,
    createdAt: raw.created_at,
  };
};

export default api;
