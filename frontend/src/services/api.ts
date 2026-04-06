/**
 * Centralized API Service for Zyeuté
 * All data fetching functions call the Express backend
 */

import { logger } from "@/lib/logger";
import type { Post, User, Story, Comment, Notification } from "@/types";

const apiLogger = logger.withContext("API");

import { getSessionWithTimeout } from "@/lib/supabase";
import { AIImageResponseSchema, type AIImageResponse } from "@/schemas/ai";

// [CONFIG] API Base URL
// Use relative URLs so requests route through the hosting platform's proxy:
// - Local dev: Vite proxy (/api → localhost:3000, see vite.config.ts)
// - Vercel: vercel.json rewrite (/api → Render backend URL)
const API_BASE_URL = "";

// [DEDUPLICATION] Prevent duplicate in-flight requests
const pendingRequests = new Map<string, Promise<any>>();

// [CIRCUIT BREAKER] Track 429 errors to back off
const circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  isOpen: () => {
    if (circuitBreaker.failures === 0) return false;
    const backoff = Math.min(
      30000,
      Math.pow(2, circuitBreaker.failures) * 1000,
    );
    const shouldReset = Date.now() - circuitBreaker.lastFailure > backoff;
    return !shouldReset;
  },
  recordSuccess: () => {
    circuitBreaker.failures = 0;
  },
  recordFailure: (code?: string | number) => {
    if (code === 429 || code === "RATE_LIMIT") {
      circuitBreaker.failures++;
      circuitBreaker.lastFailure = Date.now();
    }
  },
};

function getRequestKey(endpoint: string, options: RequestInit): string {
  return `${options.method || "GET"}:${endpoint}:${JSON.stringify(options.body || "")}`;
}

