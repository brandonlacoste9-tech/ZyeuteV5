import {
  type User,
  type InsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
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

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserHive(userId: string): Promise<string>;
  createUser(user: InsertUser & { id: string }): Promise<User>;
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
