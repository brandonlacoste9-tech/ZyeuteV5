import { z } from "zod";

// ==========================================
// User Schema
// ==========================================

export const UserRoleSchema = z.enum([
  "visitor",
  "citoyen",
  "moderator",
  "founder",
  "banned",
]);

const BaseUserSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    display_name: z.string().nullable().optional(),
    displayName: z.string().nullable().optional(), // Compat
    avatar_url: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(), // Compat
    bio: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    region: z.string().nullable().optional(),
    is_verified: z.boolean().default(false),
    isVerified: z.boolean().optional(), // Compat
    isPremium: z.boolean().optional(), // Added missing field
    coins: z.number().default(0),
    fire_score: z.number().default(0),
    created_at: z.string(),
    updated_at: z.string().optional(),

    // Computed / Social
    followers_count: z.number().default(0),
    followersCount: z.number().optional(), // Compat
    following_count: z.number().default(0),
    followingCount: z.number().optional(), // Compat
    posts_count: z.number().default(0),
    postsCount: z.number().optional(), // Compat
    is_following: z.boolean().default(false),
    isFollowing: z.boolean().optional(), // Compat
    is_online: z.boolean().optional(),

    // RBAC
    role: UserRoleSchema.optional(),
    custom_permissions: z.record(z.boolean()).optional(),

    // Ti-Guy Preferences
    tiGuyCommentsEnabled: z.boolean().default(true),
    ti_guy_comments_enabled: z.boolean().optional(), // Compat

    // Gamification
    last_daily_bonus: z.string().nullable().optional(),

    // Parent Link
    parent_id: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(), // Compat
  })
  .strict();

export const UserSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return val;
  return {
    id: val.id,
    username: val.username,
    // Camel + Snake population
    display_name: val.displayName || val.display_name || null,
    displayName: val.displayName || val.display_name || null,
    avatar_url: val.avatarUrl || val.avatar_url || null,
    avatarUrl: val.avatarUrl || val.avatar_url || null,

    bio: val.bio || null,
    city: val.city || val.location || null,
    region: val.region || null,

    is_verified: val.isVerified || val.is_verified || false,
    isVerified: val.isVerified || val.is_verified || false,
    isPremium: val.isPremium || val.is_premium || false,

    coins: val.coins || 0,
    fire_score: val.fireScore || val.fire_score || 0,

    created_at: val.createdAt || val.created_at || new Date().toISOString(),
    updated_at: val.updatedAt || val.updated_at || new Date().toISOString(),

    followers_count: val.followersCount || val.followers_count || 0,
    followersCount: val.followersCount || val.followers_count || 0,
    following_count: val.followingCount || val.following_count || 0,
    followingCount: val.followingCount || val.following_count || 0,
    posts_count: val.postsCount || val.posts_count || 0,
    postsCount: val.postsCount || val.posts_count || 0,

    is_following: val.isFollowing || val.is_following || false,
    isFollowing: val.isFollowing || val.is_following || false,

    is_online: val.is_online,

    role: val.role || "citoyen",
    custom_permissions: val.custom_permissions || {},

    // Ti-Guy
    tiGuyCommentsEnabled:
      val.tiGuyCommentsEnabled !== undefined
        ? val.tiGuyCommentsEnabled
        : val.ti_guy_comments_enabled !== undefined
          ? val.ti_guy_comments_enabled
          : true,
    ti_guy_comments_enabled:
      val.tiGuyCommentsEnabled !== undefined
        ? val.tiGuyCommentsEnabled
        : val.ti_guy_comments_enabled !== undefined
          ? val.ti_guy_comments_enabled
          : true,

    // Gamification
    last_daily_bonus: val.lastDailyBonus || val.last_daily_bonus || null,

    // Parent Link
    parent_id: val.parentId || val.parent_id || null,
    parentId: val.parentId || val.parent_id || null,
  };
}, BaseUserSchema);

export type User = z.infer<typeof BaseUserSchema>;

// ==========================================
// Comment Schema
// ==========================================

const BaseCommentSchema = z
  .object({
    id: z.string(),
    post_id: z.string(),
    user_id: z.string(),
    text: z.string(),
    content: z.string(), // Alias often used
    parent_id: z.string().nullable().optional(),
    likes: z.number().default(0),
    created_at: z.string(),

    // Relations
    user: BaseUserSchema.optional(),
  })
  .strict();

export const CommentSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return val;
  return {
    ...val,
    content: val.content || val.text || "",
    text: val.text || val.content || "",
  };
}, BaseCommentSchema);

export type Comment = z.infer<typeof BaseCommentSchema>;

// ==========================================
// Fire / Gift
// ==========================================

