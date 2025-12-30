/**
 * Zyeuté V5 - Shared Type Definitions
 * This is the central source of truth for all core entities.
 */

// --- CORE ROLES & ENUMS ---
export type UserRole =
  | "visitor"
  | "citoyen"
  | "moderator"
  | "founder"
  | "banned";
export type PostType = "photo" | "video";
export type ProcessingStatus =
  | "ready"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

// --- CORE ENTITIES ---

export interface User {
  id: string;
  username: string;
  display_name?: string | null;
  displayName?: string | null; // Compatibility
  avatar_url?: string | null;
  avatarUrl?: string | null; // Compatibility
  bio?: string | null;
  city?: string | null;
  region?: string | null;
  is_verified: boolean;
  isVerified?: boolean; // Compatibility
  isPremium?: boolean;
  coins: number;
  fire_score: number;
  created_at: string;
  updated_at?: string;
  followers_count: number;
  followersCount?: number; // Compatibility
  following_count: number;
  followingCount?: number; // Compatibility
  posts_count: number;
  postsCount?: number; // Compatibility
  is_following: boolean;
  isFollowing?: boolean; // Compatibility
  is_online?: boolean;
  role?: UserRole;
  custom_permissions?: Record<string, boolean>;
  tiGuyCommentsEnabled: boolean;
  ti_guy_comments_enabled?: boolean; // Compatibility
  last_daily_bonus?: string | null;
}

export interface Post {
  id: string;
  user_id: string;
  userId?: string; // Compatibility
  media_url: string;
  mediaUrl?: string; // Compatibility
  type: PostType;
  thumbnail_url?: string | null;
  thumbnailUrl?: string | null; // Compatibility
  caption?: string | null;
  hashtags?: string[] | null;
  region?: string | null;
  city?: string | null;
  fire_count: number;
  fireCount?: number; // Compatibility
  comment_count: number;
  commentCount?: number; // Compatibility
  gift_count?: number;
  giftCount?: number; // Compatibility
  created_at: string;
  createdAt?: string; // Compatibility

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

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

// --- NOTIFICATIONS ---

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

// --- API & FORM INPUTS ---

export interface ApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: any;
  } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  per_page: number;
  total: number;
  has_more: boolean;
}

export interface CreatePostInput {
  type: PostType;
  media_url: string;
  caption?: string;
  hashtags?: string[];
  region?: string;
  city?: string;
}

export interface UpdateProfileInput {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  city?: string;
  region?: string;
  tiGuyCommentsEnabled?: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  email: string;
  password: string;
  username: string;
  display_name?: string;
}

// --- UI TYPES ---

export type ButtonVariant =
  | "primary"
  | "outline"
  | "ghost"
  | "icon"
  | "destructive";
export type ButtonSize = "sm" | "md" | "lg";
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ToastType = "success" | "error" | "info" | "warning";
