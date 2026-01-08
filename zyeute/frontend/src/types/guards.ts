/**
 * Type Guards and Runtime Validation Utilities
 * Purpose: Validate API responses and ensure type safety at runtime
 *
 * TODO: Expand type guards as new API responses are identified
 * TODO: Add Zod schemas for more robust validation
 */

import type { User, Post, Comment } from "./index";

/**
 * Type guard for User object
 */
export function isUser(value: unknown): value is User {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === "string" &&
    typeof obj.username === "string" &&
    (obj.display_name === null || typeof obj.display_name === "string") &&
    (obj.avatar_url === null || typeof obj.avatar_url === "string") &&
    typeof obj.is_verified === "boolean" &&
    typeof obj.coins === "number" &&
    typeof obj.fire_score === "number" &&
    typeof obj.created_at === "string"
  );
}

/**
 * Type guard for Post object (feed item)
 */
export function isPost(value: unknown): value is Post {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === "string" &&
    typeof obj.user_id === "string" &&
    (obj.type === "photo" || obj.type === "video") &&
    typeof obj.media_url === "string" &&
    typeof obj.fire_count === "number" &&
    typeof obj.comment_count === "number" &&
    typeof obj.created_at === "string"
  );
}

/**
 * Type guard for Comment object
 */
export function isComment(value: unknown): value is Comment {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === "string" &&
    typeof obj.post_id === "string" &&
    typeof obj.user_id === "string" &&
    (typeof obj.text === "string" || typeof obj.content === "string") &&
    typeof obj.created_at === "string"
  );
}

/**
 * Type guard for array of Posts (feed items)
 */
export function isPostArray(value: unknown): value is Post[] {
  return Array.isArray(value) && value.every(isPost);
}

/**
 * Type guard for array of Comments
 */
export function isCommentArray(value: unknown): value is Comment[] {
  return Array.isArray(value) && value.every(isComment);
}

/**
 * Type guard for array of Users
 */
export function isUserArray(value: unknown): value is User[] {
  return Array.isArray(value) && value.every(isUser);
}

/**
 * Validates and safely parses a User from API response
 * @throws Error if validation fails
 */
export function validateUser(data: unknown): User {
  if (!isUser(data)) {
    console.error("Invalid user data:", data);
    throw new Error("Invalid user data received from API");
  }
  return data;
}

/**
 * Validates and safely parses a Post from API response
 * @throws Error if validation fails
 */
export function validatePost(data: unknown): Post {
  if (!isPost(data)) {
    console.error("Invalid post data:", data);
    throw new Error("Invalid post data received from API");
  }
  return data;
}

/**
 * Validates and safely parses a Comment from API response
 * @throws Error if validation fails
 */
export function validateComment(data: unknown): Comment {
  if (!isComment(data)) {
    console.error("Invalid comment data:", data);
    throw new Error("Invalid comment data received from API");
  }
  return data;
}

/**
 * Validates and safely parses an array of Posts (feed items) from API response
 * @throws Error if validation fails
 */
export function validatePostArray(data: unknown): Post[] {
  if (!isPostArray(data)) {
    console.error("Invalid posts array:", data);
    throw new Error("Invalid posts array received from API");
  }
  return data;
}

/**
 * Type guard for video metadata in Post
 * Videos are stored as posts with type: 'video'
 */
export function isVideoPost(post: Post): post is Post & { type: "video" } {
  return post.type === "video";
}

/**
 * Type guard for enhanced video metadata
 */
export function hasVideoProcessingStatus(post: Post): post is Post & {
  processing_status:
    | "ready"
    | "pending"
    | "processing"
    | "completed"
    | "failed";
} {
  return (
    isVideoPost(post) &&
    post.processing_status !== undefined &&
    ["ready", "pending", "processing", "completed", "failed"].includes(
      post.processing_status,
    )
  );
}

/**
 * Safely extract video metadata from a post
 * Returns null if post is not a video or lacks complete metadata
 */
export function extractVideoMetadata(post: Post): {
  media_url: string;
  thumbnail_url: string | null;
  processing_status?: string;
} | null {
  if (!isVideoPost(post)) return null;

  return {
    media_url: post.media_url,
    thumbnail_url: post.thumbnail_url || null,
    processing_status: post.processing_status,
  };
}

// TODO: Add type guard for Notification objects when implementing real-time features
// TODO: Add type guard for Story objects when implementing stories feature
// TODO: Add Zod schemas for more comprehensive validation with better error messages
// TODO: Add type guards for paginated API responses
// TODO: Add type guards for error responses from API
