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
    piasse_balance: z.number().default(0.0),
    piasseBalance: z.number().optional(), // Compat
    total_karma: z.number().default(0),
    totalKarma: z.number().optional(), // Compat
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
    custom_permissions: z.record(z.string(), z.boolean()).optional(),

    // Ti-Guy Preferences
    tiGuyCommentsEnabled: z.boolean().default(true),
    ti_guy_comments_enabled: z.boolean().optional(), // Compat

    // Gamification
    last_daily_bonus: z.string().nullable().optional(),
    nectar_points: z.number().default(0),

    // Parent Link
    parent_id: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(), // Compat
  })
  .strict();

export const UserSchema = z.preprocess((val: unknown) => {
  if (!val || typeof val !== "object") return val;
  const v = val as Record<string, unknown>;
  return {
    id: v.id,
    username: v.username,
    // Camel + Snake population
    display_name: v.displayName || v.display_name || null,
    displayName: v.displayName || v.display_name || null,
    avatar_url: v.avatarUrl || v.avatar_url || null,
    avatarUrl: v.avatarUrl || v.avatar_url || null,

    bio: v.bio || null,
    city: v.city || v.location || null,
    region: v.region || null,

    is_verified: v.isVerified || v.is_verified || false,
    isVerified: v.isVerified || v.is_verified || false,
    isPremium: v.isPremium || v.is_premium || false,
    coins: v.coins || 0,
    piasse_balance: v.piasse_balance || v.piasseBalance || 0.0,
    piasseBalance: v.piasse_balance || v.piasseBalance || 0.0,
    total_karma: v.total_karma || v.totalKarma || 0,
    totalKarma: v.total_karma || v.totalKarma || 0,
    fire_score: v.fireScore || v.fire_score || 0,

    created_at: v.createdAt || v.created_at || new Date().toISOString(),
    updated_at: v.updatedAt || v.updated_at || new Date().toISOString(),

    followers_count: v.followersCount || v.followers_count || 0,
    followersCount: v.followersCount || v.followers_count || 0,
    following_count: v.followingCount || v.following_count || 0,
    followingCount: v.followingCount || v.following_count || 0,
    posts_count: v.postsCount || v.posts_count || 0,
    postsCount: v.postsCount || v.posts_count || 0,

    is_following: v.isFollowing || v.is_following || false,
    isFollowing: v.isFollowing || v.is_following || false,

    is_online: v.is_online,

    role: v.role || "citoyen",
    custom_permissions: v.custom_permissions || {},

    // Ti-Guy
    tiGuyCommentsEnabled:
      v.tiGuyCommentsEnabled !== undefined
        ? v.tiGuyCommentsEnabled
        : v.ti_guy_comments_enabled !== undefined
          ? v.ti_guy_comments_enabled
          : true,
    ti_guy_comments_enabled:
      v.tiGuyCommentsEnabled !== undefined
        ? v.tiGuyCommentsEnabled
        : v.ti_guy_comments_enabled !== undefined
          ? v.ti_guy_comments_enabled
          : true,

    // Gamification
    last_daily_bonus: v.lastDailyBonus || v.last_daily_bonus || null,
    nectar_points: v.nectarPoints || v.nectar_points || 0,

    // Parent Link
    parent_id: v.parentId || v.parent_id || null,
    parentId: v.parentId || v.parent_id || null,
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

export const CommentSchema = z.preprocess((val: unknown) => {
  if (!val || typeof val !== "object") return val;
  const v = val as Record<string, unknown>;
  return {
    ...v,
    content: v.content || v.text || "",
    text: v.text || v.content || "",
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
// Piasse Transaction Schema
// ==========================================

export const PiasseTransactionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  amount: z.number(),
  type: z.enum(["deal_click", "post_reward", "tip"]),
  created_at: z.string(),
});

export type PiasseTransaction = z.infer<typeof PiasseTransactionSchema>;

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

export const StorySchema = z.preprocess((val: unknown) => {
  if (!val || typeof val !== "object") return val;
  const v = val as Record<string, unknown>;
  const mediaType = v.mediaType || v.media_type || "photo";
  return {
    id: v.id,
    user_id: v.user_id || v.userId,
    media_url: v.media_url || v.mediaUrl || "",
    type: mediaType === "video" ? "video" : "photo",
    duration: v.duration || 5,
    created_at: v.created_at || v.createdAt,
    expires_at: v.expires_at || v.expiresAt,
    is_viewed: v.is_viewed || v.isViewed || false,
    user: v.user,
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
  hive_id: z.string().nullable().optional(), // Added
  hiveId: z.string().nullable().optional(), // Compat
  visibility: z.string().nullable().optional(), // Added
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
  user: z.lazy(() => UserSchema).optional(),
  user_fire: FireSchema.optional(),
  comments: z.array(CommentSchema).optional(),

  // Computed
  is_fired: z.boolean().optional(),
  fire_level: z.number().optional(),

  // Moderation (Phase 9)
  is_moderated: z.boolean().default(false),
  moderation_approved: z.boolean().default(true),
  is_hidden: z.boolean().default(false),
  isHidden: z.boolean().optional(), // Compat
  // AI Enrichment (Phase 9 Upgrade)
  ai_description: z.string().nullable().optional(),
  aiDescription: z.string().nullable().optional(), // Compat
  ai_labels: z.array(z.string()).nullable().optional(),
  aiLabels: z.array(z.string()).nullable().optional(), // Compat
  promo_url: z.string().nullable().optional(),
  promoUrl: z.string().nullable().optional(), // Compat
  detected_items: z.array(z.string()).nullable().optional(),
  detectedItems: z.array(z.string()).nullable().optional(), // Compat

  // Ephemeral Protocol
  is_ephemeral: z.boolean().default(false),
  view_count: z.number().default(0),
  max_views: z.number().default(1),
  expires_at: z.string().nullable().optional(),
  burned_at: z.string().nullable().optional(),

  // Video AI Enhancement (optional on all posts; only populated for video)
  original_url: z.string().optional(),
  originalUrl: z.string().optional(), // Compat
  enhanced_url: z.string().optional(),
  enhancedUrl: z.string().optional(), // Compat
  hls_url: z.string().optional(),
  hlsUrl: z.string().optional(), // Compat
  mux_playback_id: z.string().optional(),
  muxPlaybackId: z.string().optional(), // Compat
  processing_status: z
    .enum(["pending", "processing", "completed", "failed"])
    .optional(),
  processingStatus: z.enum(["pending", "processing", "completed", "failed"]).optional(), // Compat
  visual_filter: z.string().optional(),
  visualFilter: z.string().optional(), // Compat
});

const PhotoPost = PostBase.extend({
  type: z.literal("photo"),
});

const VideoPost = PostBase.extend({
  type: z.literal("video"),
});

// Discriminated Union
const BasePostSchema = z.discriminatedUnion("type", [PhotoPost, VideoPost]);

export const PostSchema = z.preprocess((val: unknown) => {
  if (!val || typeof val !== "object") return val;

  const v = val as Record<string, unknown>;

  const rawHls = v.hls_url || v.hlsUrl;
  const mediaUrl = rawHls || v.media_url || v.mediaUrl || v.original_url;
  let type = v.type;

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
    ...v,
    id: v.id,
    user_id: v.user_id || v.userId,
    userId: v.user_id || v.userId,
    media_url: mediaUrl,
    mediaUrl: mediaUrl,
    hls_url: rawHls,
    hlsUrl: rawHls,
    thumbnail_url: v.thumbnail_url || v.thumbnailUrl,
    thumbnailUrl: v.thumbnail_url || v.thumbnailUrl,
    caption: v.caption,

    fire_count: v.reactions_count || v.fire_count || v.fireCount || 0,
    fireCount: v.reactions_count || v.fire_count || v.fireCount || 0,
    comment_count:
      v.comments_count || v.comment_count || v.commentCount || 0,
    commentCount:
      v.comments_count || v.comment_count || v.commentCount || 0,
    gift_count: v.gift_count || v.giftCount || 0,
    giftCount: v.gift_count || v.giftCount || 0,

    created_at: v.created_at || v.createdAt,
    createdAt: v.created_at || v.createdAt,

    type: type || "photo",
    region: v.region_id || v.region,
    city: v.city,
    // Video enhancement fields - normalize both cases
    original_url: v.original_url || v.originalUrl,
    originalUrl: v.original_url || v.originalUrl,
    enhanced_url: v.enhanced_url || v.enhancedUrl,
    enhancedUrl: v.enhanced_url || v.enhancedUrl,
    mux_playback_id: v.mux_playback_id || v.muxPlaybackId,
    muxPlaybackId: v.mux_playback_id || v.muxPlaybackId,
    processing_status:
      v.processing_status || v.processingStatus || (type === "video" ? "completed" : undefined),
    processingStatus:
      v.processing_status || v.processingStatus || (type === "video" ? "completed" : undefined),
    visual_filter: v.visual_filter || v.visualFilter,
    visualFilter: v.visual_filter || v.visualFilter,

    // Moderation
    is_moderated: v.is_moderated || v.isModerated || false,
    moderation_approved:
      v.moderation_approved !== undefined
        ? v.moderation_approved
        : v.moderationApproved !== undefined
          ? v.moderationApproved
          : true,
    moderationApproved:
      v.moderation_approved || v.moderationApproved || true,
    is_hidden: v.is_hidden || v.isHidden || false,
    isHidden: v.is_hidden || v.isHidden || false,
    // AI Enrichment
    ai_description: v.ai_description || v.aiDescription,
    aiDescription: v.ai_description || v.aiDescription,
    ai_labels: v.ai_labels || v.aiLabels || [],
    aiLabels: v.ai_labels || v.aiLabels || [],
    promo_url: v.promo_url || v.promoUrl,
    promoUrl: v.promo_url || v.promoUrl,
    detected_items: v.detected_items || v.detectedItems || [],
    detectedItems: v.detected_items || v.detectedItems || [],

    // Ephemeral Protocol
    is_ephemeral: v.is_ephemeral || v.isEphemeral || false,
    view_count: v.view_count || v.viewCount || 0,
    max_views: v.max_views || v.maxViews || 1,
    expires_at: v.expires_at || v.expiresAt,
    burned_at: v.burned_at || v.burnedAt,
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

export const NotificationSchema = z.preprocess((val: unknown) => {
  if (!val || typeof val !== "object") return val;
  const v = val as Record<string, unknown>;

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

  const mappedType = typeMapping[v.type] || "fire"; // Default to "fire" for unknown types

  // Handle actor_id - use from_user_id if actor_id is null
  const actorId = v.actor_id || v.fromUserId || v.from_user_id;

  return {
    id: v.id,
    user_id: v.user_id || v.userId,
    type: mappedType,
    actor_id: actorId || "", // Provide empty string fallback if still null
    post_id: v.postId || v.post_id || null,
    comment_id: v.commentId || v.comment_id || null,
    story_id: v.storyId || v.story_id || null,
    reference_id: v.referenceId || v.reference_id || null,
    is_read:
      v.isRead !== undefined
        ? v.isRead
        : v.is_read !== undefined
          ? v.is_read
          : false,
    created_at: v.createdAt || v.created_at || new Date().toISOString(),
    actor: v.actor || v.fromUser,
    post: v.post,
  };
}, BaseNotificationSchema);

export type Notification = z.infer<typeof NotificationSchema>;
