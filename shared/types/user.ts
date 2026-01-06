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
