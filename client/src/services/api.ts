/**
 * Centralized API Service for Zyeuté
 * All data fetching functions call the Express backend
 */

import { logger } from '@/lib/logger';
import type { Post, User, Story } from '@/types';

const apiLogger = logger.withContext('API');

// Base API call helper
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { data: null, error: data.error || 'Request failed' };
    }
    
    return { data, error: null };
  } catch (error) {
    apiLogger.error(`API call failed: ${endpoint}`, error);
    return { data: null, error: 'Network error' };
  }
}

// ============ AUTH FUNCTIONS ============

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await apiCall<{ user: User | null }>('/auth/me');
  if (error || !data) return null;
  return data.user;
}

export async function login(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await apiCall<{ user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  if (error) return { user: null, error };
  return { user: data?.user || null, error: null };
}

export async function signup(
  email: string, 
  password: string, 
  username: string,
  displayName?: string
): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await apiCall<{ user: User }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, username, displayName }),
  });
  
  if (error) return { user: null, error };
  return { user: data?.user || null, error: null };
}

export async function logout(): Promise<boolean> {
  const { error } = await apiCall('/auth/logout', { method: 'POST' });
  return !error;
}

// ============ USER FUNCTIONS ============

export async function getUserProfile(
  usernameOrId: string,
  currentUserId?: string
): Promise<User | null> {
  const endpoint = usernameOrId === 'me' ? '/auth/me' : `/users/${usernameOrId}`;
  const { data, error } = await apiCall<{ user: User }>(endpoint);
  
  if (error || !data) return null;
  return data.user;
}

export async function updateProfile(updates: Partial<User>): Promise<User | null> {
  const { data, error } = await apiCall<{ user: User }>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  
  if (error || !data) return null;
  return data.user;
}

// ============ POSTS FUNCTIONS ============

export async function getFeedPosts(page: number = 0, limit: number = 20): Promise<Post[]> {
  const { data, error } = await apiCall<{ posts: Post[] }>(
    `/feed?page=${page}&limit=${limit}`
  );
  
  if (error || !data) {
    apiLogger.warn('No feed data returned');
    return [];
  }
  
  // Map backend response to frontend Post type
  return (data.posts || []).map(mapBackendPost);
}

export async function getExplorePosts(page: number = 0, limit: number = 20): Promise<Post[]> {
  const { data, error } = await apiCall<{ posts: Post[] }>(
    `/explore?page=${page}&limit=${limit}`
  );
  
  if (error || !data) return [];
  return (data.posts || []).map(mapBackendPost);
}

export async function getPostById(postId: string): Promise<Post | null> {
  const { data, error } = await apiCall<{ post: Post }>(`/posts/${postId}`);
  if (error || !data) return null;
  return mapBackendPost(data.post);
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  // Get username from user ID first if needed
  const { data, error } = await apiCall<{ posts: Post[] }>(`/users/${userId}/posts`);
  if (error || !data) return [];
  return (data.posts || []).map(mapBackendPost);
}

