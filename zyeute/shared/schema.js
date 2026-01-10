import { pgTable, text, varchar, timestamp, integer, boolean, pgEnum, jsonb, uuid, index, unique, customType, decimal, serial, } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
// TODO: Replace with proper PostGIS geography type once Neon is set up with PostGIS extension
// Custom Geography type for PostGIS (Mocked -> text)
export const geography = customType({
    dataType() {
        return "text";
    },
});
// TODO: Replace with proper PostGIS geometry type once Neon is set up with PostGIS extension
// Custom Geometry type (for Polygons) (Mocked -> text)
export const geometry = customType({
    dataType() {
        return "text";
    },
});
// TODO: Replace with proper pgvector type once Neon is set up with pgvector extension
// Custom Vector type (for pgvector) (Mocked -> text)
export const vector = customType({
    dataType(config) {
        return "text";
    },
});
// Enums
export const visibilityEnum = pgEnum("visibility", ["public", "amis", "prive"]);
export const regionEnum = pgEnum("region", [
    "montreal",
    "quebec",
    "gatineau",
    "sherbrooke",
    "trois-rivieres",
    "saguenay",
    "levis",
    "terrebonne",
    "laval",
    "gaspesie",
    "other",
]);
export const giftTypeEnum = pgEnum("gift_type", [
    "comete",
    "feuille_erable",
    "fleur_de_lys",
    "feu",
    "coeur_or",
]);
export const roleEnum = pgEnum("user_role", [
    "visitor",
    "citoyen",
    "moderator",
    "founder",
    "banned",
]);
export const hiveEnum = pgEnum("hive_id", [
    "quebec", // fr-CA
    "brazil", // pt-BR
    "argentina", // es-AR
    "mexico", // es-MX
]);
// --- HIVE ECONOMY ENUMS ---
export const creditTypeEnum = pgEnum("credit_type", [
    "karma",
    "cash",
    "legendary",
]);
export const transactionStatusEnum = pgEnum("transaction_status", [
    "pending",
    "completed",
    "failed",
    "reversed",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
    "gift",
    "purchase",
    "payout",
    "bond",
    "reward",
    "tournament_entry",
    "tournament_win",
]);
export const tournamentStatusEnum = pgEnum("tournament_status", [
    "active",
    "calculating",
    "completed",
    "cancelled",
]);
export const processingStatusEnum = pgEnum("processing_status", [
    "pending",
    "processing",
    "completed",
    "failed",
]);
// Users Table - mapped to user_profiles (FK to auth.users.id)
export const users = pgTable("user_profiles", {
    id: uuid("id").primaryKey(), // FK to auth.users.id
    username: varchar("username", { length: 50 }).notNull().unique(),
    email: varchar("email", { length: 255 }).unique(), // Made optional for OAuth users
    displayName: varchar("display_name", { length: 100 }),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    region: text("region"),
    role: roleEnum("role").default("citoyen"), // RBAC Role
    customPermissions: jsonb("custom_permissions").default({}), // Granular overrides
    isAdmin: boolean("is_admin").default(false),
    isPremium: boolean("is_premium").default(false),
    plan: text("plan").default("free"),
    credits: integer("credits").default(0),
    subscriptionTier: varchar("subscription_tier", { length: 20 }).default("free"),
    location: geography("location"),
    regionId: text("region_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
    tiGuyCommentsEnabled: boolean("ti_guy_comments_enabled").default(true),
    hiveId: hiveEnum("hive_id").default("quebec"),
    // Hive Economy (Le Protocole d'Économie Sociale) 🚀
    karmaCredits: integer("karma_credits").default(0), // Points de Karma (non-monétaire)
    cashCredits: integer("cash_credits").default(0), // Piasses/Huards (cents)
    totalGiftsSent: integer("total_gifts_sent").default(0),
    totalGiftsReceived: integer("total_gifts_received").default(0),
    legendaryBadges: jsonb("legendary_badges").default([]), // NFT pointers / Quebec Heritage
    taxId: varchar("tax_id", { length: 50 }), // Pour la conformité fiscale (Loi 25)
    beeAlias: varchar("bee_alias", { length: 50 }), // Anonymous alias (e.g., Ti-Guy77)
    // Gamification Fields
    nectarPoints: integer("nectar_points").default(0),
    currentStreak: integer("current_streak").default(0),
    maxStreak: integer("max_streak").default(0),
    lastDailyBonus: timestamp("last_daily_bonus"),
    unlockedHives: jsonb("unlocked_hives").default(["quebec"]),
    parentId: uuid("parent_id").references(() => users.id, {
        onDelete: "set null",
    }), // For Parental Controls
    // Legacy columns to prevent data loss
    replitId: text("replit_id"),
    password: text("password"),
    isVerified: boolean("is_verified").default(false),
    postsCount: integer("posts_count").default(0),
    followersCount: integer("followers_count").default(0),
    followingCount: integer("following_count").default(0),
});
// Posts Table mapped to publications
export const posts = pgTable("publications", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    mediaUrl: text("media_url"), // Optional in some cases?
    originalUrl: text("original_url"), // Backup of original upload
    enhancedUrl: text("enhanced_url"), // URL of upscaled/enhanced version
    processingStatus: processingStatusEnum("processing_status").default("pending"),
    jobId: text("job_id"), // BullMQ job ID for video processing
    mediaMetadata: jsonb("media_metadata").default({}), // Key moments, AI tags, etc.
    visualFilter: text("visual_filter").default("none"),
    enhanceStartedAt: timestamp("enhance_started_at"),
    enhanceFinishedAt: timestamp("enhance_finished_at"),
    content: text("content").notNull(), // Confirmed required by DB insert error
    caption: text("caption"),
    thumbnailUrl: text("thumbnail_url"),
    type: text("type").default("video"), // 'video' | 'image'
    visibility: varchar("visibility", { length: 20 }).default("public"),
    fireCount: integer("reactions_count").default(0),
    commentCount: integer("comments_count").default(0),
    isHidden: boolean("est_masque").default(false),
    location: geography("location"),
    regionId: text("region_id"),
    embedding: vector("embedding", { dimensions: 768 }),
    lastEmbeddedAt: timestamp("last_embedded_at"),
    transcription: text("transcription"),
    transcribedAt: timestamp("transcribed_at"),
    aiDescription: text("ai_description"), // Ti-Guy's summary
    aiLabels: jsonb("ai_labels").default([]), // AI generated tags
    viralScore: integer("viral_score").default(0), // Le Buzz Predictor
    safetyFlags: jsonb("safety_flags").default({}), // Safety Patrol details
    isModerated: boolean("is_moderated").default(false),
    moderationApproved: boolean("moderation_approved").default(true),
    moderationScore: integer("moderation_score").default(0),
    moderatedAt: timestamp("moderated_at"),
    hiveId: hiveEnum("hive_id").default("quebec"), // Content is siloed by hive
    // Ephemeral Logic (The "Burn" Protocol)
    isEphemeral: boolean("is_ephemeral").default(false),
    viewCount: integer("view_count").default(0),
    maxViews: integer("max_views").default(1),
    expiresAt: timestamp("expires_at"),
    burnedAt: timestamp("burned_at"), // The "Scar" - remains after content deletion
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index("publications_user_id_idx").on(table.userId),
    createdAtIdx: index("publications_created_at_idx").on(table.createdAt),
    userCreatedIdx: index("publications_user_created_idx").on(table.userId, table.createdAt),
    locationIndex: index("idx_publications_location").using("gist", table.location),
    regionIndex: index("idx_publications_region_created_at").on(table.regionId, table.createdAt),
}));
// Regions Table
export const regions = pgTable("regions", {
    id: text("id").primaryKey(),
    nom: text("nom").notNull(),
    geom: geometry("geom").notNull(),
}, (table) => ({
    geomIndex: index("idx_regions_geom").using("gist", table.geom),
}));
// Push Notification Devices (Phase 10)
export const pushDevices = pgTable("poussoirs_appareils", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    deviceToken: text("device_token").notNull(),
    platform: text("platform").notNull(), // 'ios' or 'android'
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at").defaultNow(),
}, (table) => ({
    userIdIdx: index("idx_push_devices_user_id").on(table.userId),
    tokenIdx: index("idx_push_devices_token").on(table.deviceToken),
}));
// User Interactions (Phase 12 - Analytics)
export const userInteractions = pgTable("user_interactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    publicationId: uuid("publication_id").references(() => posts.id, {
        onDelete: "cascade",
    }),
    interactionType: text("interaction_type").notNull(), // 'view', 'skip', 'fire', 'comment', 'share'
    duration: integer("duration"), // milliseconds (for views)
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index("idx_interactions_user_id").on(table.userId),
    publicationIdIdx: index("idx_interactions_publication_id").on(table.publicationId),
    typeIdx: index("idx_interactions_type").on(table.interactionType),
    createdAtIdx: index("idx_interactions_created_at").on(table.createdAt),
}));
// Comments Table - mapped to commentaires
export const comments = pgTable("commentaires", {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("publication_id")
        .notNull()
        .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    postIdIdx: index("commentaires_publication_id_idx").on(table.postId),
    userIdIdx: index("commentaires_user_id_idx").on(table.userId),
}));
// Post Reactions (Fire) - mapped to reactions
export const postReactions = pgTable("reactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("publication_id")
        .notNull()
        .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").default("fire"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    postIdIdx: index("reactions_publication_id_idx").on(table.postId),
    userIdIdx: index("reactions_user_id_idx").on(table.userId),
}));
// Comment Reactions (Fire)
export const commentReactions = pgTable("comment_reactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    commentId: uuid("comment_id")
        .notNull()
        .references(() => comments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    commentIdIdx: index("comment_reactions_comment_id_idx").on(table.commentId),
    userIdIdx: index("comment_reactions_user_id_idx").on(table.userId),
}));
// Post Not Interested
export const postNotInterested = pgTable("post_not_interested", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
        .notNull()
        .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    uniqueUserPost: unique().on(table.userId, table.postId),
    userIdIdx: index("idx_post_not_interested_user_id").on(table.userId),
    postIdIdx: index("idx_post_not_interested_post_id").on(table.postId),
}));
// Windows Automation Bees - Colony OS automation bee registry
export const windowsAutomationBees = pgTable("windows_automation_bees", {
    id: text("id").primaryKey(),
    hiveId: text("hive_id").notNull().default("quebec"),
    name: text("name").notNull(),
    status: text("status").notNull().default("idle"), // 'idle' | 'running' | 'error'
    pythonServiceUrl: text("python_service_url").notNull(),
    llmProvider: text("llm_provider").notNull(), // 'gemini' | 'claude' | 'ollama' | 'openai' | 'anthropic'
    browser: text("browser").notNull().default("edge"), // 'edge' | 'chrome' | 'firefox'
    lastHeartbeat: timestamp("last_heartbeat").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    hiveIdIdx: index("idx_windows_automation_bees_hive_id").on(table.hiveId),
    statusIdx: index("idx_windows_automation_bees_status").on(table.status),
    lastHeartbeatIdx: index("idx_windows_automation_bees_last_heartbeat").on(table.lastHeartbeat),
}));
// Automation Tasks - Task queue and execution history
export const automationTasks = pgTable("automation_tasks", {
    id: text("id").primaryKey(),
    beeId: text("bee_id")
        .notNull()
        .references(() => windowsAutomationBees.id, { onDelete: "cascade" }),
    taskType: text("task_type").notNull(), // 'test' | 'debug' | 'automation' | 'monitoring'
    description: text("description").notNull(),
    status: text("status").notNull().default("queued"), // 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
    result: jsonb("result"),
    performanceMetrics: jsonb("performance_metrics"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
}, (table) => ({
    beeIdIdx: index("idx_automation_tasks_bee_id").on(table.beeId),
    statusIdx: index("idx_automation_tasks_status").on(table.status),
    taskTypeIdx: index("idx_automation_tasks_task_type").on(table.taskType),
    createdAtIdx: index("idx_automation_tasks_created_at").on(table.createdAt),
    beeStatusIdx: index("idx_automation_tasks_bee_status").on(table.beeId, table.status),
}));
// Follows Table - mapped to abonnements
export const follows = pgTable("abonnements", {
    // abonnements seems to be a composite key table in some schemas, but Drizzle prefers PK
    followerId: uuid("follower_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("followee_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    followerIdx: index("abonnements_follower_id_idx").on(table.followerId),
    followingIdx: index("abonnements_followee_id_idx").on(table.followingId),
}));
// Stories Table
export const stories = pgTable("stories", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    mediaUrl: text("media_url").notNull(),
    mediaType: varchar("media_type", { length: 20 }).notNull(), // 'photo', 'video'
    caption: text("caption"),
    viewCount: integer("view_count").default(0),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index("stories_user_id_idx").on(table.userId),
    expiresAtIdx: index("stories_expires_at_idx").on(table.expiresAt),
}));
// Story Views Table
export const storyViews = pgTable("story_views", {
    id: uuid("id").primaryKey().defaultRandom(),
    storyId: uuid("story_id")
        .notNull()
        .references(() => stories.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => ({
    storyIdIdx: index("story_views_story_id_idx").on(table.storyId),
    userIdIdx: index("story_views_user_id_idx").on(table.userId),
}));
// Gifts Table
export const gifts = pgTable("gifts", {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
        .notNull()
        .references(() => posts.id, { onDelete: "cascade" }),
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
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // 'fire', 'comment', 'follow', 'mention', 'gift'
    giftId: uuid("gift_id").references(() => gifts.id, { onDelete: "cascade" }),
    fromUserId: uuid("from_user_id").references(() => users.id, {
        onDelete: "cascade",
    }),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    commentId: uuid("comment_id").references(() => comments.id, {
        onDelete: "cascade",
    }),
    storyId: uuid("story_id").references(() => stories.id, {
        onDelete: "cascade",
    }),
    message: text("message"),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    postIdIdx: index("notifications_post_id_idx").on(table.postId),
    fromUserIdIdx: index("notifications_from_user_id_idx").on(table.fromUserId),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
}));
export const usersRelations = relations(users, ({ many }) => ({
    posts: many(posts),
    comments: many(comments),
    followers: many(follows, { relationName: "following" }),
    following: many(follows, { relationName: "follower" }),
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
    content: z.string().min(1).max(5000), // Map to required 'content' column
}).omit({
    id: true,
    createdAt: true,
    fireCount: true,
    commentCount: true,
    deletedAt: true,
    viewCount: true,
    burnedAt: true,
});
export const insertCommentSchema = createInsertSchema(comments, {
    content: z.string().min(1).max(500),
}).omit({ id: true, createdAt: true });
export const insertFollowSchema = createInsertSchema(follows).omit({
    createdAt: true,
});
export const insertStorySchema = createInsertSchema(stories).omit({
    id: true,
    createdAt: true,
});
export const insertNotificationSchema = createInsertSchema(notifications).omit({
    id: true,
    createdAt: true,
});
// Regional Gift catalog with cultural items (prices in cents)
export const insertGiftSchema = createInsertSchema(gifts).omit({
    id: true,
    createdAt: true,
});
export const GIFT_CATALOG = {
    // Universal gifts
    comete: { emoji: "☄️", name: "Comète", price: 50 },
    feu: { emoji: "🔥", name: "Feu", price: 100 },
    coeur_or: { emoji: "💛", name: "Coeur d'or", price: 100 },
    // Regional gifts by hive
    sirop_erable: {
        emoji: "🍁",
        name: "Sirop d'érable",
        price: 75,
        hive: "quebec",
    },
    cafe: { emoji: "☕", name: "Café brasileiro", price: 60, hive: "south" }, // Brazil
    mate: { emoji: "🧉", name: "Mate argentino", price: 70, hive: "south" }, // Argentina
    taco: { emoji: "🌮", name: "Taco auténtico", price: 80, hive: "mexico" },
    starbucks_cafe: {
        emoji: "☕",
        name: "Café Starbucks",
        price: 550,
        hive: "global",
    },
};
// Colony Tasks Table (AI Swarm)
export const colonyTasks = pgTable("colony_tasks", {
    id: uuid("id").primaryKey().defaultRandom(),
    command: text("command").notNull(),
    origin: text("origin").default("Ti-Guy Swarm"),
    status: text("status").notNull().default("pending"), // pending, processing, completed, failed, async_waiting, rejected, sovereignty_violation
    priority: text("priority").default("normal"),
    metadata: jsonb("metadata"),
    result: jsonb("result"),
    error: text("error"),
    workerId: text("worker_id"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true }),
    falRequestId: text("fal_request_id"),
    // QA Firewall Audit Fields
    requiresAudit: boolean("requires_audit").default(false),
    auditedAt: timestamp("audited_at", { withTimezone: true }),
    auditResult: jsonb("audit_result"),
    auditConfidence: decimal("audit_confidence", { precision: 3, scale: 2 }),
    auditViolations: text("audit_violations").array(),
    auditError: text("audit_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
}, (table) => ({
    statusIdx: index("idx_colony_tasks_status").on(table.status),
    stuckIdx: index("idx_colony_tasks_stuck").on(table.status, table.lastHeartbeat),
    auditIdx: index("idx_colony_tasks_audit").on(table.requiresAudit, table.auditedAt),
}));
// Audit Log Table (QA Firewall)
export const auditLogs = pgTable("audit_log", {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").references(() => colonyTasks.id, {
        onDelete: "cascade",
    }),
    agentId: text("agent_id").notNull(),
    auditResult: jsonb("audit_result").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true })
        .defaultNow()
        .notNull(),
    authorization: text("authorization").default("unique-spirit-482300-s4"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
}, (table) => ({
    taskIdIdx: index("audit_log_task_id_idx").on(table.taskId),
    timestampIdx: index("audit_log_timestamp_idx").on(table.timestamp),
    agentIdIdx: index("audit_log_agent_id_idx").on(table.agentId),
}));
// Agent Memories - Core of "The Elephant" (Long-term Memory)
export const agentMemories = pgTable("agent_memories", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    content: text("content").notNull(),
    importance: integer("importance").default(1), // 1-10
    embedding: vector("embedding", { dimensions: 768 }), // For semantic recall
    metadata: jsonb("metadata"),
    auditStatus: text("audit_status").default("pending"), // 'pending', 'safe', 'flagged', 'redacted'
    lastAuditedAt: timestamp("last_audited_at"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
}, (table) => ({
    userIdIdx: index("idx_agent_memories_user_id").on(table.userId),
    embeddingIdx: index("idx_agent_memories_embedding").using("hnsw", table.embedding),
}));
// --- HIVE ECONOMY PROTOCOL TABLES ---
// The Great Ledger (Le Grand Livre des Piasses)
export const transactions = pgTable("transactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id").references(() => users.id),
    receiverId: uuid("receiver_id").references(() => users.id),
    amount: integer("amount").notNull(), // Amount in base unit (cents or points)
    creditType: creditTypeEnum("credit_type").default("cash"),
    type: transactionTypeEnum("transaction_type").notNull(),
    status: transactionStatusEnum("status").default("pending"),
    feeAmount: integer("fee_amount").default(0), // Dynamic Platform Fee (5-12%)
    taxAmount: integer("tax_amount").default(0), // QST/GST calculation
    metadata: jsonb("metadata").default({}), // e.g., { message: "Pour ta poutine!", location: "Montreal" }
    hiveId: hiveEnum("hive_id").default("quebec"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    senderIdx: index("idx_transactions_sender").on(table.senderId),
    receiverIdx: index("idx_transactions_receiver").on(table.receiverId),
}));
// Hive Bonds (Les Obligations de la Ruche)
export const hiveBonds = pgTable("hive_bonds", {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: uuid("creator_id")
        .references(() => users.id)
        .notNull(),
    title: varchar("title", { length: 100 }).notNull(),
    description: text("description"),
    targetAmount: integer("target_amount").notNull(),
    currentAmount: integer("current_amount").default(0),
    currency: creditTypeEnum("currency").default("cash"),
    status: text("status").default("active"), // active, reached, expired
    expiresAt: timestamp("expires_at"),
    contributors: jsonb("contributors").default([]), // Array of {userId, amount, timestamp}
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
// --- SAFE SWARM & ROYALE ENGINE TABLES ---
// Parental Controls (The Honey-Fence)
export const parentalControls = pgTable("parental_controls", {
    id: uuid("id").primaryKey().defaultRandom(),
    childUserId: uuid("child_user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    homeLat: decimal("home_lat", { precision: 10, scale: 7 }),
    homeLng: decimal("home_lng", { precision: 10, scale: 7 }),
    allowedRadiusMeters: integer("allowed_radius_meters").default(500),
    curfewStart: varchar("curfew_start", { length: 5 }).default("20:00"), // 24h format
    curfewEnd: varchar("curfew_end", { length: 5 }).default("07:00"),
    notificationsEnabled: boolean("notifications_enabled").default(true),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Bee Spawns (Swarm AR)
export const beeSpawns = pgTable("bee_spawns", {
    id: uuid("id").primaryKey().defaultRandom(),
    hiveId: hiveEnum("hive_id").default("quebec"),
    type: text("type").notNull(), // worker, drone, queen
    rewardAmount: integer("reward_amount").notNull(), // Piasses
    location: geography("location").notNull(),
    spawnedAt: timestamp("spawned_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
    capturedBy: uuid("captured_by").references(() => users.id),
    isSafe: boolean("is_safe").default(true),
});
// Duplicate tables removed in favor of tournaments and royaleScores defined below
// Waitlist (The Swarm Growth Engine)
export const waitlist = pgTable("waitlist", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    referralCode: varchar("referral_code", { length: 10 }).unique().notNull(),
    referredById: uuid("referred_by_id").references(() => waitlist.id),
    referralCount: integer("referral_count").default(0),
    queuePosition: serial("queue_position"), // Initial rank
    founderBadgeUnlocked: boolean("founder_badge_unlocked").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
// Agent Traces - "The Flight Recorder" (Observability)
export const agentTraces = pgTable("agent_traces", {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id"), // Optional link to colony_tasks
    agentId: text("agent_id").notNull(),
    traceType: text("trace_type").notNull(), // 'thought', 'tool_call', 'error', 'result'
    content: text("content").notNull(),
    metadata: jsonb("metadata"), // token usage, latency, tool args
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
}, (table) => ({
    agentIdIdx: index("idx_agent_traces_agent_id").on(table.agentId),
    taskIdIdx: index("idx_agent_traces_task_id").on(table.taskId),
    createdAtIdx: index("idx_agent_traces_created_at").on(table.createdAt),
}));
// Agent Facts - "The Gold Nuggets" (Distilled Knowledge)
export const agentFacts = pgTable("agent_facts", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    category: text("category").notNull(), // 'preference', 'bio', 'history', 'relationship'
    content: text("content").notNull(),
    confidence: decimal("confidence", { precision: 3, scale: 2 }).default("1.00"),
    sourceMemoryId: uuid("source_memory_id").references(() => agentMemories.id, { onDelete: "set null" }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
}, (table) => ({
    userIdIdx: index("idx_agent_facts_user_id").on(table.userId),
    categoryIdx: index("idx_agent_facts_category").on(table.category),
}));
// Moderation Logs (The "Sin Bin")
export const moderationLogs = pgTable("moderation_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    action: varchar("action", { length: 50 }).notNull(), // 'ban', 'warn', 'shadowban'
    reason: text("reason"),
    details: text("details"),
    score: integer("score").default(0), // Severity score
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index("idx_moderation_logs_user_id").on(table.userId),
    actionIdx: index("idx_moderation_logs_action").on(table.action),
}));
export const tournaments = pgTable("tournaments", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    entryFee: integer("entry_fee").notNull(),
    prizePool: integer("prize_pool").default(0).notNull(),
    status: text("status").notNull(), // 'active', 'completed'
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
export const royaleScores = pgTable("royale_scores", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .references(() => users.id)
        .notNull(),
    tournamentId: uuid("tournament_id")
        .references(() => tournaments.id)
        .notNull(),
    score: integer("score").notNull(),
    layers: integer("layers").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
}, (table) => ({
    tournamentIdx: index("idx_royale_scores_tournament").on(table.tournamentId),
    userIdIdx: index("idx_royale_scores_user").on(table.userId),
}));
export const insertTransactionSchema = createInsertSchema(transactions).omit({
    id: true,
    createdAt: true,
});
export const insertParentalControlSchema = createInsertSchema(parentalControls).omit({
    id: true,
    updatedAt: true,
});
//# sourceMappingURL=schema.js.map