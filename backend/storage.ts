import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import path from "path";
import {
  users,
  posts,
  comments,
  follows,
  postReactions,
  commentReactions,
  stories,
  storyViews,
  notifications,
  gifts,
  moderationLogs,
  type User,
  type InsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type Follow,
  type InsertFollow,
  type Story,
  type InsertStory,
  type Notification,
  type InsertNotification,
  type Gift,
  type InsertGift,
  type GiftType,
  type UpsertUser,
  colonyTasks,
  type ColonyTask,
  parentalControls,
  type ParentalControl,
  type InsertParentalControl,
  aiGenerationCosts,
  transactions,
  type Transaction,
  type InsertTransaction,
} from "../shared/schema.js";
import {
  eq,
  and,
  desc,
  sql,
  inArray,
  isNull,
  or,
  gte,
  lte,
  aliasedTable,
} from "drizzle-orm";
import { traceDatabase } from "./tracer.js";
import { calculateCulturalMomentum } from "./scoring/algorithms.js";

const { Pool } = pg;

// Lazy pool - created on first use, AFTER dotenv has loaded in index.ts.
// ES module imports are hoisted, so eagerly creating the pool here would
// run before dotenv, leaving DATABASE_URL undefined.
let _pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!_pool) {
    // Purge any environment variables that might conflict with the connection string
    // This is critical if the environment has PGPORT=5432 set (common in dev containers)
    delete process.env.PGHOST;
    delete process.env.PGPORT;
    delete process.env.PGUSER;
    delete process.env.PGPASSWORD;
    delete process.env.PGDATABASE;

    // Explicitly load .env if not already loaded (local dev only — Render injects env vars directly)
    if (process.env.NODE_ENV !== "production") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const dotenv = require("dotenv") as typeof import("dotenv");
        dotenv.config();
        const envPath = path.join(process.cwd(), ".env");
        dotenv.config({ path: envPath });
      } catch {
        // dotenv not available — env vars already injected by host
      }
    }

    if (!process.env.DATABASE_URL) {
      console.warn("⚠️ [STORAGE] DATABASE_URL is not defined in process.env!");
    } else {
      const url = process.env.DATABASE_URL;
      // Transaction pooler (6543) breaks prepared statements / long sessions with node-pg.
      if (/:(6543)\b/.test(url) || url.includes("6543/postgres")) {
        console.warn(
          "⚠️ [STORAGE] DATABASE_URL uses port 6543 (transaction mode). Prefer Supabase session pooler port 5432 for Drizzle/pg.",
        );
      }
      console.log(
        "🔌 [STORAGE] Initializing pool with URL:",
        url.substring(0, 30) + "...",
      );
    }
    const isProd = process.env.NODE_ENV === "production";
    _pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      // Keep the shared pool small on Render — Supabase pooler has limited slots
      // per client. Grid Rush transactions use direct pg.Client connections instead.
      max: isProd ? 4 : 10,
      connectionTimeoutMillis: isProd ? 15000 : 3000,
      idleTimeoutMillis: 30000,
      ssl: { rejectUnauthorized: false }, // FORCE SSL ALWAYS
    });
    // Database error handling - prevent crashes on connection failures
    _pool.on("error", (err) => {
      console.error("❌ Unexpected database pool error:", err);
      // Don't crash the process - let health checks handle degraded state
    });
    _pool.on("connect", () => {
      console.log("✅ Database pool connection established");
    });
  }
  return _pool;
}
// Proxy so all existing `pool` imports work unchanged — delegates to
// getPool() on first property access, which happens after dotenv loads.
export const pool = new Proxy({} as pg.Pool, {
  get(_, prop) {
    return (getPool() as any)[prop];
  },
});

export const db = drizzle(pool); // Export db

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  // getUserByReplitId removed - legacy
  getUserHive(userId: string): Promise<string>;
  createUser(user: InsertUser & { id: string }): Promise<User>;
  // createUserFromOAuth removed - legacy
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserCredits(userId: string, amount: number): Promise<User | undefined>; // Added for Nectar Bonus
  deductCashCredits(userId: string, amount: number): Promise<boolean>;

  // Posts
  getPost(id: string): Promise<(Post & { user: User }) | undefined>;
  getPostsByUser(userId: string, limit?: number): Promise<Post[]>;
  getFeedPosts(
    userId: string,
    page: number,
    limit: number,
    hiveId?: string,
  ): Promise<(Post & { user: User; isFired: boolean })[]>;
  getExplorePosts(
    page: number,
    limit: number,
    hiveId?: string,
  ): Promise<(Post & { user: User })[]>;
  getRecentPosts(limit: number): Promise<(Post & { user: User })[]>;
  getNearbyPosts(
    lat: number,
    lon: number,
    radiusMeters?: number,
  ): Promise<(Post & { user: User })[]>;
  getRegionalTrendingPosts(
    regionId: string,
    limit?: number,
    before?: Date,
  ): Promise<(Post & { user: User })[]>;
  getSmartRecommendations(
    embedding: number[],
    limit?: number,
    hiveId?: string,
  ): Promise<(Post & { user: User })[]>;
  createPost(post: InsertPost): Promise<Post>;
  deletePost(id: string): Promise<boolean>;
  hidePostForUser(userId: string, postId: string): Promise<boolean>;
  getHiddenPostIds(userId: string): Promise<string[]>;
  incrementPostViews(id: string): Promise<number>;
  markPostBurned(id: string, reason: string): Promise<void>;
  // Comments
  getPostComments(
    postId: string,
  ): Promise<(Comment & { user: User; isFired: boolean })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<boolean>;

  // Reactions
  togglePostReaction(
    postId: string,
    userId: string,
  ): Promise<{ added: boolean; newCount: number }>;
  toggleCommentReaction(
    commentId: string,
    userId: string,
  ): Promise<{ added: boolean; newCount: number }>;
  hasUserFiredPost(postId: string, userId: string): Promise<boolean>;

  // Follows
  followUser(followerId: string, followingId: string): Promise<boolean>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;

  // Stories
  getActiveStories(
    userId?: string,
  ): Promise<(Story & { user: User; isViewed: boolean })[]>;
  createStory(story: InsertStory): Promise<Story>;
  markStoryViewed(storyId: string, userId: string): Promise<void>;

  // Notifications
  getUserNotifications(
    userId: string,
    limit?: number,
  ): Promise<(Notification & { fromUser?: User })[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Gifts
  createGift(gift: InsertGift): Promise<Gift>;
  getPostGiftCount(postId: string): Promise<number>;
  getGiftsByPost(postId: string): Promise<(Gift & { sender: User })[]>;
  getUserReceivedGifts(
    userId: string,
    limit?: number,
  ): Promise<(Gift & { sender: User; post: Post })[]>;

  // Colony Tasks (AI Hive)
  createColonyTask(task: {
    command: string;
    origin: string;
    priority?: string;
    metadata?: any;
    workerId?: string;
  }): Promise<ColonyTask>;

  // Moderation Logs
  createModerationLog(log: {
    userId: string;
    action: string;
    reason: string;
    details?: string;
    score?: number;
  }): Promise<void>;
  getModerationLogsByUser(userId: string): Promise<any[]>;
  cleanupExpiredEphemeralPosts(): Promise<number>;
  // Parental Controls
  getParentalControls(childId: string): Promise<ParentalControl | undefined>;
  upsertParentalControls(
    controls: InsertParentalControl,
  ): Promise<ParentalControl>;
  linkChild(parentId: string, childUsername: string): Promise<User | undefined>;
  getChildren(parentId: string): Promise<User[]>;

  // Shadow Ledger & Credits
  executeTransfer(
    senderId: string,
    receiverId: string,
    amount: number,
  ): Promise<boolean>;
  refundPiasses(userId: string, amount: number, reason: string): Promise<void>;
  awardKarma(userId: string, amount: number, reason: string): Promise<void>;
  creditPiasses(userId: string, amount: number): Promise<boolean>;
  getUserTransactions(
    userId: string,
    limit?: number,
  ): Promise<(Transaction & { sender?: User; receiver?: User })[]>;
  getRawDb(): any;

  // Moderation
  getModerationHistory(userId: string): Promise<{ violations: number }>;

  // Support Tickets
  createSupportTicket(ticket: any): Promise<any>;
  getUserSupportTickets(userId: string): Promise<any[]>;
  getSupportTicket(ticketId: string): Promise<any>;
  addTicketMessage(message: any): Promise<any>;
  updateTicketStatus(
    ticketId: string,
    status: string,
    userId?: string,
  ): Promise<boolean>;
}

