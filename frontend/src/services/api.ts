/**
 * Centralized API Service for Zyeuté
 * All data fetching functions call the Express backend
 */

import { logger } from "@/lib/logger";
import type { Post, User, Story, Comment, Notification } from "@/types";

const apiLogger = logger.withContext("API");

import { supabase } from "@/lib/supabase";
import { AIImageResponseSchema, type AIImageResponse } from "@/schemas/ai";

// Base API call helper
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  try {
    // Get current session token
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Prepare headers with Authorization if token exists
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // Include cookies for session
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // If 500 or 503, return a specific error that can be swallowed by resilient endpoints
      if (response.status >= 500) {
        apiLogger.error(`Server error ${response.status} at ${endpoint}`);
        return { data: null, error: "Server Unavailable" };
      }
      return { data: null, error: (data && data.error) || "Request failed" };
    }

    return { data, error: null };
  } catch (error) {
    apiLogger.error(`API call failed: ${endpoint}`, error);
    return { data: null, error: "Network error" };
  }
}

// ============ AUTH FUNCTIONS ============

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await apiCall<{ user: User | null }>("/auth/me");
  if (error || !data) return null;
  return data.user;
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await apiCall<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (error) return { user: null, error };
  return { user: data?.user || null, error: null };
}

export async function signup(
  email: string,
  password: string,
  username: string,
  displayName?: string,
): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await apiCall<{ user: User }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, username, displayName }),
  });

  if (error) return { user: null, error };
  return { user: data?.user || null, error: null };
}

export async function logout(): Promise<boolean> {
  const { error } = await apiCall("/auth/logout", { method: "POST" });
  return !error;
}

// ============ USER FUNCTIONS ============

export async function getUserProfile(
  usernameOrId: string,
  currentUserId?: string,
): Promise<User | null> {
  const endpoint =
    usernameOrId === "me" ? "/auth/me" : `/users/${usernameOrId}`;
  const { data, error } = await apiCall<{ user: User }>(endpoint);

  if (error || !data) return null;
  return mapBackendUser(data.user);
}

export async function updateProfile(
  updates: Partial<User>,
): Promise<User | null> {
  const { data, error } = await apiCall<{ user: User }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });

  if (error || !data) return null;
  return mapBackendUser(data.user);
}

// ============ POSTS FUNCTIONS ============

export async function getFeedPosts(
  page: number = 0,
  limit: number = 20,
): Promise<Post[]> {
  try {
    const { data, error } = await apiCall<{ posts: Post[] }>(
      `/feed?page=${page}&limit=${limit}`,
    );

    if (error || !data) {
      apiLogger.warn("Feed unavailable, returning empty array logic.");
      return [];
    }

    // Use robust mapping and filtering
    return (data.posts || [])
      .map(mapBackendPost)
      .filter(
        (post: Post | null): post is Post =>
          post !== null && !!post.id && !!post.media_url,
      );
  } catch (err) {
    // Final safety net
    return [];
  }
}

export async function getExplorePosts(
  page: number = 0,
  limit: number = 20,
  hiveId?: string,
): Promise<Post[]> {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (hiveId) query.append("hive", hiveId);

  const { data, error } = await apiCall<{ posts: Post[] }>(
    `/explore?${query.toString()}`,
  );
  if (error || !data) return [];
  return (data.posts || [])
    .map(mapBackendPost)
    .filter(
      (post: Post | null): post is Post =>
        post !== null && !!post.id && !!post.media_url,
    );
}

export async function getPostById(postId: string): Promise<Post | null> {
  const { data, error } = await apiCall<{ post: Post }>(`/posts/${postId}`);
  if (error || !data) return null;
  return mapBackendPost(data.post);
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const { data, error } = await apiCall<{ posts: Post[] }>(
    `/users/${userId}/posts`,
  );
  if (error || !data) return [];

  return (data.posts || [])
    .map(mapBackendPost)
    .filter(
      (post: Post | null): post is Post =>
        post !== null && !!post.id && !!post.media_url,
    );
}

export async function createPost(postData: {
  type: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  hashtags?: string[];
  region?: string;
  visibility?: string;
  visualFilter?: string;
  isEphemeral?: boolean;
}): Promise<Post | null> {
  const { data, error } = await apiCall<{ post: Post }>("/posts", {
    method: "POST",
    body: JSON.stringify({
      ...postData,
      // Ensure processing status is set for videos
      processing_status: postData.type === "video" ? "pending" : "ready",
    }),
  });

  if (error || !data) return null;
  return mapBackendPost(data.post);
}

export async function deletePost(postId: string): Promise<boolean> {
  const { error } = await apiCall(`/posts/${postId}`, { method: "DELETE" });
  return !error;
}

// ============ REACTIONS FUNCTIONS ============

