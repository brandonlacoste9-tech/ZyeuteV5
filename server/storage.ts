import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  users, posts, comments, follows, postReactions, commentReactions,
  stories, storyViews, notifications, gifts,
  type User, type InsertUser, type Post, type InsertPost,
  type Comment, type InsertComment, type Follow, type InsertFollow,
  type Story, type InsertStory, type Notification, type InsertNotification,
  type Gift, type InsertGift, type GiftType, type UpsertUser,
  colonyTasks, type ColonyTask
} from "../shared/schema.js";
import { eq, and, desc, sql, inArray, isNull, or } from "drizzle-orm";
import { traceDatabase } from "./tracer.js";

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  // getUserByReplitId removed - legacy
  createUser(user: InsertUser & { id: string }): Promise<User>;
  // createUserFromOAuth removed - legacy
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Posts
  getPost(id: string): Promise<(Post & { user: User }) | undefined>;
  getPostsByUser(userId: string, limit?: number): Promise<Post[]>;
  getFeedPosts(userId: string, page: number, limit: number): Promise<(Post & { user: User; isFired: boolean })[]>;
  getExplorePosts(page: number, limit: number): Promise<(Post & { user: User })[]>;
  createPost(post: InsertPost): Promise<Post>;
  deletePost(id: string): Promise<boolean>;
  // incrementPostViews removed - not in schema

  // Comments
  getPostComments(postId: string): Promise<(Comment & { user: User; isFired: boolean })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<boolean>;

  // Reactions
  togglePostReaction(postId: string, userId: string): Promise<{ added: boolean; newCount: number }>;
  toggleCommentReaction(commentId: string, userId: string): Promise<{ added: boolean; newCount: number }>;
  hasUserFiredPost(postId: string, userId: string): Promise<boolean>;

  // Follows
  followUser(followerId: string, followingId: string): Promise<boolean>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;

  // Stories
  getActiveStories(userId?: string): Promise<(Story & { user: User; isViewed: boolean })[]>;
  createStory(story: InsertStory): Promise<Story>;
  markStoryViewed(storyId: string, userId: string): Promise<void>;

  // Notifications
  getUserNotifications(userId: string, limit?: number): Promise<(Notification & { fromUser?: User })[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Gifts
  createGift(gift: InsertGift): Promise<Gift>;
  getPostGiftCount(postId: string): Promise<number>;
  getGiftsByPost(postId: string): Promise<(Gift & { sender: User })[]>;
  getUserReceivedGifts(userId: string, limit?: number): Promise<(Gift & { sender: User; post: Post })[]>;

  // Colony Tasks (AI Hive)
  createColonyTask(task: { command: string; origin: string; priority?: string; metadata?: any; workerId?: string }): Promise<ColonyTask>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    return traceDatabase("SELECT", "users", async (span) => {
      span.setAttributes({ "db.user_id": id });
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return traceDatabase("SELECT", "users", async (span) => {
      span.setAttributes({ "db.username": username });
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    });
  }


  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser & { id: string }): Promise<User> {
    return traceDatabase("INSERT", "users", async (span) => {
      span.setAttributes({ "db.username": insertUser.username });
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ ...updates, createdAt: undefined }) // Prevent updating createdAt
      .where(eq(users.id, id))
      .returning();
    return result[0];
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

    return {
      ...result[0].publications,
      user: result[0].user_profiles,
    };
  }

  async getPostsByUser(userId: string, limit: number = 50): Promise<Post[]> {
    return await db.select()
      .from(posts)
      .where(and(
        eq(posts.userId, userId),
        or(eq(posts.isHidden, false), isNull(posts.isHidden))
      ))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  async getFeedPosts(userId: string, page: number, limit: number): Promise<(Post & { user: User; isFired: boolean })[]> {
    const offset = page * limit;

    // Get users that the current user follows
    const followingUsers = await db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followingIds = followingUsers.map(f => f.id);

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
          eq(postReactions.userId, userId)
        )
      )
      .where(and(
        inArray(posts.userId, followingIds.length > 0 ? followingIds : [userId]),
        or(eq(posts.isHidden, false), isNull(posts.isHidden)),
        eq(posts.visibility, 'public')
      ))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result
      .filter(r => r.user)
      .map(r => ({
        ...r.post,
        user: r.user!,
        isFired: !!r.reaction,
      }));
  }

  async getExplorePosts(page: number, limit: number): Promise<(Post & { user: User })[]> {
    const offset = page * limit;

    const result = await db
      .select({
        post: posts,
        user: users,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(and(
        or(eq(posts.isHidden, false), isNull(posts.isHidden)),
        eq(posts.visibility, 'public')
      ))
      .orderBy(desc(posts.fireCount), desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result
      .filter(r => r.user)
      .map(r => ({
        ...r.post,
        user: r.user!,
      }));
  }

  async createPost(post: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values(post as any).returning();
    return result[0];
  }

  async deletePost(id: string): Promise<boolean> {
    const post = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post[0]) return false;

    await db.delete(posts).where(eq(posts.id, id));
    return true;
  }

  async incrementPostViews(id: string): Promise<void> {
    // No-op: viewCount not in schema
  }

  // Comments
  async getPostComments(postId: string): Promise<(Comment & { user: User; isFired: boolean })[]> {
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
      .filter(r => r.user)
      .map(r => ({
        ...r.comment,
        user: r.user!,
        isFired: !!r.reaction,
      }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();

    // Increment post's comment count
    await db.update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, comment.postId));

    return result[0];
  }

  async deleteComment(id: string): Promise<boolean> {
    const comment = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    if (!comment[0]) return false;

    await db.delete(comments).where(eq(comments.id, id));

    // Decrement post's comment count
    await db.update(posts)
      .set({ commentCount: sql`${posts.commentCount} - 1` })
      .where(eq(posts.id, comment[0].postId));

    return true;
  }

  // Reactions
  async togglePostReaction(postId: string, userId: string): Promise<{ added: boolean; newCount: number }> {
    const existing = await db
      .select()
      .from(postReactions)
      .where(and(
        eq(postReactions.postId, postId),
        eq(postReactions.userId, userId)
      ))
      .limit(1);

    if (existing[0]) {
      // Remove reaction
      await db.delete(postReactions).where(eq(postReactions.id, existing[0].id));
      await db.update(posts)
        .set({ fireCount: sql`${posts.fireCount} - 1` })
        .where(eq(posts.id, postId));

      const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
      return { added: false, newCount: post[0]?.fireCount || 0 };
    } else {
      // Add reaction
      await db.insert(postReactions).values({ postId, userId });
      await db.update(posts)
        .set({ fireCount: sql`${posts.fireCount} + 1` })
        .where(eq(posts.id, postId));

      const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
      return { added: true, newCount: post[0]?.fireCount || 0 };
    }
  }

  async toggleCommentReaction(commentId: string, userId: string): Promise<{ added: boolean; newCount: number }> {
    const existing = await db
      .select()
      .from(commentReactions)
      .where(and(
        eq(commentReactions.commentId, commentId),
        eq(commentReactions.userId, userId)
      ))
      .limit(1);

    if (existing[0]) {
      await db.delete(commentReactions).where(eq(commentReactions.id, existing[0].id));
      await db.update(comments)
        .set({ fireCount: sql`${comments.fireCount} - 1` })
        .where(eq(comments.id, commentId));

      const comment = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
      return { added: false, newCount: comment[0]?.fireCount || 0 };
    } else {
      await db.insert(commentReactions).values({ commentId, userId });
      await db.update(comments)
        .set({ fireCount: sql`${comments.fireCount} + 1` })
        .where(eq(comments.id, commentId));

      const comment = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
      return { added: true, newCount: comment[0]?.fireCount || 0 };
    }
  }

  async hasUserFiredPost(postId: string, userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(postReactions)
      .where(and(
        eq(postReactions.postId, postId),
        eq(postReactions.userId, userId)
      ))
      .limit(1);

    return result.length > 0;
  }

  // Follows
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;

    const existing = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ))
      .limit(1);

    if (existing[0]) return false;

    await db.insert(follows).values({ followerId, followingId });
    return true;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ))
      .returning();

    if (result.length === 0) return false;

    return true;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ))
      .limit(1);

    return result.length > 0;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .leftJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));

    return result.filter(r => r.user).map(r => r.user!);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .leftJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));

    return result.filter(r => r.user).map(r => r.user!);
  }

  // Stories
  async getActiveStories(userId?: string): Promise<(Story & { user: User; isViewed: boolean })[]> {
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
          userId ? eq(storyViews.userId, userId) : sql`false`
        )
      )
      .where(sql`${stories.expiresAt} > ${now}`)
      .orderBy(desc(stories.createdAt));

    return result
      .filter(r => r.user)
      .map(r => ({
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
      .where(and(
        eq(storyViews.storyId, storyId),
        eq(storyViews.userId, userId)
      ))
      .limit(1);

    if (!existing[0]) {
      await db.insert(storyViews).values({ storyId, userId });
      await db.update(stories)
        .set({ viewCount: sql`${stories.viewCount} + 1` })
        .where(eq(stories.id, storyId));
    }
  }

  // Notifications
  async getUserNotifications(userId: string, limit: number = 50): Promise<(Notification & { fromUser?: User })[]> {
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

    return result.map(r => ({
      ...r.notification,
      fromUser: r.fromUser || undefined,
    }));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
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

    return result.map(r => ({
      ...r.gift,
      sender: r.sender,
    }));
  }

  async getUserReceivedGifts(userId: string, limit: number = 50): Promise<(Gift & { sender: User; post: Post })[]> {
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

    return result.map(r => ({
      ...r.gift,
      sender: r.sender,
      post: r.post,
    }));
  }

  // Colony Tasks
  async createColonyTask(task: { command: string; origin: string; priority?: string; metadata?: any; workerId?: string }): Promise<ColonyTask> {
    const result = await db.insert(colonyTasks).values({
      command: task.command,
      origin: task.origin,
      status: 'pending',
      priority: task.priority === 'high' ? 'high' : 'normal',
      metadata: task.metadata,
      workerId: task.workerId
    }).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