// Helper: map raw Supabase user_profiles row to Drizzle User type
function mapSupabaseUser(data: any): User {
  return {
    id: data.id,
    username: data.username || "",
    email: data.email || null,
    displayName: data.display_name || null,
    bio: data.bio || null,
    avatarUrl: data.avatar_url || null,
    region: data.region || null,
    role: data.role || "citoyen",
    customPermissions: data.custom_permissions || {},
    isAdmin: data.is_admin || false,
    isPremium: data.is_premium || false,
    plan: data.plan || "free",
    credits: data.credits || 0,
    piasseBalance: data.piasse_balance || 0,
    totalKarma: data.total_karma || 0,
    subscriptionTier: data.subscription_tier || "free",
    location: data.location || null,
    city: data.city || null,
    regionId: data.region_id || null,
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    updatedAt: data.updated_at ? new Date(data.updated_at) : null,
    tiGuyCommentsEnabled: data.ti_guy_comments_enabled !== false,
    hiveId: data.hive_id || "quebec",
    karmaCredits: data.karma_credits || 0,
    cashCredits: data.cash_credits || 0,
    totalGiftsSent: data.total_gifts_sent || 0,
    totalGiftsReceived: data.total_gifts_received || 0,
    legendaryBadges: data.legendary_badges || [],
    taxId: data.tax_id || null,
    beeAlias: data.bee_alias || null,
    nectarPoints: data.nectar_points || 0,
    currentStreak: data.current_streak || 0,
    maxStreak: data.max_streak || 0,
    lastDailyBonus: data.last_daily_bonus
      ? new Date(data.last_daily_bonus)
      : null,
    unlockedHives: data.unlocked_hives || ["quebec"],
    raisonBannissement: data.raison_bannissement || null,
    parentId: data.parent_id || null,
    arcadePlaytime: data.arcade_playtime || 0,
  } as User;
}

// Helper: race any promise against a timeout — lets Drizzle fail fast
// instead of hanging for the full pool connectionTimeoutMillis.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`DB query timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