export async function createPost(postData: {
  type: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  hashtags?: string[];
  region?: string;
  visibility?: string;
}): Promise<Post | null> {
  const { data, error } = await apiCall<{ post: Post }>('/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
  
  if (error || !data) return null;
  return mapBackendPost(data.post);
}

export async function deletePost(postId: string): Promise<boolean> {
  const { error } = await apiCall(`/posts/${postId}`, { method: 'DELETE' });
  return !error;
}

// ============ REACTIONS FUNCTIONS ============

export async function togglePostFire(postId: string, userId: string): Promise<boolean> {
  const { data, error } = await apiCall<{ added: boolean }>(`/posts/${postId}/fire`, {
    method: 'POST',
  });
  return !error;
}

export async function toggleCommentFire(commentId: string): Promise<boolean> {
  const { error } = await apiCall(`/comments/${commentId}/fire`, { method: 'POST' });
  return !error;
}

// ============ COMMENTS FUNCTIONS ============

export async function getPostComments(postId: string): Promise<any[]> {
  const { data, error } = await apiCall<{ comments: any[] }>(`/posts/${postId}/comments`);
  if (error || !data) return [];
  return data.comments || [];
}

export async function addComment(postId: string, content: string): Promise<any | null> {
  const { data, error } = await apiCall<{ comment: any }>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  
  if (error || !data) return null;
  return data.comment;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await apiCall(`/comments/${commentId}`, { method: 'DELETE' });
  return !error;
}

// ============ FOLLOWS FUNCTIONS ============

export async function checkFollowing(followerId: string, followingId: string): Promise<boolean> {
  // This is determined by the isFollowing field returned with user data
  return false;
}

export async function toggleFollow(
  followerId: string,
  followingId: string,
  isFollowing: boolean
): Promise<boolean> {
  const method = isFollowing ? 'DELETE' : 'POST';
  const { error } = await apiCall(`/users/${followingId}/follow`, { method });
  return !error;
}

export async function followUser(userId: string): Promise<boolean> {
  const { error } = await apiCall(`/users/${userId}/follow`, { method: 'POST' });
  return !error;
}

export async function unfollowUser(userId: string): Promise<boolean> {
  const { error } = await apiCall(`/users/${userId}/follow`, { method: 'DELETE' });
  return !error;
}

export async function getFollowers(userId: string): Promise<User[]> {
  const { data, error } = await apiCall<{ followers: User[] }>(`/users/${userId}/followers`);
  if (error || !data) return [];
  return data.followers || [];
}

export async function getFollowing(userId: string): Promise<User[]> {
  const { data, error } = await apiCall<{ following: User[] }>(`/users/${userId}/following`);
  if (error || !data) return [];
  return data.following || [];
}

// ============ STORIES FUNCTIONS ============

export async function getStories(
  currentUserId?: string
): Promise<Array<{ user: User; story?: Story; isViewed?: boolean }>> {
  const { data, error } = await apiCall<{ stories: any[] }>('/stories');
  
  if (error || !data) return [];
  
  // Group stories by user
  const storyMap = new Map<string, { user: User; story: Story; isViewed: boolean }>();
  
  (data.stories || []).forEach((story: any) => {
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
      return [userStory, ...storyList.filter((s) => s.user.id !== currentUserId)];
    }
  }
  
  return storyList;
}

export async function createStory(storyData: {
  mediaUrl: string;
  mediaType: string;
  caption?: string;
}): Promise<Story | null> {
  const { data, error } = await apiCall<{ story: Story }>('/stories', {
    method: 'POST',
    body: JSON.stringify(storyData),
  });
  
  if (error || !data) return null;
  return data.story;
}

export async function markStoryViewed(storyId: string): Promise<boolean> {
  const { error } = await apiCall(`/stories/${storyId}/view`, { method: 'POST' });
  return !error;
}

// ============ NOTIFICATIONS FUNCTIONS ============

export async function getNotifications(): Promise<any[]> {
  const { data, error } = await apiCall<{ notifications: any[] }>('/notifications');
  if (error || !data) return [];
  return data.notifications || [];
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const { error } = await apiCall(`/notifications/${notificationId}/read`, { method: 'PATCH' });
  return !error;
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const { error } = await apiCall('/notifications/read-all', { method: 'POST' });
  return !error;
}

// ============ AI FUNCTIONS ============

export async function generateImage(prompt: string, aspectRatio: string = "1:1"): Promise<{ imageUrl: string; prompt: string } | null> {
  const { data, error } = await apiCall<{ imageUrl: string; prompt: string }>('/ai/generate-image', {
    method: 'POST',
    body: JSON.stringify({ prompt, aspectRatio }),
  });
  
  if (error || !data) return null;
  return data;
}

// ============ HELPER FUNCTIONS ============

// Map backend user fields (camelCase) to frontend fields (snake_case where needed)
function mapBackendUser(user: any): User {
  if (!user) return user;
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
  } as User;
}

// Map backend post fields to frontend Post type
function mapBackendPost(post: any): Post {
  if (!post) return post;
  return {
    id: post.id,
    user_id: post.userId || post.user_id,
    type: post.type || 'photo',
    media_url: post.mediaUrl || post.media_url || '',
    caption: post.caption || null,
    hashtags: post.hashtags || null,
    region: post.region || null,
    city: post.city || null,
    fire_count: post.fireCount || post.fire_count || 0,
    comment_count: post.commentCount || post.comment_count || 0,
    created_at: post.createdAt || post.created_at || new Date().toISOString(),
    is_fired: post.isFired || post.is_fired || false,
    user: post.user ? mapBackendUser(post.user) : undefined,
  } as Post;
}

// Map backend story fields
function mapBackendStory(story: any): Story {
  if (!story) return story;
  const mediaType = story.mediaType || story.media_type || 'photo';
  return {
    id: story.id,
    user_id: story.userId || story.user_id,
    media_url: story.mediaUrl || story.media_url || '',
    type: mediaType === 'video' ? 'video' : 'photo',
    duration: story.duration || 5,
    created_at: story.createdAt || story.created_at || new Date().toISOString(),
    expires_at: story.expiresAt || story.expires_at || new Date().toISOString(),
    is_viewed: story.isViewed || story.is_viewed || false,
    user: story.user ? mapBackendUser(story.user) : undefined,
  } as Story;
}