// Base API call helper with deduplication and circuit breaker
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: string | null; code?: string | number }> {
  // Check circuit breaker (back off if rate limited)
  if (circuitBreaker.isOpen()) {
    apiLogger.warn(`Circuit breaker open, rejecting request to ${endpoint}`);
    return {
      data: null,
      error: "Rate limited - please wait",
      code: 429,
    };
  }

  const requestKey = getRequestKey(endpoint, options);

  // Return existing pending request if exists (prevents duplicate in-flight requests)
  if (pendingRequests.has(requestKey)) {
    apiLogger.debug(`Deduplicating request: ${endpoint}`);
    return pendingRequests.get(requestKey)!;
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      const {
        data: { session },
      } = await getSessionWithTimeout(3000);
      const token = session?.access_token;

      // Prepare headers with Authorization if token exists
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const apiUrl = `${API_BASE_URL}/api${endpoint}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), endpoint.includes("generate") ? 120000 : 15000); // 2min for AI, 15s otherwise

      const response = await fetch(apiUrl, {
        ...options,
        headers,
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const code = response.status;

        // Record 429 failures for circuit breaker
        if (code === 429) {
          circuitBreaker.recordFailure(code);
        }

        if (response.status >= 500) {
          apiLogger.error(`Server error ${response.status} at ${endpoint}`, {
            code,
          });
          return {
            data: null,
            error: (data && data.error) || "Server Unavailable",
            code,
          };
        }
        return {
          data: null,
          error: (data && data.error) || "Request failed",
          code,
        };
      }

      // Success - reset circuit breaker
      circuitBreaker.recordSuccess();
      return { data, error: null };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        apiLogger.error(`API timeout: ${endpoint}`);
        return { data: null, error: "Request timeout", code: "TIMEOUT" };
      }
      apiLogger.error(`API call failed: ${endpoint}`, error);
      return { data: null, error: "Network error", code: "NETWORK_ERROR" };
    } finally {
      // Clean up pending request after a longer delay to prevent rapid refetch
      setTimeout(() => {
        pendingRequests.delete(requestKey);
      }, 500);
    }
  })();

  // Store the pending request
  pendingRequests.set(requestKey, requestPromise);

  return requestPromise;
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
          post !== null &&
          !!post.id &&
          !!(post.media_url || post.hls_url || post.mux_playback_id),
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
    limit: limit.toString(),
  });
  if (hiveId) query.append("hive", hiveId);

  // Use Supabase HTTP API endpoint (works without DATABASE_URL)
  const url = `/explore/supabase?${query.toString()}`;
  console.log("[Feed] Fetching:", url);
  const { data, error } = await apiCall<{ posts: Post[] }>(url);
  console.log("[Feed] Response:", { posts: data?.posts?.length || 0, error });
  if (error || !data) return [];
  return (data.posts || [])
    .map(mapBackendPost)
    .filter(
      (post: Post | null): post is Post =>
        post !== null &&
        !!post.id &&
        !!(post.media_url || post.hls_url || post.mux_playback_id),
    );
}

export async function getPostById(postId: string): Promise<Post | null> {
  apiLogger.info(`Fetching post ${postId}...`);

  const { data, error } = await apiCall<{ post: Post }>(`/posts/${postId}`);

  if (error || !data) {
    apiLogger.error(`Failed to fetch post ${postId}:`, error);
    return null;
  }

  const mapped = mapBackendPost(data.post);

  if (mapped && !mapped.media_url) {
    apiLogger.warn(`Post ${postId} loaded but media_url is missing`, {
      thumbnail_url: mapped.thumbnail_url,
      type: mapped.type,
    });
  }

  return mapped;
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
        post !== null &&
        !!post.id &&
        !!(post.media_url || post.hls_url || post.mux_playback_id),
    );
}

export async function createPost(postData: {
  type?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  hashtags?: string[];
  region?: string;
  visibility?: string;
  visualFilter?: string;
  isEphemeral?: boolean;
  soundId?: string;
  hive?: string;
  /** MUX direct upload - create post from MUX asset */
  videoType?: "mux" | "pexels";
  muxData?: { assetId: string; playbackId: string; uploadId: string };
  pexelsData?: {
    pexelsId: string;
    videoUrl: string;
    thumbnail: string;
    duration: number;
    width: number;
    height: number;
  };
}): Promise<Post | null> {
  const { data, error } = await apiCall<{ post: Post }>("/posts", {
    method: "POST",
    body: JSON.stringify({
      ...postData,
      processing_status: "completed",
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

// ============ REMIX FUNCTIONS (TikTok-style) ============

export interface RemixInfo {
  remixCount: number;
  recentRemixes: any[];
}

export async function getRemixInfo(postId: string): Promise<RemixInfo | null> {
  const { data, error } = await apiCall<RemixInfo>(`/remix/${postId}`);
  if (error || !data) return null;
  return data;
}

export async function createRemix(
  originalPostId: string,
  remixType: "duet" | "stitch" | "react",
  mediaUrl: string,
  caption?: string,
): Promise<{ post: Post | null; error: string | null }> {
  const { data, error } = await apiCall<{ post: Post; message: string }>(
    `/remix/${originalPostId}`,
    {
      method: "POST",
      body: JSON.stringify({ remixType, mediaUrl, caption }),
    },
  );

  if (error) return { post: null, error };
  return { post: data?.post || null, error: null };
}

export async function getRemixes(
  postId: string,
  page: number = 0,
  limit: number = 20,
): Promise<{ remixes: Post[]; page: number; limit: number } | null> {
  const { data, error } = await apiCall<{
    remixes: Post[];
    page: number;
    limit: number;
  }>(`/remix/${postId}/remixes?page=${page}&limit=${limit}`);

  if (error || !data) return null;
  return data;
}

// ============ SOUND FUNCTIONS (TikTok-style) ============

export interface Sound {
  id: string;
  title: string;
  artist?: string;
  audioUrl: string;
  coverImageUrl?: string;
  duration?: number;
  category?: string;
  useCount: number;
  isOriginal: boolean;
  createdBy?: string;
  createdAt: string;
}

export async function getSounds(options?: {
  category?: string;
  search?: string;
  trending?: boolean;
  limit?: number;
  page?: number;
}): Promise<{ sounds: Sound[]; page: number; limit: number } | null> {
  const params = new URLSearchParams();
  if (options?.category) params.append("category", options.category);
  if (options?.search) params.append("search", options.search);
  if (options?.trending) params.append("trending", "true");
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.page) params.append("page", options.page.toString());

  const { data, error } = await apiCall<{
    sounds: Sound[];
    page: number;
    limit: number;
  }>(`/sounds?${params.toString()}`);

  if (error || !data) return null;
  return data;
}

export async function getTrendingSounds(
  limit: number = 20,
): Promise<{ sounds: Sound[] } | null> {
  const { data, error } = await apiCall<{ sounds: Sound[] }>(
    `/sounds/trending?limit=${limit}`,
  );

  if (error || !data) return null;
  return data;
}

export async function getSound(soundId: string): Promise<{
  sound: Sound;
  useCount: number;
} | null> {
  const { data, error } = await apiCall<{ sound: Sound; useCount: number }>(
    `/sounds/${soundId}`,
  );

  if (error || !data) return null;
  return data;
}

export async function createSound(sound: {
  title: string;
  artist?: string;
  audioUrl: string;
  coverImageUrl?: string;
  category?: string;
  isOriginal?: boolean;
}): Promise<Sound | null> {
  const { data, error } = await apiCall<{ sound: Sound }>("/sounds", {
    method: "POST",
    body: JSON.stringify(sound),
  });

  if (error || !data) return null;
  return data.sound;
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

export async function reportPostContent(
  postId: string,
  reason: string,
  category?: string,
): Promise<boolean> {
  const { error } = await apiCall("/moderation/report-content", {
    method: "POST",
    body: JSON.stringify({ postId, reason, category }),
  });
  return !error;
}

export async function requestBlockUser(blockedUserId: string): Promise<boolean> {
  const { error } = await apiCall("/moderation/block-user", {
    method: "POST",
    body: JSON.stringify({ blockedUserId }),
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

export async function generateVideo(
  prompt: string,
  imageUrl?: string | null,
  modelHint: string = "wan",
  duration: number = 5,
): Promise<AIVideoResponse | null> {
  const { data, error } = await apiCall<AIVideoResponse>("/ai/generate-video", {
    method: "POST",
    body: JSON.stringify({ prompt, imageUrl, modelHint, duration }),
  });

  if (error || !data) return null;

  // Validate with Zod
  const result = AIVideoResponseSchema.safeParse(data);
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
// Helper to detect video content from URLs
function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();

  // Direct extensions
  const videoExtensions = [
    ".mp4",
    ".mov",
    ".webm",
    ".ogg",
    ".m3u8",
    ".ts",
    ".m4v",
  ];
  if (videoExtensions.some((ext) => lowerUrl.includes(ext))) return true;

  // Video service patterns
  const videoPatterns = [
    "stream.mux.com",
    "vimeo.com",
    "youtube.com",
    "youtu.be",
    "tiktok.com",
    "pexels.com/video",
    "media.giphy.com",
    "api/media-proxy", // Often used for videos
  ];
  if (videoPatterns.some((pattern) => lowerUrl.includes(pattern))) return true;

  return false;
}

// ============ SURGICAL UPLOAD BYPASS ============

export async function surgicalUpload(
  file: File,
  caption?: string,
): Promise<{ success: boolean; post?: Post; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("video", file);
    if (caption) formData.append("caption", caption);
    formData.append("hiveId", "quebec");

    // Get auth token for the upload
    const {
      data: { session },
    } = await getSessionWithTimeout(3000);
    const token = session?.access_token;

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    // DO NOT set Content-Type — the browser must set it automatically
    // with the correct multipart/form-data boundary for FormData.

    const response = await fetch(`${API_BASE_URL}/api/upload/simple`, {
      method: "POST",
      body: formData,
      headers,
      credentials: "include",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      return {
        success: false,
        error: data?.error || `Upload failed (${response.status})`,
      };
    }

    return { success: true, post: data.post };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
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

/** Normalize backend post for feed display (handles snake_case/camelCase, Mux URLs) */
export function normalizePostForFeed(p: Record<string, any>): Post | null {
  return mapBackendPost(p);
}

/** When DB only stores stream.mux.com URL, derive id so La Zyeute uses MuxVideoPlayer (not Hls.js). */
function extractMuxPlaybackIdFromUrl(
  url: string | undefined | null,
): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  if (!url.includes("mux.com") || !url.includes(".m3u8")) return undefined;
  try {
    const u = new URL(url);
    if (!u.hostname.includes("stream.mux.com")) return undefined;
    const m = u.pathname.match(/\/([A-Za-z0-9_-]+)\.m3u8$/);
    return m?.[1];
  } catch {
    return undefined;
  }
}

function mapBackendPost(p: Record<string, any>): Post | null {
  // Return a default safe object or throw/return null if critical data is missing
  if (!p || !p.id) {
    return null;
  }

  const rawMedia = p.media_url || p.mediaUrl;
  const rawOriginal = p.original_url || p.originalUrl;
  const rawEnhanced = p.enhanced_url || p.enhancedUrl;
  const rawHls = p.hls_url || p.hlsUrl;
  const muxPlaybackIdFromRow = p.mux_playback_id || p.muxPlaybackId;
  const muxPlaybackId =
    muxPlaybackIdFromRow ||
    extractMuxPlaybackIdFromUrl(rawHls) ||
    extractMuxPlaybackIdFromUrl(rawMedia) ||
    extractMuxPlaybackIdFromUrl(rawOriginal) ||
    extractMuxPlaybackIdFromUrl(rawEnhanced);
  const processingReady =
    (p.processing_status || p.processingStatus) === "completed" ||
    (p.processing_status || p.processingStatus) === "ready";

  // Best playable URL: MUX HLS > HLS > enhanced (if completed) > media > original
  const muxHlsUrl = muxPlaybackId
    ? `https://stream.mux.com/${muxPlaybackId}.m3u8`
    : "";
  const mediaUrl =
    rawHls ||
    muxHlsUrl ||
    (processingReady && rawEnhanced) ||
    rawMedia ||
    rawOriginal ||
    "";

  // Auto-detect type if not provided
  let type: "photo" | "video" = p.type;
  if (!type && mediaUrl) {
    type = isVideoUrl(mediaUrl) ? "video" : "photo";
  }
  // Also detect video from mux playback ID or hls_url
  if (
    type !== "video" &&
    (muxPlaybackId ||
      rawHls ||
      (typeof mediaUrl === "string" && mediaUrl.includes(".m3u8")))
  ) {
    type = "video";
  }

  return {
    id: p.id,
    user_id: p.user_id || p.userId,
    media_url: mediaUrl,
    thumbnail_url: p.thumbnail_url || p.thumbnailUrl,
    caption: p.caption,
    fire_count: p.reactions_count || p.fire_count || 0,
    comment_count: p.comments_count || p.comment_count || 0,
    gift_count: p.gift_count || 0,
    user: p.user ? mapBackendUser(p.user) : undefined,
    created_at: p.created_at || p.createdAt,
    type: type || "photo",
    region: p.region_id || p.region,
    city: p.city,

    // Video-specific (for SingleVideoView / feed)
    hls_url: rawHls || undefined,
    enhanced_url: rawEnhanced || undefined,
    original_url: rawOriginal || undefined,
    processing_status: p.processing_status || p.processingStatus,
    mux_playback_id: muxPlaybackId || undefined,
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

// [SOVEREIGN] Pexels API removed.