// Helper: get a Supabase client for REST fallback when Drizzle pool can't connect
function getSupabaseFallback() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    try {
      return await withTimeout(
        traceDatabase("SELECT", "users", async (span) => {
          span.setAttributes({ "db.user_id": id });
          const result = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
          return result[0];
        }),
        2500,
      );
    } catch (err) {
      console.error(
        "[storage.getUser] Drizzle failed, using Supabase REST fallback:",
        (err as Error).message,
      );
      const sb = getSupabaseFallback();
      if (!sb) return undefined;
      const { data } = await sb
        .from("user_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      return data ? mapSupabaseUser(data) : undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      return await withTimeout(
        traceDatabase("SELECT", "users", async (span) => {
          span.setAttributes({ "db.username": username });
          const result = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);
          return result[0];
        }),
        2500,
      );
    } catch (err) {
      console.error(
        "[storage.getUserByUsername] Drizzle failed, using Supabase REST fallback:",
        (err as Error).message,
      );
      const sb = getSupabaseFallback();
      if (!sb) return undefined;
      const { data } = await sb
        .from("user_profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      return data ? mapSupabaseUser(data) : undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await withTimeout(
        db.select().from(users).where(eq(users.email, email)).limit(1),
        2500,
      );
      return result[0];
    } catch (err) {
      console.error(
        "[storage.getUserByEmail] Drizzle failed:",
        (err as Error).message,
      );
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser & { id: string }): Promise<User> {
    return traceDatabase("INSERT", "users", async (span) => {
      span.setAttributes({ "db.username": insertUser.username });
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    });
  }

  async updateUser(
    id: string,
    updates: Partial<User>,
  ): Promise<User | undefined> {
    // Map camelCase Drizzle fields to snake_case for Supabase REST fallback
    const snakeUpdates: Record<string, any> = {};
    if (updates.displayName !== undefined)
      snakeUpdates.display_name = updates.displayName;
    if (updates.bio !== undefined) snakeUpdates.bio = updates.bio;
    if (updates.avatarUrl !== undefined)
      snakeUpdates.avatar_url = updates.avatarUrl;
    if (updates.city !== undefined) snakeUpdates.city = updates.city;
    if (updates.region !== undefined) snakeUpdates.region = updates.region;
    if (updates.username !== undefined)
      snakeUpdates.username = updates.username;
    if (updates.tiGuyCommentsEnabled !== undefined)
      snakeUpdates.ti_guy_comments_enabled = updates.tiGuyCommentsEnabled;
    if (updates.hiveId !== undefined) snakeUpdates.hive_id = updates.hiveId;
    if (updates.regionId !== undefined)
      snakeUpdates.region_id = updates.regionId;
    if (updates.role !== undefined) snakeUpdates.role = updates.role;
    if (updates.isPremium !== undefined)
      snakeUpdates.is_premium = updates.isPremium;
    if (updates.isAdmin !== undefined) snakeUpdates.is_admin = updates.isAdmin;
    if (updates.plan !== undefined) snakeUpdates.plan = updates.plan;
    if (updates.subscriptionTier !== undefined)
      snakeUpdates.subscription_tier = updates.subscriptionTier;
    if (updates.arcadePlaytime !== undefined)
      snakeUpdates.arcade_playtime = updates.arcadePlaytime;
    if ((updates as any).affinityTags !== undefined)
      snakeUpdates.affinity_tags = (updates as any).affinityTags;

    try {
      const result = await withTimeout(
        db
          .update(users)
          .set({ ...updates, createdAt: undefined })
          .where(eq(users.id, id))
          .returning(),
        2500,
      );
      return result[0];
    } catch (err) {
      console.error(
        "[storage.updateUser] Drizzle failed, using Supabase REST fallback:",
        (err as Error).message,
      );
      const sb = getSupabaseFallback();
      if (!sb || Object.keys(snakeUpdates).length === 0) return undefined;
      const { data, error } = await sb
        .from("user_profiles")
        .update({ ...snakeUpdates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) {
        console.error("[storage.updateUser] Supabase fallback error:", error);
        return undefined;
      }
      return data ? mapSupabaseUser(data) : undefined;
    }
  }

  async updateUserCredits(
    userId: string,
    amount: number,
  ): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ credits: sql`${users.credits} + ${amount}` })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async deductCashCredits(userId: string, amount: number): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ cashCredits: sql`${users.cashCredits} - ${amount}` })
      // Use SQL conditional to ensure balance cannot drop below 0 due to a race condition
      .where(and(eq(users.id, userId), sql`${users.cashCredits} >= ${amount}`))
      .returning();
    return result.length > 0;
  }

  async getUserHive(userId: string): Promise<string> {
    const user = await this.getUser(userId);
    return user?.hiveId || "quebec";
  }

  // Posts
  async getPost(id: string): Promise<(Post & { user: User }) | undefined> {
    const result = await db
      .select()
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, id))
      .limit(1);

    if (!result[0] || !result[0].user_profiles) return undefined;

    // Drizzle uses the table name as defined in pgTable for joined result keys
    return {
      ...result[0].publications,
      user: result[0].user_profiles,
    };
  }

  async getPostsByUser(userId: string, limit: number = 50): Promise<Post[]> {
    // Only columns the profile grid / feed cards need.
    // Never select embedding (768-dim vector) — that alone made this endpoint ~15–20s
    // and tripped the client 15s abort ("empty profile" / connection feel).
    const PROFILE_POST_COLUMNS =
      "id, user_id, type, media_url, original_url, enhanced_url, processing_status, mux_playback_id, hls_url, thumbnail_url, caption, content, reactions_count, comments_count, est_masque, view_count, city, region_id, created_at, is_ephemeral, is_vaulted, deleted_at";

    try {
      return (await db
        .select({
          id: posts.id,
          userId: posts.userId,
          type: posts.type,
          mediaUrl: posts.mediaUrl,
          originalUrl: posts.originalUrl,
          enhancedUrl: posts.enhancedUrl,
          processingStatus: posts.processingStatus,
          muxPlaybackId: posts.muxPlaybackId,
          hlsUrl: posts.hlsUrl,
          thumbnailUrl: posts.thumbnailUrl,
          caption: posts.caption,
          content: posts.content,
          fireCount: posts.fireCount,
          commentCount: posts.commentCount,
          isHidden: posts.isHidden,
          viewCount: posts.viewCount,
          city: posts.city,
          regionId: posts.regionId,
          createdAt: posts.createdAt,
          isEphemeral: posts.isEphemeral,
          isVaulted: posts.isVaulted,
          deletedAt: posts.deletedAt,
        })
        .from(posts)
        .where(
          and(
            eq(posts.userId, userId),
            or(eq(posts.isHidden, false), isNull(posts.isHidden)),
          ),
        )
        .orderBy(desc(posts.createdAt))
        .limit(limit)) as Promise<Post[]>;
    } catch (err) {
      console.error(
        "[storage.getPostsByUser] Drizzle failed, using Supabase REST fallback:",
        (err as Error).message,
      );
      const sb = getSupabaseFallback();
      if (!sb) return [];
      const { data } = await sb
        .from("publications")
        .select(PROFILE_POST_COLUMNS)
        .eq("user_id", userId)
        .or("est_masque.is.null,est_masque.eq.false")
        .order("created_at", { ascending: false })
        .limit(limit);
      return (data || []) as unknown as Post[];
    }
  }

  async getFeedPosts(
    userId: string,
    page: number,
    limit: number,
    hiveId: string = "quebec",
  ): Promise<(Post & { user: User; isFired: boolean })[]> {
    const offset = page * limit;

    // Get users that the current user follows
    const followingUsers = await db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followingIds = followingUsers.map((f) => f.id);

    // Include the current user's posts too
    followingIds.push(userId);

    // Get posts from followed users
    const result = await db
      .select({
        post: posts,
        user: users,
        reaction: postReactions,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(
        postReactions,
        and(
          eq(postReactions.postId, posts.id),
          eq(postReactions.userId, userId),
        ),
      )
      .where(
        and(
          inArray(
            posts.userId,
            followingIds.length > 0 ? followingIds : [userId],
          ),
          or(eq(posts.isHidden, false), isNull(posts.isHidden)),
          eq(posts.visibility, "public"),
          eq(posts.hiveId, hiveId as any), // Filter by Hive
        ),
      )
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // [FALLBACK] If the feed is empty (e.g., new user with no follows), return explore posts
    if (result.length === 0) {
      console.log(
        `[STORAGE] Feed empty for user ${userId}, falling back to explore`,
      );
      return this.getExplorePosts(page, limit, hiveId).then((posts) =>
        posts.map((p) => ({ ...p, isFired: false })),
      );
    }

    return result.map((r) => ({
      ...r.post,
      user: (r.user || {
        id: r.post.userId,
        username: "unknown",
        displayName: "Unknown User",
      }) as unknown as User,
      isFired: !!r.reaction,
    }));
  }

  // getExplorePosts implementation moved to line 548 (uses traceDatabase)

  async getNearbyPosts(
    lat: number,
    lon: number,
    radiusMeters: number = 50000,
  ): Promise<(Post & { user: User })[]> {
    return traceDatabase("SELECT", "nearby_publications", async (span) => {
      span.setAttributes({
        "db.lat": lat,
        "db.lon": lon,
        "db.radius": radiusMeters,
      });

      const result = await db
        .select({
          post: posts,
          user: users,
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(
          // sql`ST_DWithin(${posts.location}, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography, ${radiusMeters})`
          eq(posts.visibility, "public"),
        )
        .orderBy(desc(posts.createdAt))
        .limit(50);

      return result
        .filter((r) => r.user)
        .map((r) => ({
          ...r.post,
          user: r.user!,
        }));
    });
  }

  async getRegionalTrendingPosts(
    regionId: string,
    limit: number = 20,
    before?: Date,
  ): Promise<(Post & { user: User })[]> {
    return traceDatabase("SELECT", "regional_trending_mv", async (span) => {
      span.setAttributes({ "db.region_id": regionId, "db.limit": limit });

      const beforeTimestamp = before || new Date();

      // Use the Materialized View for performance
      const result = await db
        .select({
          post: posts,
          user: users,
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .innerJoin(
          sql`public.tendances_par_region_mv`,
          eq(sql`public.tendances_par_region_mv.publication_id`, posts.id),
        )
        .where(
          and(
            eq(posts.regionId, regionId),
            sql`public.tendances_par_region_mv.created_at < ${beforeTimestamp}`,
          ),
        )
        .orderBy(
          desc(sql`public.tendances_par_region_mv.score`),
          desc(posts.createdAt),
        )
        .limit(limit);

      return result.map((r) => ({
        ...r.post,
        user: r.user,
      }));
    });
  }

  async getSmartRecommendations(
    _embedding: number[],
    limit: number = 20,
    hiveId: string = "quebec",
  ): Promise<(Post & { user: User })[]> {
    return traceDatabase("SELECT", "smart_recommendations", async (span) => {
      span.setAttributes({ "db.limit": limit });
      const startTime = Date.now();

      // Fetch candidates for re-ranking
      const candidates = await db
        .select({
          post: posts,
          user: users,
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(
          and(
            eq(posts.isHidden, false),
            isNull(posts.deletedAt),
            eq(posts.hiveId, hiveId as any),
          ),
        )
        .orderBy(desc(posts.createdAt))
        .limit(100);

      const now = Date.now();
      const ranked = candidates
        .map((r) => ({
          ...r,
          momentum: calculateCulturalMomentum(
            {
              ...r.post,
              fireCount: r.post.fireCount || 0,
              sharesCount: (r.post as any).sharesCount || 0,
              piasseCount: (r.post as any).piasseCount || 0,
            },
            (now - r.post.createdAt.getTime()) / 36e5,
          ),
        }))
        .sort((a, b) => b.momentum - a.momentum);

      const duration = Date.now() - startTime;
      if (duration > 200) {
        console.warn(`[SENTRY] Slow Smart Recommendations: ${duration}ms`);
      }

      return ranked.slice(0, limit).map((r) => ({
        ...r.post,
        user: r.user,
      }));
    });
  }

  async getExplorePosts(
    page: number,
    limit: number,
    hiveId?: string,
  ): Promise<(Post & { user: User })[]> {
    return traceDatabase("EXPLORE", "posts", async () => {
      const startTime = Date.now();
      const targetHive = hiveId || "quebec";
      const pageNum = Math.max(0, page);
      // Fetch enough rows to rank and slice the requested page (ranking is in-memory)
      const fetchSize = Math.min(200, (pageNum + 1) * limit + 50);

      // Use raw SQL via pool - resilient to schema diffs between envs
      // Only selects columns guaranteed to exist in all DB versions
      const client = await pool.connect();
      try {
        const result = await client.query(
          `SELECT
            p.id, p.user_id, p.media_url, p.hls_url, p.thumbnail_url,
            CASE
              WHEN p.mux_playback_id IS NOT NULL THEN 'video'
              WHEN p.hls_url IS NOT NULL THEN 'video'
              WHEN p.media_url ILIKE '%.mp4' THEN 'video'
              WHEN p.media_url ILIKE '%.webm' THEN 'video'
              WHEN p.media_url ILIKE '%.m3u8' THEN 'video'
              WHEN p.media_url ILIKE '%stream.mux.com%' THEN 'video'
              WHEN p.media_url ILIKE '%pexels.com/video%' THEN 'video'
              ELSE 'video'
            END as type,
            p.content, p.caption, p.visibility,
            COALESCE(p.reactions_count, 0) as reactions_count,
            COALESCE(p.comments_count, 0) as comments_count,
            COALESCE(p.shares_count, 0) as shares_count,
            COALESCE(p.piasse_count, 0) as piasse_count,
            COALESCE(p.est_masque, false) as est_masque,
            p.processing_status, p.aspect_ratio,
            p.mux_playback_id, p.mux_asset_id,
            p.hive_id, p.city, p.region_id,
            p.created_at, p.deleted_at,
            u.id as u_id, u.username, u.display_name, u.avatar_url,
            u.email, u.region, u.hive_id as u_hive_id,
            u.is_admin, u.is_premium, u.plan, u.credits,
            COALESCE(u.piasse_balance, 0) as piasse_balance,
            COALESCE(u.total_karma, 0) as total_karma,
            u.subscription_tier, u.city as u_city, u.region_id as u_region_id,
            u.created_at as u_created_at, u.updated_at as u_updated_at,
            COALESCE(u.nectar_points, 0) as nectar_points,
            COALESCE(u.current_streak, 0) as current_streak
          FROM publications p
          LEFT JOIN user_profiles u ON p.user_id = u.id
          WHERE
            COALESCE(p.est_masque, false) = false
            AND p.deleted_at IS NULL
            AND COALESCE(p.visibility, 'public') = 'public'
            AND (
              p.processing_status IS NULL
              OR p.processing_status = 'completed'
              OR p.mux_playback_id IS NOT NULL
            )
            AND (p.processing_status IS NULL OR p.processing_status != 'no_audio')
            -- Allow all video sources including TikTok embed URLs
            AND p.media_url IS NOT NULL
            AND p.media_url != ''
            AND (p.hive_id::text = $1 OR p.hive_id::text = 'global' OR p.hive_id IS NULL)
          ORDER BY p.created_at DESC
          LIMIT $2`,
          [targetHive, fetchSize],
        );

        console.log(
          `[STORAGE] Raw SQL explore: ${result.rows.length} posts in hive '${targetHive}'`,
        );

        if (result.rows.length === 0) return [];

        const now = Date.now();
        const ranked = result.rows
          .map((row) => {
            const post = {
              id: row.id,
              userId: row.user_id,
              mediaUrl: row.media_url,
              hlsUrl: row.hls_url,
              thumbnailUrl: row.thumbnail_url,
              type: (row.type as "video" | "photo") || "video",
              content: row.content || "",
              caption: row.caption,
              visibility: row.visibility || "public",
              fireCount: Number(row.reactions_count) || 0,
              commentCount: Number(row.comments_count) || 0,
              sharesCount: Number(row.shares_count) || 0,
              piasseCount: Number(row.piasse_count) || 0,
              isHidden: row.est_masque || false,
              processingStatus: row.processing_status || "completed",
              aspectRatio: row.aspect_ratio || "9:16",
              muxPlaybackId: row.mux_playback_id,
              muxAssetId: row.mux_asset_id,
              hiveId: row.hive_id,
              city: row.city,
              regionId: row.region_id,
              createdAt: new Date(row.created_at),
              deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
              originalUrl: null,
              enhancedUrl: null,
              mediaMetadata: {},
              muxUploadId: null,
              promoUrl: null,
              hlsUrl2: null,
              duration: null,
              visualFilter: "none",
              enhanceStartedAt: null,
              enhanceFinishedAt: null,
              region: null,
              embedding: null,
              lastEmbeddedAt: null,
              transcription: null,
              transcribedAt: null,
              aiDescription: null,
              aiLabels: [],
              contentFr: null,
              contentEn: null,
              hashtags: [],
              detectedThemes: [],
              detectedItems: [],
              aiGenerated: false,
              quebecScore: 0,
              viralScore: 0,
              safetyFlags: {},
              isModerated: false,
              moderationApproved: true,
              moderationScore: 0,
              moderatedAt: null,
              isEphemeral: false,
              viewCount: 0,
              maxViews: 1,
              expiresAt: null,
              burnedAt: null,
              isVaulted: false,
              remixType: null,
              originalPostId: null,
              remixCount: 0,
              soundId: null,
              soundStartTime: 0,
            } as unknown as Post;

            const user = row.u_id
              ? ({
                  id: row.u_id,
                  username: row.username,
                  displayName: row.display_name,
                  display_name: row.display_name,
                  avatarUrl: row.avatar_url,
                  avatar_url: row.avatar_url,
                  email: row.email,
                  region: row.region,
                  hiveId: row.u_hive_id || "quebec",
                  isAdmin: row.is_admin || false,
                  isPremium: row.is_premium || false,
                  plan: row.plan || "free",
                  credits: row.credits || 0,
                  piasseBalance: Number(row.piasse_balance) || 0,
                  totalKarma: Number(row.total_karma) || 0,
                  subscriptionTier: row.subscription_tier || "free",
                  city: row.u_city,
                  regionId: row.u_region_id,
                  createdAt: new Date(row.u_created_at),
                  updatedAt: row.u_updated_at
                    ? new Date(row.u_updated_at)
                    : null,
                  nectarPoints: Number(row.nectar_points) || 0,
                  currentStreak: Number(row.current_streak) || 0,
                  bio: null,
                  role: "citoyen",
                  customPermissions: {},
                  location: null,
                  tiGuyCommentsEnabled: true,
                  karmaCredits: 0,
                  cashCredits: 0,
                  totalGiftsSent: 0,
                  totalGiftsReceived: 0,
                  legendaryBadges: [],
                  taxId: null,
                  beeAlias: null,
                  maxStreak: 0,
                  lastDailyBonus: null,
                  unlockedHives: ["quebec"],
                  parentId: null,
                  totalDocumentsProcessed: 0,
                  stripeCustomerId: null,
                  tier: null,
                } as unknown as User)
              : ({
                  id: row.user_id,
                  username: "unknown",
                  displayName: "Unknown User",
                  avatarUrl: null,
                } as unknown as User);

            return {
              post,
              user,
              momentum: calculateCulturalMomentum(
                {
                  ...post,
                  fireCount: post.fireCount || 0,
                  sharesCount: (post as any).sharesCount || 0,
                  piasseCount: (post as any).piasseCount || 0,
                },
                (now - post.createdAt.getTime()) / 36e5,
              ),
            };
          })
          .sort((a, b) => b.momentum - a.momentum);

        const duration = Date.now() - startTime;
        if (duration > 200) {
          console.warn(`[SENTRY] Slow Explore Ranking: ${duration}ms`);
        }

        const start = pageNum * limit;
        return ranked
          .slice(start, start + limit)
          .map((r) => ({ ...r.post, user: r.user! }));
      } finally {
        client.release();
      }
    });
  }

  async getRecentPosts(limit: number): Promise<(Post & { user: User })[]> {
    return this.getExplorePosts(0, limit, "global");
  }

  async createPost(post: InsertPost): Promise<Post> {
    const result = await db
      .insert(posts)
      .values(post as any)
      .returning();
    return result[0];
  }

  async deletePost(id: string): Promise<boolean> {
    const post = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post[0]) return false;

    await db.delete(posts).where(eq(posts.id, id));
    return true;
  }

  async hidePostForUser(userId: string, postId: string): Promise<boolean> {
    try {
      await db.execute(sql`
        INSERT INTO user_hidden_posts (user_id, post_id, reason)
        VALUES (${userId}::uuid, ${postId}::uuid, 'not_interested')
        ON CONFLICT (user_id, post_id) DO NOTHING
      `);
      return true;
    } catch (err) {
      console.error("[Storage] hidePostForUser error:", err);
      return false;
    }
  }

  async getHiddenPostIds(userId: string): Promise<string[]> {
    try {
      const result = await db.execute<{ post_id: string }>(sql`
        SELECT post_id::text AS post_id
        FROM user_hidden_posts
        WHERE user_id = ${userId}::uuid
      `);
      const rows = result.rows ?? [];
      return rows.map((r) => r.post_id).filter(Boolean);
    } catch (err) {
      console.warn("[Storage] getHiddenPostIds skipped:", err);
      return [];
    }
  }

  async incrementPostViews(id: string): Promise<number> {
    const result = await db
      .update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.id, id))
      .returning();
    return result[0]?.viewCount || 0;
  }

  async markPostBurned(id: string, _reason: string): Promise<void> {
    await db
      .update(posts)
      .set({
        burnedAt: new Date(),
        isHidden: true,
        processingStatus: "failed", // Marker for burned content
      })
      .where(eq(posts.id, id));
  }

  async updatePost(
    postId: string,
    updates: Partial<Post>,
  ): Promise<Post | undefined> {
    return traceDatabase("UPDATE", "posts", async () => {
      const result = await db
        .update(posts)
        .set(updates)
        .where(eq(posts.id, postId))
        .returning();
      return result[0];
    });
  }

  // Comments
  async getPostComments(
    postId: string,
  ): Promise<(Comment & { user: User; isFired: boolean })[]> {
    const result = await db
      .select({
        comment: comments,
        user: users,
        reaction: commentReactions,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(commentReactions, eq(commentReactions.commentId, comments.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    return result
      .filter((r) => r.user)
      .map((r) => ({
        ...r.comment,
        user: r.user!,
        isFired: false, // comment_reactions might not exist or be different in this schema
      }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    return result[0];
  }

  async deleteComment(id: string): Promise<boolean> {
    const comment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);
    if (!comment[0]) return false;

    await db.delete(comments).where(eq(comments.id, id));
    return true;
  }

  // Reactions
  async togglePostReaction(
    postId: string,
    userId: string,
  ): Promise<{ added: boolean; newCount: number }> {
    const existing = await db
      .select()
      .from(postReactions)
      .where(
        and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)),
      )
      .limit(1);

    if (existing[0]) {
      // Remove reaction
      await db
        .delete(postReactions)
        .where(eq(postReactions.id, existing[0].id));

      const res = await db
        .update(posts)
        .set({ fireCount: sql`${posts.fireCount} - 1` })
        .where(eq(posts.id, postId))
        .returning();

      return { added: false, newCount: res[0]?.fireCount || 0 };
    } else {
      // Add reaction
      await db.insert(postReactions).values({ postId, userId });

      const res = await db
        .update(posts)
        .set({ fireCount: sql`${posts.fireCount} + 1` })
        .where(eq(posts.id, postId))
        .returning();

      // [MOMENTUM] Record fire in cache for velocity tracking
      try {
        import("./scoring/integration.js").then((mod) => {
          mod
            .getScoringEngine()
            .recordFire(postId)
            .catch(() => {});
        });
      } catch (e) {
        console.warn("⚠️ [Scoring] Could not record momentum fire:", e);
      }

      return { added: true, newCount: res[0]?.fireCount || 0 };
    }
  }

  async toggleCommentReaction(
    _commentId: string,
    _userId: string,
  ): Promise<{ added: boolean; newCount: number }> {
    // commentaires table does not have a reactions_count/fire_count column in the current schema
    return { added: false, newCount: 0 };
  }

  async hasUserFiredPost(postId: string, userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(postReactions)
      .where(
        and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)),
      )
      .limit(1);

    return result.length > 0;
  }

  // Follows
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;

    const existing = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId),
        ),
      )
      .limit(1);

    if (existing[0]) return false;

    await db.insert(follows).values({ followerId, followingId });
    return true;
  }

  async unfollowUser(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    const result = await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId),
        ),
      )
      .returning();

    if (result.length === 0) return false;

    return true;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId),
        ),
      )
      .limit(1);

    return result.length > 0;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .leftJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));

    return result.filter((r) => r.user).map((r) => r.user!);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .leftJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));

    return result.filter((r) => r.user).map((r) => r.user!);
  }

  // Stories
  async getActiveStories(
    userId?: string,
  ): Promise<(Story & { user: User; isViewed: boolean })[]> {
    const now = new Date();

    const result = await db
      .select({
        story: stories,
        user: users,
        view: storyViews,
      })
      .from(stories)
      .leftJoin(users, eq(stories.userId, users.id))
      .leftJoin(
        storyViews,
        and(
          eq(storyViews.storyId, stories.id),
          userId ? eq(storyViews.userId, userId) : sql`false`,
        ),
      )
      .where(sql`${stories.expiresAt} > ${now}`)
      .orderBy(desc(stories.createdAt));

    return result
      .filter((r) => r.user)
      .map((r) => ({
        ...r.story,
        user: r.user!,
        isViewed: !!r.view,
      }));
  }

  async createStory(story: InsertStory): Promise<Story> {
    const result = await db.insert(stories).values(story).returning();
    return result[0];
  }

  async markStoryViewed(storyId: string, userId: string): Promise<void> {
    const existing = await db
      .select()
      .from(storyViews)
      .where(
        and(eq(storyViews.storyId, storyId), eq(storyViews.userId, userId)),
      )
      .limit(1);

    if (!existing[0]) {
      await db.insert(storyViews).values({ storyId, userId });

      const storyResult = await db
        .update(stories)
        .set({ viewCount: sql`${stories.viewCount} + 1` })
        .where(eq(stories.id, storyId))
        .returning();

      const story = storyResult[0];
      if (story && story.userId !== userId) {
        // Create notification for story view
        await this.createNotification({
          userId: story.userId,
          fromUserId: userId,
          type: "story_view",
          message: "a vu votre story",
          storyId: storyId,
        });
      }
    }
  }

  // Notifications
  async getUserNotifications(
    userId: string,
    limit: number = 50,
  ): Promise<(Notification & { fromUser?: User })[]> {
    const result = await db
      .select({
        notification: notifications,
        fromUser: users,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.fromUserId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return result.map((r) => ({
      ...r.notification,
      fromUser: r.fromUser || undefined,
    }));
  }

  async createNotification(
    notification: InsertNotification,
  ): Promise<Notification> {
    const result = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return result[0];
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );
  }

  // Gifts
  async createGift(gift: InsertGift): Promise<Gift> {
    const result = await db.insert(gifts).values(gift).returning();

    return result[0];
  }

  async getPostGiftCount(postId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(gifts)
      .where(eq(gifts.postId, postId));
    return result[0]?.count || 0;
  }

  async getGiftsByPost(postId: string): Promise<(Gift & { sender: User })[]> {
    const result = await db
      .select({
        gift: gifts,
        sender: users,
      })
      .from(gifts)
      .innerJoin(users, eq(gifts.senderId, users.id))
      .where(eq(gifts.postId, postId))
      .orderBy(desc(gifts.createdAt));

    return result.map((r) => ({
      ...r.gift,
      sender: r.sender,
    }));
  }

  async getUserReceivedGifts(
    userId: string,
    limit: number = 50,
  ): Promise<(Gift & { sender: User; post: Post })[]> {
    const result = await db
      .select({
        gift: gifts,
        sender: users,
        post: posts,
      })
      .from(gifts)
      .innerJoin(users, eq(gifts.senderId, users.id))
      .innerJoin(posts, eq(gifts.postId, posts.id))
      .where(eq(gifts.recipientId, userId))
      .orderBy(desc(gifts.createdAt))
      .limit(limit);

    return result.map((r) => ({
      ...r.gift,
      sender: r.sender,
      post: r.post,
    }));
  }

  // Colony Tasks
  async createColonyTask(task: {
    command: string;
    origin: string;
    priority?: string;
    metadata?: any;
    workerId?: string;
  }): Promise<ColonyTask> {
    return traceDatabase("INSERT", "colony_tasks", async (span) => {
      const result = await db
        .insert(colonyTasks)
        .values({
          command: task.command,
          origin: task.origin,
          priority: task.priority || "normal",
          metadata: task.metadata || {},
          workerId: task.workerId,
          status: "pending",
        })
        .returning();
      return result[0];
    });
  }

  // Moderation Logs
  async createModerationLog(log: {
    userId: string;
    action: string;
    reason: string;
    details?: string;
    score?: number;
  }): Promise<void> {
    await traceDatabase("INSERT", "moderation_logs", async (span) => {
      await db.insert(moderationLogs).values({
        userId: log.userId,
        action: log.action,
        reason: log.reason,
        details: log.details,
        score: log.score,
      });
    });
  }

  async getModerationLogsByUser(userId: string): Promise<any[]> {
    return traceDatabase("SELECT", "moderation_logs", async (span) => {
      return await db
        .select()
        .from(moderationLogs)
        .where(eq(moderationLogs.userId, userId))
        .orderBy(desc(moderationLogs.createdAt));
    });
  }

  async cleanupExpiredEphemeralPosts(): Promise<number> {
    // Delete posts that are ephemeral and marked as burned
    const result = await db
      .delete(posts)
      .where(
        and(eq(posts.isEphemeral, true), sql`${posts.burnedAt} IS NOT NULL`),
      )
      .returning();
    return result.length;
  }

  // Parental Controls
  async getParentalControls(
    childId: string,
  ): Promise<ParentalControl | undefined> {
    return traceDatabase("SELECT", "parental_controls", async () => {
      const result = await db
        .select()
        .from(parentalControls)
        .where(eq(parentalControls.childUserId, childId))
        .limit(1);
      return result[0];
    });
  }

  async upsertParentalControls(
    controls: InsertParentalControl,
  ): Promise<ParentalControl> {
    return traceDatabase("UPSERT", "parental_controls", async () => {
      const existing = await this.getParentalControls(controls.childUserId);
      if (existing) {
        const result = await db
          .update(parentalControls)
          .set({
            ...controls,
            updatedAt: new Date(),
          })
          .where(eq(parentalControls.childUserId, controls.childUserId))
          .returning();
        return result[0];
      } else {
        const result = await db
          .insert(parentalControls)
          .values(controls)
          .returning();
        return result[0];
      }
    });
  }

  async linkChild(
    parentId: string,
    childUsername: string,
  ): Promise<User | undefined> {
    return traceDatabase("UPDATE", "users", async () => {
      const child = await this.getUserByUsername(childUsername);
      if (!child) return undefined;

      const result = await db
        .update(users)
        .set({ parentId })
        .where(eq(users.id, child.id))
        .returning();
      return result[0];
    });
  }

  async getChildren(parentId: string): Promise<User[]> {
    return traceDatabase("SELECT", "users", async () => {
      return db.select().from(users).where(eq(users.parentId, parentId));
    });
  }

  // Shadow Ledger & Credits
  async executeTransfer(
    senderId: string,
    receiverId: string,
    amount: number,
  ): Promise<boolean> {
    return traceDatabase("TRANSACTION", "execute_transfer", async () => {
      try {
        const { transferCashCredits } = await import("./supabase-arcade-db.js");
        const { supabaseAdmin } = await import("./supabase-auth.js");
        if (supabaseAdmin) {
          return await transferCashCredits(senderId, receiverId, amount);
        }

        return await db.transaction(async (tx) => {
          // 1. Check Sender Balance
          const sender = await tx
            .select()
            .from(users)
            .where(eq(users.id, senderId))
            .limit(1);

          if (!sender[0] || (sender[0].cashCredits || 0) < amount) {
            return false;
          }

          // 2. Decrement Sender
          await tx
            .update(users)
            .set({ cashCredits: sql`${users.cashCredits} - ${amount}` })
            .where(eq(users.id, senderId));

          // 3. Increment Receiver
          await tx
            .update(users)
            .set({ cashCredits: sql`${users.cashCredits} + ${amount}` })
            .where(eq(users.id, receiverId));

          // 4. Log Tap Event (Optional: Record in transactions table)
          // For now, atomic update is enough.
          return true;
        });
      } catch (error) {
        console.error("Execute transfer transaction failed:", error);
        return false;
      }
    });
  }

  async refundPiasses(
    userId: string,
    amount: number,
    _reason: string,
  ): Promise<void> {
    await traceDatabase("UPDATE", "refund_piasses", async () => {
      await db
        .update(users)
        .set({ cashCredits: sql`${users.cashCredits} + ${amount}` })
        .where(eq(users.id, userId));
    });
  }

  async awardKarma(
    userId: string,
    amount: number,
    _reason: string,
  ): Promise<void> {
    await traceDatabase("UPDATE", "award_karma", async () => {
      await db
        .update(users)
        .set({ karmaCredits: sql`${users.karmaCredits} + ${amount}` })
        .where(eq(users.id, userId));
    });
  }

  async creditPiasses(userId: string, amount: number): Promise<boolean> {
    return traceDatabase("UPDATE", "credit_piasses", async () => {
      const result = await db
        .update(users)
        .set({ cashCredits: sql`${users.cashCredits} + ${amount}` })
        .where(eq(users.id, userId))
        .returning();
      return !!result[0];
    });
  }

  async getUserTransactions(
    userId: string,
    limit: number = 50,
  ): Promise<(Transaction & { sender?: User; receiver?: User })[]> {
    return traceDatabase("SELECT", "transactions", async () => {
      // Create aliases for sender and receiver
      const sender = aliasedTable(users, "sender");
      const receiver = aliasedTable(users, "receiver");

      const results = await db
        .select({
          transaction: transactions,
          sender: sender,
          receiver: receiver,
        })
        .from(transactions)
        .leftJoin(sender, eq(transactions.senderId, sender.id))
        .leftJoin(receiver, eq(transactions.receiverId, receiver.id))
        .where(
          or(
            eq(transactions.senderId, userId),
            eq(transactions.receiverId, userId),
          ),
        )
        .orderBy(desc(transactions.createdAt))
        .limit(limit);

      return results.map((row) => ({
        ...row.transaction,
        sender: row.sender || undefined,
        receiver: row.receiver || undefined,
      }));
    });
  }

  async getModerationHistory(userId: string): Promise<{ violations: number }> {
    return traceDatabase("SELECT", "moderation_history", async () => {
      const logs = await db
        .select()
        .from(moderationLogs)
        .where(eq(moderationLogs.userId, userId));

      // Count major actions as violations
      const violations = logs.filter((l) =>
        ["ban", "warn", "shadowban", "block"].includes(l.action),
      ).length;
      return { violations };
    });
  }

  // Support Tickets Implementation
  async createSupportTicket(ticket: any): Promise<any> {
    return traceDatabase("INSERT", "support_tickets", async () => {
      // Note: This would need proper typing and schema definitions
      // For now, return a placeholder
      return {
        id: "temp-" + Date.now(),
        ...ticket,
        status: "open",
        created_at: new Date(),
      };
    });
  }

  async getUserSupportTickets(userId: string): Promise<any[]> {
    return traceDatabase("SELECT", "support_tickets", async () => {
      // Placeholder implementation
      return [];
    });
  }

  async getSupportTicket(ticketId: string): Promise<any> {
    return traceDatabase("SELECT", "support_tickets", async () => {
      // Placeholder implementation
      return null;
    });
  }

  async addTicketMessage(message: any): Promise<any> {
    return traceDatabase("INSERT", "ticket_messages", async () => {
      // Placeholder implementation
      return {
        id: "msg-" + Date.now(),
        ...message,
        created_at: new Date(),
      };
    });
  }

  async updateTicketStatus(
    ticketId: string,
    status: string,
    userId?: string,
  ): Promise<boolean> {
    return traceDatabase("UPDATE", "support_tickets", async () => {
      // Placeholder implementation
      return true;
    });
  }

  // AI Generation Cost Tracking
  async createAIGenerationCost(cost: {
    userId: string;
    postId: string;
    service: string;
    operation: string;
    baseCost: number;
    finalCost: number;
    volumeTier: number;
    discountPercent: number;
  }) {
    return traceDatabase("INSERT", "ai_generation_costs", async () => {
      const result = await db
        .insert(aiGenerationCosts)
        .values({
          userId: cost.userId,
          postId: cost.postId,
          service: cost.service,
          operation: cost.operation,
          baseCost: cost.baseCost,
          finalCost: cost.finalCost,
          volumeTier: cost.volumeTier,
          discountPercent: cost.discountPercent,
        })
        .returning();
      return result[0];
    });
  }

  async getAIGenerationCosts(filters?: { startDate?: Date; endDate?: Date }) {
    return traceDatabase("SELECT", "ai_generation_costs", async () => {
      let query: any = db.select().from(aiGenerationCosts);

      const conditions = [];
      if (filters?.startDate) {
        conditions.push(gte(aiGenerationCosts.createdAt, filters.startDate));
      }
      if (filters?.endDate) {
        conditions.push(lte(aiGenerationCosts.createdAt, filters.endDate));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query.orderBy(desc(aiGenerationCosts.createdAt));
    });
  }

  async getPostCount(filters?: {
    startDate?: Date;
    where?: Record<string, any>;
  }) {
    return traceDatabase("SELECT", "post_count", async () => {
      let query: any = db.select({ count: sql<number>`count(*)` }).from(posts);

      const conditions = [];
      if (filters?.startDate) {
        conditions.push(gte(posts.createdAt, filters.startDate));
      }
      if (filters?.where) {
        // Apply where filters
        Object.entries(filters.where).forEach(([key, value]) => {
          const column = (posts as any)[key];
          if (column) {
            conditions.push(eq(column, value));
          }
        });
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query;
      return Number(result[0]?.count || 0);
    });
  }

  // System user for auto-generated content
  private systemUserId: string | null = null;

  async getSystemUserId(): Promise<string | null> {
    if (this.systemUserId) return this.systemUserId;

    // Try to find existing system user
    const systemUser = await db
      .select()
      .from(users)
      .where(eq(users.username, "zyeute_ai"))
      .limit(1);

    if (systemUser[0]) {
      this.systemUserId = systemUser[0].id;
      return this.systemUserId;
    }

    return null;
  }

  async setSystemUserId(userId: string): Promise<void> {
    this.systemUserId = userId;
  }

  getRawDb() {
    return db;
  }
}

export const storage = new DatabaseStorage();
