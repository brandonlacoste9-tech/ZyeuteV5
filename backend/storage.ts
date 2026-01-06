import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
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
  media,
  type Media,
  type InsertMedia,
  parentalControls,
  type ParentalControl,
  type InsertParentalControl,
} from "../shared/schema.js";
import { eq, and, desc, sql, inArray, isNull, or } from "drizzle-orm";
import { traceDatabase } from "./tracer.js";

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max connections per instance (Supavisor supports multiplexing)
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 60000,
});

export const db = drizzle(pool);

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
  incrementPostViews(id: string): Promise<number>;
  markPostBurned(id: string, reason: string): Promise<void>;
  updatePostByMuxAssetId(muxAssetId: string, updates: Partial<Post>): Promise<Post | undefined>;
  updatePostByMuxUploadId(muxUploadId: string, updates: Partial<Post>): Promise<Post | undefined>;

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

  // Media
  createMedia(media: InsertMedia): Promise<Media>;
  getMedia(id: string): Promise<Media | undefined>;
  getMediaFeed(
    cursor?: string,
    limit?: number,
  ): Promise<{ items: Media[]; nextCursor: string | null }>;

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

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    return traceDatabase("SELECT", "users", async (span) => {
      span.setAttributes({ "db.user_id": id });
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return result[0];
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return traceDatabase("SELECT", "users", async (span) => {
      span.setAttributes({ "db.username": username });
      const result = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      return result[0];
    });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
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
    const result = await db
      .update(users)
      .set({ ...updates, createdAt: undefined }) // Prevent updating createdAt
      .where(eq(users.id, id))
      .returning();
    return result[0];
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
    return await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.userId, userId),
          or(eq(posts.isHidden, false), isNull(posts.isHidden)),
        ),
      )
      .orderBy(desc(posts.createdAt))
      .limit(limit);
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

    return result
      .filter((r) => r.user)
      .map((r) => ({
        ...r.post,
        user: r.user!,
        isFired: !!r.reaction,
      }));
  }

  async getExplorePosts(
    page: number,
    limit: number,
    hiveId: string = "quebec",
  ): Promise<(Post & { user: User })[]> {
    const offset = page * limit;

    const result = await db
      .select({
        post: posts,
        user: users,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(
        and(
          or(eq(posts.isHidden, false), isNull(posts.isHidden)),
          eq(posts.visibility, "public"),
          eq(posts.hiveId, hiveId as any),
        ),
      )
      .orderBy(desc(posts.fireCount), desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result
      .filter((r) => r.user)
      .map((r) => ({
        ...r.post,
        user: r.user!,
      }));
  }

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
          sql`ST_DWithin(${posts.location}, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography, ${radiusMeters})`,
        )
        .orderBy(desc(posts.createdAt));

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
    embedding: number[],
    limit: number = 20,
    hiveId: string = "quebec",
  ): Promise<(Post & { user: User })[]> {
    return traceDatabase("SELECT", "smart_recommendations", async (span) => {
      span.setAttributes({ "db.limit": limit });

      const result = await db
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
            sql`embedding IS NOT NULL`,
            eq(posts.hiveId, hiveId as any),
          ),
        )
        .orderBy(
          desc(sql`1 - (embedding <=> ${JSON.stringify(embedding)}::vector)`),
        )
        .limit(limit);

      return result.map((r) => ({
        ...r.post,
        user: r.user,
      }));
    });
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

  async updatePostByMuxAssetId(
    muxAssetId: string,
    updates: Partial<Post>,
  ): Promise<Post | undefined> {
    const result = await db
      .update(posts)
      .set(updates)
      .where(eq(posts.muxAssetId, muxAssetId))
      .returning();
    return result[0];
  }

  async updatePostByMuxUploadId(
    muxUploadId: string,
    updates: Partial<Post>,
  ): Promise<Post | undefined> {
    const result = await db
      .update(posts)
      .set(updates)
      .where(eq(posts.muxUploadId, muxUploadId))
      .returning();
    return result[0];
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

      const post = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);
      return { added: false, newCount: post[0]?.fireCount || 0 };
    } else {
      // Add reaction
      await db.insert(postReactions).values({ postId, userId });

      const post = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);
      return { added: true, newCount: post[0]?.fireCount || 0 };
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

  // Media
  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    return traceDatabase("INSERT", "media", async (span) => {
      const result = await db.insert(media).values(insertMedia).returning();
      return result[0];
    });
  }

  async getMedia(id: string): Promise<Media | undefined> {
    return traceDatabase("SELECT", "media", async (span) => {
      span.setAttributes({ "db.media_id": id });
      const result = await db
        .select()
        .from(media)
        .where(eq(media.id, id))
        .limit(1);
      return result[0];
    });
  }

  async getMediaFeed(
    cursor?: string,
    limit: number = 20,
  ): Promise<{ items: Media[]; nextCursor: string | null }> {
    return traceDatabase("SELECT", "media_feed", async (span) => {
      // If cursor (createdAt) is provided, filter by it
      // Ensure cursor is a valid ISO string or handle accordingly.
      // Assuming cursor is the 'createdAt' timestamp of the last item.
      const whereClause = cursor ? sql`${media.createdAt} < ${cursor}` : undefined;

      const result = await db
        .select()
        .from(media)
        .where(whereClause)
        .orderBy(desc(media.createdAt))
        .limit(limit + 1); // Fetch one extra to determine next cursor

      let nextCursor: string | null = null;
      if (result.length > limit) {
        const nextItem = result.pop(); // Remove the extra item
        if (nextItem) {
          nextCursor = nextItem.createdAt.toISOString();
        }
      }

      return {
        items: result,
        nextCursor,
      };
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
      return db
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
}

export const storage = new DatabaseStorage();