export const FireSchema = z
  .object({
    user_id: z.string(),
    post_id: z.string(),
    fire_level: z.number().int().min(1).max(5),
    created_at: z.string(),
  })
  .strict();

export type Fire = z.infer<typeof FireSchema>;

export const GiftTypeEnum = z.enum([
  "comete",
  "feuille_erable",
  "fleur_de_lys",
  "feu",
  "coeur_or",
]);

export const GiftSchema = z
  .object({
    id: z.string(),
    from_user_id: z.string(),
    to_user_id: z.string(),
    post_id: z.string().nullable().optional(),
    gift_type: z.string(),
    coin_value: z.number(),
    created_at: z.string(),

    // Relations
    from_user: BaseUserSchema.optional(),
    to_user: BaseUserSchema.optional(),
  })
  .strict();

export type Gift = z.infer<typeof GiftSchema>;

// ==========================================
// Story Schema
// ==========================================

const BaseStorySchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    media_url: z.string(),
    type: z.enum(["photo", "video"]),
    duration: z.number().default(5),
    created_at: z.string(),
    expires_at: z.string(),

    // Relations
    user: BaseUserSchema.optional(),

    // Computed
    is_viewed: z.boolean().default(false),
  })
  .strict();

export const StorySchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return val;
  const mediaType = val.mediaType || val.media_type || "photo";
  return {
    id: val.id,
    user_id: val.user_id || val.userId,
    media_url: val.media_url || val.mediaUrl || "",
    type: mediaType === "video" ? "video" : "photo",
    duration: val.duration || 5,
    created_at: val.created_at || val.createdAt,
    expires_at: val.expires_at || val.expiresAt,
    is_viewed: val.is_viewed || val.isViewed || false,
    user: val.user,
  };
}, BaseStorySchema);

export type Story = z.infer<typeof BaseStorySchema>;

// ==========================================
// Post Schema
// ==========================================

const PostBase = z.object({
  id: z.string(),
  user_id: z.string(),
  userId: z.string().optional(), // Compat
  media_url: z.string(),
  mediaUrl: z.string().optional(), // Compat
  type: z.enum(["photo", "video"]), // Base type, overridden in discriminated but field exists here for structure

  thumbnail_url: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(), // Compat

  caption: z.string().nullable().optional(),
  hashtags: z.array(z.string()).nullable().optional(),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),

  fire_count: z.number().default(0),
  fireCount: z.number().optional(), // Compat
  comment_count: z.number().default(0),
  commentCount: z.number().optional(), // Compat
  gift_count: z.number().default(0).optional(),
  giftCount: z.number().optional(), // Compat

  created_at: z.string(),
  createdAt: z.string().optional(), // Compat

  // Relations
  user: BaseUserSchema.optional(),
  user_fire: FireSchema.optional(),
  comments: z.array(CommentSchema).optional(),

  // Computed
  is_fired: z.boolean().optional(),
  fire_level: z.number().optional(),

  // Moderation (Phase 9)
  is_moderated: z.boolean().default(false),
  moderation_approved: z.boolean().default(true),
  is_hidden: z.boolean().default(false),
  // AI Enrichment (Phase 9 Upgrade)
  ai_description: z.string().nullable().optional(),
  aiDescription: z.string().nullable().optional(), // Compat
  ai_labels: z.array(z.string()).nullable().optional(),
  aiLabels: z.array(z.string()).nullable().optional(), // Compat

  // Ephemeral Protocol
  is_ephemeral: z.boolean().default(false),
  view_count: z.number().default(0),
  max_views: z.number().default(1),
  expires_at: z.string().nullable().optional(),
  burned_at: z.string().nullable().optional(),
  job_id: z.string().nullable().optional(),
  jobId: z.string().nullable().optional(),
});

const PhotoPost = PostBase.extend({
  type: z.literal("photo"),
});

const VideoPost = PostBase.extend({
  type: z.literal("video"),
  // Deep Enhance Fields
  original_url: z.string().optional(),
  enhanced_url: z.string().optional(),
  processing_status: z
    .enum(["ready", "pending", "processing", "completed", "failed"])
    .optional(),
  visual_filter: z.string().optional(),
  job_id: z.string().optional(),
  jobId: z.string().optional(), // Compat
});

// Discriminated Union
const BasePostSchema = z.discriminatedUnion("type", [PhotoPost, VideoPost]);

