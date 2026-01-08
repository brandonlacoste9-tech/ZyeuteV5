/**
 * Shared TypeScript types for Zyeuté V5
 * Consolidation of types used between Frontend, Backend, and AI Brain.
 */

export type UserRole =
  | "visitor"
  | "citoyen"
  | "moderator"
  | "founder"
  | "banned";

export interface User {
  id: string;
  username: string;
  display_name?: string | null;
  displayName?: string | null; // Compat
  avatar_url?: string | null;
  avatarUrl?: string | null; // Compat
  bio?: string | null;
  city?: string | null;
  region?: string | null;
  is_verified: boolean;
  isVerified?: boolean; // Compat
  isPremium?: boolean;
  coins: number;
  fire_score: number;
  created_at: string;
  updated_at?: string;
  followers_count: number;
  followersCount?: number; // Compat
  following_count: number;
  followingCount?: number; // Compat
  posts_count: number;
  postsCount?: number; // Compat
  is_following: boolean;
  isFollowing?: boolean; // Compat
  is_online?: boolean;
  role?: UserRole;
  custom_permissions?: Record<string, boolean>;
  tiGuyCommentsEnabled: boolean;
  ti_guy_comments_enabled?: boolean; // Compat
  last_daily_bonus?: string | null;
}

export type PostType = "photo" | "video";
export type ProcessingStatus =
  | "ready"
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
  enhanced_url?: string;
  processing_status?: ProcessingStatus;
  visual_filter?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  content: string; // Alias
  parent_id?: string | null;
  likes: number;
  created_at: string;
  user?: User;
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

export type NotificationType =
  | "fire"
  | "comment"
  | "follow"
  | "gift"
  | "mention"
  | "story_view";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string;
  post_id?: string | null;
  comment_id?: string | null;
  story_id?: string | null;
  reference_id?: string | null;
  is_read: boolean;
  created_at: string;
  actor?: User;
  post?: Partial<Post>;
}
