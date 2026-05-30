/**
 * TypeScript types for Zyeuté
 * Includes types inferred from centralized Zod schemas
 */

import { z } from "zod";
import {
  UserSchema,
  PostSchema,
  CommentSchema,
  FireSchema,
  GiftSchema,
  NotificationSchema,
  StorySchema,
} from "../schemas/common";

// Re-export Zod inferred types
export type User = z.infer<typeof UserSchema>;
export type Post = z.infer<typeof PostSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type Fire = z.infer<typeof FireSchema>;
export type Gift = z.infer<typeof GiftSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type Story = z.infer<typeof StorySchema>;

// User Role Alias
export type UserRole =
  | "visitor"
  | "citoyen"
  | "moderator"
  | "founder"
  | "banned";

// Follow interface (might need schema later, simple for now)
export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Form types (Consider moving to schemas later)
export interface CreatePostInput {
  type: "photo" | "video";
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
export type ButtonVariant =
  | "primary"
  | "outline"
  | "ghost"
  | "icon"
  | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export type ToastType = "success" | "error" | "info" | "warning";