export const PostSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return val;

  const mediaUrl = val.media_url || val.mediaUrl || val.original_url;
  let type = val.type;

  // Auto-detect type logic from api.ts
  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const videoExtensions = [".mp4", ".mov", ".webm", ".ogg", ".m3u8"];
    return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
  };

  if (!type && mediaUrl) {
    type = isVideoUrl(mediaUrl) ? "video" : "photo";
  }

  return {
    ...val,
    id: val.id,
    user_id: val.user_id || val.userId,
    userId: val.user_id || val.userId,
    media_url: mediaUrl,
    mediaUrl: mediaUrl,
    thumbnail_url: val.thumbnail_url || val.thumbnailUrl,
    thumbnailUrl: val.thumbnail_url || val.thumbnailUrl,
    caption: val.caption,

    fire_count: val.reactions_count || val.fire_count || val.fireCount || 0,
    fireCount: val.reactions_count || val.fire_count || val.fireCount || 0,
    comment_count:
      val.comments_count || val.comment_count || val.commentCount || 0,
    commentCount:
      val.comments_count || val.comment_count || val.commentCount || 0,
    gift_count: val.gift_count || val.giftCount || 0,
    giftCount: val.gift_count || val.giftCount || 0,

    created_at: val.created_at || val.createdAt,
    createdAt: val.created_at || val.createdAt,

    type: type || "photo",
    region: val.region_id || val.region,
    city: val.city,
    // Ensure processing status defaults if video
    processing_status:
      val.processing_status || (type === "video" ? "ready" : undefined),
    job_id: val.job_id || val.jobId,
    jobId: val.job_id || val.jobId,

    // Moderation
    is_moderated: val.is_moderated || val.isModerated || false,
    moderation_approved:
      val.moderation_approved !== undefined
        ? val.moderation_approved
        : val.moderationApproved !== undefined
          ? val.moderationApproved
          : true,
    is_hidden: val.est_masque || val.isHidden || val.is_hidden || false,

    // AI Enrichment
    ai_description: val.ai_description || val.aiDescription,
    aiDescription: val.ai_description || val.aiDescription,
    ai_labels: val.ai_labels || val.aiLabels || [],
    aiLabels: val.ai_labels || val.aiLabels || [],

    // Ephemeral Protocol
    is_ephemeral: val.is_ephemeral || val.isEphemeral || false,
    view_count: val.view_count || val.viewCount || 0,
    max_views: val.max_views || val.maxViews || 1,
    expires_at: val.expires_at || val.expiresAt,
    burned_at: val.burned_at || val.burnedAt,
  };
}, BasePostSchema);

export type Post = z.infer<typeof BasePostSchema>;

// ==========================================
// Notification Schema (depends on Post/User)
// ==========================================

export const NotificationTypeEnum = z.enum([
  "fire",
  "comment",
  "follow",
  "gift",
  "mention",
  "story_view",
]);

const BaseNotificationSchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    type: NotificationTypeEnum,
    actor_id: z.string().default(""), // Allow empty string as fallback for null values
    post_id: z.string().nullable().optional(),
    comment_id: z.string().nullable().optional(),
    story_id: z.string().nullable().optional(),
    reference_id: z.string().nullable().optional(),
    is_read: z.boolean().default(false),
    created_at: z.string(),

    // Relations
    actor: BaseUserSchema.optional(),
    // Partial post to avoid full circular recursion + strict check issues
    post: z
      .object({
        id: z.string(),
        media_url: z.string().optional(),
        type: z.string().optional(),
      })
      .optional(),
  })
  .strict();

export const NotificationSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== "object") return val;

  // Map database notification types to schema types
  const typeMapping: Record<
    string,
    "fire" | "comment" | "follow" | "gift" | "mention" | "story_view"
  > = {
    nouvelle_reaction: "fire",
    fire: "fire",
    comment: "comment",
    follow: "follow",
    gift: "gift",
    mention: "mention",
    story_view: "story_view",
  };

  const mappedType = typeMapping[val.type] || "fire"; // Default to "fire" for unknown types

  // Handle actor_id - use from_user_id if actor_id is null
  const actorId = val.actor_id || val.fromUserId || val.from_user_id;

  return {
    id: val.id,
    user_id: val.user_id || val.userId,
    type: mappedType,
    actor_id: actorId || "", // Provide empty string fallback if still null
    post_id: val.postId || val.post_id || null,
    comment_id: val.commentId || val.comment_id || null,
    story_id: val.storyId || val.story_id || null,
    reference_id: val.referenceId || val.reference_id || null,
    is_read:
      val.isRead !== undefined
        ? val.isRead
        : val.is_read !== undefined
          ? val.is_read
          : false,
    created_at: val.createdAt || val.created_at || new Date().toISOString(),
    actor: val.actor || val.fromUser,
    post: val.post,
  };
}, BaseNotificationSchema);

export type Notification = z.infer<typeof NotificationSchema>;
