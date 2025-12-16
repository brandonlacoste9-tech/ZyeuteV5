import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  pgEnum,
  jsonb,
  uuid,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const visibilityEnum = pgEnum('visibility', ['public', 'followers', 'private']);
export const regionEnum = pgEnum('region', [
  'montreal', 'quebec', 'gatineau', 'sherbrooke', 'trois-rivieres',
  'saguenay', 'levis', 'terrebonne', 'laval', 'gaspesie', 'other'
]);
export const giftTypeEnum = pgEnum('gift_type', [
  'comete', 'feuille_erable', 'fleur_de_lys', 'feu', 'coeur_or'
]);

// Users Table - mapped to user_profiles (FK to auth.users.id)
export const users = pgTable("user_profiles", {
  id: uuid("id").primaryKey(), // FK to auth.users.id
  replitId: varchar("replit_id", { length: 50 }).unique(), // Replit OAuth sub claim
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).unique(), // Made optional for OAuth users
  displayName: varchar("display_name", { length: 100 }),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  location: varchar("location", { length: 100 }),
  region: regionEnum("region"),
  password: varchar("password", { length: 255 }), // Optional for OAuth-only users
  isAdmin: boolean("is_admin").default(false),
  subscriptionTier: varchar("subscription_tier", { length: 20 }).default('free'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts Table with performance indexes
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 20 }).notNull(), // 'photo', 'video'
  mediaUrl: text("media_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption: text("caption"),
  hashtags: text("hashtags").array(),
  region: regionEnum("region"),
  visibility: visibilityEnum("visibility").default('public'),
  fireCount: integer("fire_count").default(0),
  commentCount: integer("comment_count").default(0),
  viewCount: integer("view_count").default(0),
  giftCount: integer("gift_count").default(0),
  isHidden: boolean("is_hidden").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("posts_user_id_idx").on(table.userId),
  createdAtIdx: index("posts_created_at_idx").on(table.createdAt),
  userCreatedIdx: index("posts_user_created_idx").on(table.userId, table.createdAt),
}));

// Comments Table
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  fireCount: integer("fire_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Post Reactions (Fire)
export const postReactions = pgTable("post_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Comment Reactions (Fire)
export const commentReactions = pgTable("comment_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  commentId: uuid("comment_id").notNull().references(() => comments.id, { onDelete: 'cascade' }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Follows Table with performance indexes
export const follows = pgTable("follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: uuid("follower_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: uuid("following_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  followerIdx: index("follows_follower_id_idx").on(table.followerId),
  followingIdx: index("follows_following_id_idx").on(table.followingId),
  uniqueFollow: index("follows_unique_idx").on(table.followerId, table.followingId),
}));

// Stories Table
export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  mediaUrl: text("media_url").notNull(),
  mediaType: varchar("media_type", { length: 20 }).notNull(), // 'photo', 'video'
  caption: text("caption"),
  viewCount: integer("view_count").default(0),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Story Views Table
export const storyViews = pgTable("story_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: 'cascade' }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

// Gifts Table
export const gifts = pgTable("gifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientId: uuid("recipient_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  giftType: giftTypeEnum("gift_type").notNull(),
  amount: integer("amount").notNull(), // in cents
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  senderIdx: index("gifts_sender_id_idx").on(table.senderId),
  recipientIdx: index("gifts_recipient_id_idx").on(table.recipientId),
  postIdx: index("gifts_post_id_idx").on(table.postId),
}));

// Notifications Table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 50 }).notNull(), // 'fire', 'comment', 'follow', 'mention', 'gift'
  giftId: uuid("gift_id").references(() => gifts.id, { onDelete: 'cascade' }),
  fromUserId: uuid("from_user_id").references(() => users.id, { onDelete: 'cascade' }),
  postId: uuid("post_id").references(() => posts.id, { onDelete: 'cascade' }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: 'cascade' }),
  message: text("message"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  followers: many(follows, { relationName: 'following' }),
  following: many(follows, { relationName: 'follower' }),
  stories: many(stories),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
  reactions: many(postReactions),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  reactions: many(commentReactions),
}));

// Zod Schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email().optional(),
  username: z.string().min(3).max(50),
  password: z.string().min(6).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Schema for upserting users via Replit Auth (OAuth)
export const upsertUserSchema = z.object({
  replitId: z.string(),
  email: z.string().email().nullable().optional(),
  username: z.string().min(1).max(50),
  displayName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});

export const insertPostSchema = createInsertSchema(posts, {
  caption: z.string().max(2200).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, fireCount: true, commentCount: true, viewCount: true, giftCount: true });

export const insertCommentSchema = createInsertSchema(comments, {
  content: z.string().min(1).max(500),
}).omit({ id: true, createdAt: true, fireCount: true });

export const insertFollowSchema = createInsertSchema(follows).omit({ id: true, createdAt: true });

export const insertStorySchema = createInsertSchema(stories).omit({ id: true, createdAt: true, viewCount: true });

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

export const insertGiftSchema = createInsertSchema(gifts).omit({ id: true, createdAt: true });

// Gift catalog with prices in cents
export const GIFT_CATALOG = {
  comete: { emoji: '☄️', name: 'Comète', price: 50 },
  feuille_erable: { emoji: '🍁', name: "Feuille d'érable", price: 50 },
  fleur_de_lys: { emoji: '⚜️', name: 'Fleur de Lys', price: 75 },
  feu: { emoji: '🔥', name: 'Feu', price: 100 },
  coeur_or: { emoji: '💛', name: "Coeur d'or", price: 100 },
} as const;

export type GiftType = keyof typeof GIFT_CATALOG;

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;

export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type PostReaction = typeof postReactions.$inferSelect;
export type CommentReaction = typeof commentReactions.$inferSelect;
export type StoryView = typeof storyViews.$inferSelect;

export type Gift = typeof gifts.$inferSelect;
export type InsertGift = z.infer<typeof insertGiftSchema>;

// Replit Auth upsert type
export type UpsertUser = z.infer<typeof upsertUserSchema>;