export async function togglePostFire(
  postId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await apiCall<{ added: boolean }>(
    `/posts/${postId}/fire`,
    {
      method: "POST",
    },
  );
  return !error;
}

export async function toggleCommentFire(commentId: string): Promise<boolean> {
  const { error } = await apiCall(`/comments/${commentId}/fire`, {
    method: "POST",
  });
  return !error;
}

// ============ COMMENTS FUNCTIONS ============

export async function getPostComments(postId: string): Promise<Comment[]> {
  const { data, error } = await apiCall<{ comments: Comment[] }>(
    `/posts/${postId}/comments`,
  );
  if (error || !data) return [];
  return data.comments || [];
}

export async function addComment(
  postId: string,
  content: string,
): Promise<Comment | null> {
  const { data, error } = await apiCall<{ comment: Comment }>(
    `/posts/${postId}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
  );

  if (error || !data) return null;
  return data.comment;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await apiCall(`/comments/${commentId}`, {
    method: "DELETE",
  });
  return !error;
}

// ============ FOLLOWS FUNCTIONS ============

export async function checkFollowing(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  // This is determined by the isFollowing field returned with user data
  return false;
}

export async function toggleFollow(
  followerId: string,
  followingId: string,
  isFollowing: boolean,
): Promise<boolean> {
  const method = isFollowing ? "DELETE" : "POST";
  const { error } = await apiCall(`/users/${followingId}/follow`, { method });
  return !error;
}

export async function followUser(userId: string): Promise<boolean> {
  const { error } = await apiCall(`/users/${userId}/follow`, {
    method: "POST",
  });
  return !error;
}

export async function unfollowUser(userId: string): Promise<boolean> {
  const { error } = await apiCall(`/users/${userId}/follow`, {
    method: "DELETE",
  });
  return !error;
}

export async function getFollowers(userId: string): Promise<User[]> {
  const { data, error } = await apiCall<{ followers: User[] }>(
    `/users/${userId}/followers`,
  );
  if (error || !data) return [];
  return (data.followers || []).map(mapBackendUser);
}

export async function getFollowing(userId: string): Promise<User[]> {
  const { data, error } = await apiCall<{ following: User[] }>(
    `/users/${userId}/following`,
  );
  if (error || !data) return [];
  return (data.following || []).map(mapBackendUser);
}

// ============ STORIES FUNCTIONS ============

export async function getStories(
  currentUserId?: string,
): Promise<Array<{ user: User; story?: Story; isViewed?: boolean }>> {
  const { data, error } = await apiCall<{ stories: any[] }>("/stories");

  if (error || !data) return [];

  // Group stories by user
  const storyMap = new Map<
    string,
    { user: User; story: Story; isViewed: boolean }
  >();

  (data.stories || []).forEach((story: Record<string, any>) => {
    if (story.user && !storyMap.has(story.user.id)) {
      storyMap.set(story.user.id, {
        user: mapBackendUser(story.user),
        story: mapBackendStory(story),
        isViewed: story.isViewed || false,
      });
    }
  });

  const storyList = Array.from(storyMap.values());

  // Prioritize current user's story
  if (currentUserId) {
    const userStory = storyList.find((s) => s.user.id === currentUserId);
    if (userStory) {
      return [
        userStory,
        ...storyList.filter((s) => s.user.id !== currentUserId),
      ];
    }
  }

  return storyList;
}

export async function createStory(storyData: {
  mediaUrl: string;
  mediaType: string;
  caption?: string;
}): Promise<Story | null> {
  const { data, error } = await apiCall<{ story: Story }>("/stories", {
    method: "POST",
    body: JSON.stringify(storyData),
  });

  if (error || !data) return null;
  return data.story;
}

export async function markStoryViewed(storyId: string): Promise<boolean> {
  const { error } = await apiCall(`/stories/${storyId}/view`, {
    method: "POST",
  });
  return !error;
}

// ============ NOTIFICATIONS FUNCTIONS ============

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await apiCall<{ notifications: Notification[] }>(
    "/notifications",
  );
  if (error || !data) return [];
  return data.notifications || [];
}

export async function markNotificationRead(
  notificationId: string,
): Promise<boolean> {
  const { error } = await apiCall(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  return !error;
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const { error } = await apiCall("/notifications/read-all", {
    method: "POST",
  });
  return !error;
}

// ============ AI FUNCTIONS ============

export async function generateImage(
  prompt: string,
  aspectRatio: string = "1:1",
): Promise<AIImageResponse | null> {
  const { data, error } = await apiCall<AIImageResponse>("/ai/generate-image", {
    method: "POST",
    body: JSON.stringify({ prompt, aspectRatio }),
  });

  if (error || !data) return null;

  // Validate with Zod
  const result = AIImageResponseSchema.safeParse(data);
  return result.success ? result.data : null;
}

// ============ PARENTAL CONTROLS FUNCTIONS ============

export async function linkChild(childUsername: string): Promise<User | null> {
  const { data, error } = await apiCall<{ child: User }>("/parental/link", {
    method: "POST",
    body: JSON.stringify({ childUsername }),
  });
  if (error || !data) return null;
  return mapBackendUser(data.child);
}

export async function getChildren(): Promise<User[]> {
  const { data, error } = await apiCall<{ children: User[] }>(
    "/parental/children",
  );
  if (error || !data) return [];
  return (data.children || []).map(mapBackendUser);
}

export async function getParentalControls(childId: string): Promise<any> {
  const { data, error } = await apiCall<{ controls: any }>(
    `/parental/controls/${childId}`,
  );
  if (error || !data) return null;
  return data.controls;
}

export async function updateParentalControls(
  childUserId: string,
  controls: any,
): Promise<boolean> {
  const { error } = await apiCall("/parental/controls", {
    method: "POST",
    body: JSON.stringify({ childUserId, ...controls }),
  });
  return !error;
}

// ============ HELPER FUNCTIONS ============

// Helper to detect video file extensions
function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  const videoExtensions = [".mp4", ".mov", ".webm", ".ogg", ".m3u8"];
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
}

// Map backend user fields (camelCase) to frontend fields (snake_case where needed)
function mapBackendUser(user: Record<string, any>): User {
  if (!user) return user as unknown as User;
  return {
    id: user.id,
    username: user.username,
    display_name: user.displayName || user.display_name || null,
    bio: user.bio || null,
    avatar_url: user.avatarUrl || user.avatar_url || null,
    city: user.city || user.location || null,
    region: user.region || null,
    is_verified: user.isVerified || user.is_verified || false,
    coins: user.coins || 0,
    fire_score: user.fireScore || user.fire_score || 0,
    created_at: user.createdAt || user.created_at || new Date().toISOString(),
    updated_at: user.updatedAt || user.updated_at || new Date().toISOString(),
    followers_count: user.followersCount || user.followers_count || 0,
    following_count: user.followingCount || user.following_count || 0,
    posts_count: user.postsCount || user.posts_count || 0,
    is_following: user.isFollowing || user.is_following || false,
    // RBAC Fields
    role: user.role || "citoyen",
    custom_permissions: user.custom_permissions || {},
    // Ti-Guy Preferences
    tiGuyCommentsEnabled:
      user.tiGuyCommentsEnabled !== undefined
        ? user.tiGuyCommentsEnabled
        : user.ti_guy_comments_enabled !== undefined
          ? user.ti_guy_comments_enabled
          : true,

    // Gamification
    last_daily_bonus: user.last_daily_bonus || user.lastDailyBonus || null,
  } as User;
}

function mapBackendPost(p: Record<string, any>): Post | null {
  // Return a default safe object or throw/return null if critical data is missing
  if (!p || !p.id) {
    return null;
  }

  const mediaUrl = p.media_url || p.mediaUrl || p.original_url;

  // Auto-detect type if not provided
  let type: "photo" | "video" = p.type;
  if (!type && mediaUrl) {
    type = isVideoUrl(mediaUrl) ? "video" : "photo";
  }

  return {
    id: p.id,
    user_id: p.user_id || p.userId,
    media_url: mediaUrl,
    thumbnail_url: p.thumbnail_url || p.thumbnailUrl, // Add thumbnail support
    caption: p.caption,
    fire_count: p.reactions_count || p.fire_count || 0,
    comment_count: p.comments_count || p.comment_count || 0,
    gift_count: p.gift_count || 0, // Ensure gift_count is mapped
    user: p.user ? mapBackendUser(p.user) : undefined,
    created_at: p.created_at || p.createdAt,
    type: type || "photo",
    region: p.region_id || p.region,
    city: p.city,

    // Ephemeral Protocol
    is_ephemeral: p.is_ephemeral || p.isEphemeral || false,
    view_count: p.view_count || p.viewCount || 0,
    max_views: p.max_views || p.maxViews || 1,
    expires_at: p.expires_at || p.expiresAt,
    burned_at: p.burned_at || p.burnedAt,
  } as Post;
}

// Map backend story fields
function mapBackendStory(story: Record<string, any>): Story {
  if (!story) return story as unknown as Story;
  const mediaType = story.mediaType || story.media_type || "photo";
  return {
    id: story.id,
    user_id: story.userId || story.user_id,
    media_url: story.mediaUrl || story.media_url || "",
    type: mediaType === "video" ? "video" : "photo",
    duration: story.duration || 5,
    created_at: story.createdAt || story.created_at || new Date().toISOString(),
    expires_at: story.expiresAt || story.expires_at || new Date().toISOString(),
    is_viewed: story.isViewed || story.is_viewed || false,
    user: story.user ? mapBackendUser(story.user) : undefined,
  } as Story;
}
