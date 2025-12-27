/**
 * TypeScript types for Zyeuté
 * Matches Supabase database schema
 */

export type UserRole = 'visitor' | 'citoyen' | 'moderator' | 'founder';

export interface User {
  id: string;
  username: string;
  display_name: string | null;
  displayName?: string | null;
  avatar_url: string | null;
  avatarUrl?: string | null;
  bio: string | null;
  city: string | null;
  region: string | null;
  // RBAC Fields
  role?: UserRole; // Optional because API might not always return it yet
  custom_permissions?: Record<string, boolean>; // JSONB logic
  
  is_verified: boolean;
  isVerified?: boolean;
  isPremium?: boolean;
  coins: number;
  fire_score: number;
  created_at: string;
  updated_at: string;

  // Computed fields (from queries)
  followers_count?: number;
  followersCount?: number;
  following_count?: number;
  followingCount?: number;
  posts_count?: number;
  postsCount?: number;
  is_following?: boolean;
  is_online?: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  userId?: string;
  type: 'photo' | 'video';
  mediaType?: 'photo' | 'video';
  media_url: string;
  mediaUrl?: string;
  thumbnail_url?: string | null;
  thumbnailUrl?: string | null;
  caption: string | null;
  hashtags: string[] | null;
  region: string | null;
  city: string | null;

  // Deep Enhance Fields
  original_url?: string;
  enhanced_url?: string;
  processing_status?: 'ready' | 'pending' | 'processing' | 'completed' | 'failed';
  visual_filter?: string;

  fire_count: number;
  fireCount?: number;
  comment_count: number;
  commentCount?: number;
  gift_count?: number;
  giftCount?: number;
  created_at: string;
  createdAt?: string;

  // Relations
  user?: User;
  comments?: Comment[];
  user_fire?: Fire;

  // Computed
  is_fired?: boolean;
  fire_level?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  content: string; // Alias for text field
  parent_id?: string | null;
  likes?: number;
  created_at: string;

  // Relations
  user?: User;
}

export interface Fire {
  user_id: string;
  post_id: string;
  fire_level: number; // 1-5
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Gift {
  id: string;
  from_user_id: string;
  to_user_id: string;
  post_id: string | null;
  gift_type: string;
  coin_value: number;
  created_at: string;

  // Relations
  from_user?: User;
  to_user?: User;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  type: 'photo' | 'video';
  duration: number;
  created_at: string;
  expires_at: string;

  // Relations
  user?: User;

  // Computed
  is_viewed?: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'fire' | 'comment' | 'follow' | 'gift' | 'mention';
  actor_id: string;
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;

  // Relations
  actor?: User;
  post?: Post;
}

// Form types
export interface CreatePostInput {
  type: 'photo' | 'video';
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

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  per_page: number;
  total: number;
  has_more: boolean;
}

// Component prop types
export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'icon' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
