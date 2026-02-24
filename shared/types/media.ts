import { User } from "./user";

export type PostType = "photo" | "video";

export type ProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface Post {
  id: string;
  user_id: string;
  userId?: string; // Compat
  media_url: string;
  mediaUrl?: string; // Compat
  type: PostType;
  thumbnail_url?: string | null;
  thumbnailUrl?: string | null; // Compat
  caption?: string | null;
  hashtags?: string[] | null;
  region?: string | null;
  city?: string | null;
  fire_count: number;
  fireCount?: number; // Compat
  comment_count: number;
  commentCount?: number; // Compat
  gift_count?: number;
  giftCount?: number; // Compat
  created_at: string;
  createdAt?: string; // Compat

  // Relations
  user?: User;

  // Ephemeral Protocol
  is_ephemeral: boolean;
  view_count: number;
  max_views: number;
  expires_at?: string | null;
  burned_at?: string | null;

  // Video specific (AI Brain)
  original_url?: string;
  originalUrl?: string; // Compat
  enhanced_url?: string;
  enhancedUrl?: string; // Compat
  hls_url?: string;
  hlsUrl?: string; // Compat
  mux_playback_id?: string;
  muxPlaybackId?: string; // Compat
  processing_status?: ProcessingStatus;
  processingStatus?: ProcessingStatus; // Compat
  visual_filter?: string;
  visualFilter?: string; // Compat
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  type: PostType;
  duration: number;
  created_at: string;
  expires_at: string;
  user?: User;
  is_viewed: boolean;
}
