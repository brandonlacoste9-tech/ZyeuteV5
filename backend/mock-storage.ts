import { type IStorage } from "./storage-types.js";
import {
  type User,
  type InsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type Follow,
  type Story,
  type InsertStory,
  type Notification,
  type InsertNotification,
  type Gift,
  type InsertGift,
  type ColonyTask,
  type ParentalControl,
  type InsertParentalControl,
} from "../shared/schema.js";
import { v4 as uuidv4 } from "uuid";

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private posts = new Map<string, Post>();
  private comments = new Map<string, Comment>();
  private stories = new Map<string, Story>();
  private notifications = new Map<string, Notification>();
  private follows = new Array<Follow>();
  private gifts = new Array<Gift>();

  constructor() {
    this.seed();
  }

  private seed() {
    console.log("🌱 Seeding MemStorage with Guest & Mock Content...");
    const guestUser: User = {
      id: "guest-id",
      username: "invite",
      email: "invite@zyeute.com",
      displayName: "Invité Spécial",
      role: "citoyen",
      hiveId: "quebec",
      avatarUrl: null,
      bio: "Bienvenue au Québec!",
      createdAt: new Date(),
      updatedAt: new Date(),
      piasseBalance: 100,
      totalKarma: 50,
      regionId: "montreal",
    } as any;
    this.users.set(guestUser.id, guestUser);

    const firstPost: Post = {
      id: uuidv4(),
      userId: guestUser.id,
      content:
        "Bienvenue sur Zyeuté! Le réseau social du Québec est enfin là. ⚜️ #Zyeute #Quebec",
      mediaUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
      thumbnailUrl: null,
      fireCount: 10,
      commentCount: 2,
      viewCount: 100,
      hiveId: "quebec",
      isEphemeral: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      expiresAt: null,
      location: null,
      maxViews: null,
      processingStatus: "completed",
      regionId: "montreal",
      visibility: "public",
      burnedAt: null,
      caption: "Vue de Montréal",
      embedding: null,
      isHidden: false,
      metadata: null,
      isVaulted: false,
      type: "photo",
    } as any;
    this.posts.set(firstPost.id, firstPost);
  }

  // --- Real Implementation ---
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }
  async getUserHive(userId: string): Promise<string> {
    return this.users.get(userId)?.hiveId || "quebec";
  }

  async createUser(user: InsertUser & { id: string }): Promise<User> {
    const newUser = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "citoyen",
      piasseBalance: 0,
      totalKarma: 0,
    } as User;
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(
    id: string,
    updates: Partial<User>,
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async getPost(id: string): Promise<(Post & { user: User }) | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    const user = this.users.get(post.userId);
    return user ? { ...post, user } : undefined;
  }

  async getPostsByUser(userId: string, limit = 50): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getFeedPosts(
    userId: string,
    page: number,
    limit: number,
    hiveId = "quebec",
  ): Promise<(Post & { user: User; isFired: boolean })[]> {
    return Array.from(this.posts.values())
      .filter((p) => p.hiveId === hiveId)
      .map((p) => ({ ...p, user: this.users.get(p.userId)!, isFired: false }))
      .slice(page * limit, (page + 1) * limit);
  }

  async getExplorePosts(
    page: number,
    limit: number,
    hiveId = "quebec",
  ): Promise<(Post & { user: User })[]> {
    return Array.from(this.posts.values())
      .filter((p) => p.hiveId === hiveId)
      .map((p) => ({ ...p, user: this.users.get(p.userId)! }))
      .slice(page * limit, (page + 1) * limit);
  }

  async getNearbyPosts(
    _lat: number,
    _lon: number,
    _radius?: number,
  ): Promise<(Post & { user: User })[]> {
    return [];
  }
  async getRegionalTrendingPosts(
    _regionId: string,
  ): Promise<(Post & { user: User })[]> {
    return [];
  }
  async getSmartRecommendations(
    _emb: number[],
  ): Promise<(Post & { user: User })[]> {
    return [];
  }

  async createPost(post: InsertPost): Promise<Post> {
    const newPost = {
      id: uuidv4(),
      ...post,
      createdAt: new Date(),
      fireCount: 0,
      commentCount: 0,
      viewCount: 0,
    } as Post;
    this.posts.set(newPost.id, newPost);
    return newPost;
  }

  async deletePost(id: string): Promise<boolean> {
    return this.posts.delete(id);
  }
  async incrementPostViews(id: string): Promise<number> {
    const p = this.posts.get(id);
    if (p && p.viewCount !== null) p.viewCount++;
    return p?.viewCount || 0;
  }
  async markPostBurned(id: string, _reason: string): Promise<void> {
    this.posts.delete(id);
  }

  async getPostComments(
    postId: string,
  ): Promise<(Comment & { user: User; isFired: boolean })[]> {
    return Array.from(this.comments.values())
      .filter((c) => c.postId === postId)
      .map((c) => ({ ...c, user: this.users.get(c.userId)!, isFired: false }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const c = { id: uuidv4(), ...comment, createdAt: new Date() } as Comment;
    this.comments.set(c.id, c);
    return c;
  }
  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }

  async togglePostReaction(
    postId: string,
    _userId: string,
  ): Promise<{ added: boolean; newCount: number }> {
    const p = this.posts.get(postId);
    if (p && p.fireCount !== null) p.fireCount++;
    return { added: true, newCount: p?.fireCount || 0 };
  }
  async toggleCommentReaction(
    _commentId: string,
    _userId: string,
  ): Promise<{ added: boolean; newCount: number }> {
    return { added: true, newCount: 0 };
  }
  async hasUserFiredPost(_postId: string, _userId: string): Promise<boolean> {
    return false;
  }

  async followUser(_f: string, _following: string): Promise<boolean> {
    return true;
  }
  async unfollowUser(_f: string, _following: string): Promise<boolean> {
    return true;
  }
  async isFollowing(_f: string, _following: string): Promise<boolean> {
    return false;
  }
  async getFollowers(_u: string): Promise<User[]> {
    return [];
  }
  async getFollowing(_u: string): Promise<User[]> {
    return [];
  }

  async getActiveStories(
    _u?: string,
  ): Promise<(Story & { user: User; isViewed: boolean })[]> {
    return [];
  }
  async createStory(story: InsertStory): Promise<Story> {
    const s = {
      id: uuidv4(),
      ...story,
      createdAt: new Date(),
      viewCount: 0,
    } as Story;
    this.stories.set(s.id, s);
    return s;
  }
  async markStoryViewed(_s: string, _u: string): Promise<void> {}

  async getUserNotifications(
    _userId: string,
  ): Promise<(Notification & { fromUser?: User })[]> {
    return [];
  }
  async createNotification(n: InsertNotification): Promise<Notification> {
    const notif = {
      id: uuidv4(),
      ...n,
      createdAt: new Date(),
      isRead: false,
    } as Notification;
    this.notifications.set(notif.id, notif);
    return notif;
  }
  async markNotificationRead(_id: string): Promise<void> {}
  async markAllNotificationsRead(_u: string): Promise<void> {}

  async createGift(g: InsertGift): Promise<Gift> {
    const gift = { id: uuidv4(), ...g, createdAt: new Date() } as Gift;
    this.gifts.push(gift);
    return gift;
  }
  async getPostGiftCount(_p: string): Promise<number> {
    return 0;
  }
  async getGiftsByPost(_p: string): Promise<(Gift & { sender: User })[]> {
    return [];
  }
  async getUserReceivedGifts(
    _u: string,
  ): Promise<(Gift & { sender: User; post: Post })[]> {
    return [];
  }

  async createColonyTask(t: any): Promise<ColonyTask> {
    return {
      id: uuidv4(),
      ...t,
      status: "pending",
      createdAt: new Date(),
    } as ColonyTask;
  }
  async createModerationLog(_l: any): Promise<void> {}
  async getModerationLogsByUser(_u: string): Promise<any[]> {
    return [];
  }
  async cleanupExpiredEphemeralPosts(): Promise<number> {
    return 0;
  }
  async getParentalControls(_c: string): Promise<ParentalControl | undefined> {
    return undefined;
  }
  async upsertParentalControls(
    c: InsertParentalControl,
  ): Promise<ParentalControl> {
    return {
      ...c,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ParentalControl;
  }
  async linkChild(_p: string, _c: string): Promise<User | undefined> {
    return undefined;
  }
  async getChildren(_p: string): Promise<User[]> {
    return [];
  }

  async executeTransfer(_s: string, _r: string, _a: number): Promise<boolean> {
    return true;
  }
  async refundPiasses(_u: string, _a: number, _r: string): Promise<void> {}
  async awardKarma(_u: string, _a: number, _r: string): Promise<void> {}
  async creditPiasses(_u: string, _a: number): Promise<boolean> {
    return true;
  }
  async getModerationHistory(_u: string): Promise<{ violations: number }> {
    return { violations: 0 };
  }
  async createSupportTicket(t: any): Promise<any> {
    return { id: uuidv4(), ...t };
  }
  async getUserSupportTickets(_u: string): Promise<any[]> {
    return [];
  }
  async getSupportTicket(_t: string): Promise<any> {
    return null;
  }
  async addTicketMessage(m: any): Promise<any> {
    return { id: uuidv4(), ...m };
  }
  async updateTicketStatus(_t: string, _s: string): Promise<boolean> {
    return true;
  }
}
