import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import rateLimit from "express-rate-limit";
import { storage } from "./storage.js";
import {
  insertUserSchema, insertPostSchema, insertCommentSchema,
  insertStorySchema, GIFT_CATALOG, type GiftType
} from "../shared/schema.js";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { fal } from "@fal-ai/client";
import { v3TiGuyChat, v3Flow, v3Feed, v3Microcopy, FAL_PRESETS } from "./v3-swarm.js";
import emailAutomation from "./email-automation.js";
// [NEW] Import the JWT verifier
import { verifyAuthToken } from "./supabase-auth.js";
// Import tracing utilities
import { traced, traceDatabase, traceExternalAPI, traceStripe, traceSupabase, addSpanAttributes } from "./tracer.js";

// Configure FAL client
fal.config({
  credentials: process.env.FAL_API_KEY,
});

// Rate limiters for different endpoint types
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: { error: "Trop de requêtes AI. Réessaie dans quelques minutes! 🦫" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 auth attempts per minute per IP (stricter to prevent brute force)
  message: { error: "Trop de tentatives de connexion. Réessaie dans une minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 requests per 15 minutes per IP
  message: { error: "Trop de requêtes. Réessaie bientôt!" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stripe configuration
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});



// [UPDATED] Hybrid Auth Middleware
// Accepts:
// 1. Authorization: Bearer <jwt> (New, Stateless)
// 2. Cookie Session (Legacy, Stateful)
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Strategy: Check for Supabase JWT (Bearer Token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const userId = await verifyAuthToken(token);

    if (userId) {
      req.userId = userId;
      return next();
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
}

async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const userId = await verifyAuthToken(token);

    if (userId) {
      req.userId = userId;
    }
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Apply general rate limiting to all API routes
  app.use("/api", generalRateLimiter);



  // ============ LEGACY AUTH ROUTES (for backward compatibility) ============

  // Sign up
  app.post("/api/auth/signup", authRateLimiter, async (req, res) => {
    try {
      const { email, username, password, displayName } = req.body;

      // Validate
      const parsed = insertUserSchema.safeParse({
        email,
        username,
        password,
        displayName: displayName || username
      });

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      // Check if user exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        ...parsed.data,
        password: hashedPassword,
      });

      // Schedule welcome + onboarding email sequence
      try {
        emailAutomation.scheduleOnboardingSequence(user.id);
        console.log(`[Auth] Scheduled onboarding emails for user ${user.id}`);
      } catch (emailError) {
        // Don't fail signup if email scheduling fails
        console.error("[Auth] Failed to schedule onboarding emails:", emailError);
      }

      // Return user without password
      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Login
  app.post("/api/auth/login", authRateLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if user has a password (OAuth users may not have one)
      if (!user.password) {
        return res.status(401).json({ error: "Please log in with your social account" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Session-based auth removed - frontend uses Supabase JWT

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Legacy /api/auth/logout and /api/auth/me endpoints removed
  // Frontend now uses Supabase auth directly (supabase.auth.signOut())

  // ============ USER ROUTES ============

  // Get user by username
  app.get("/api/users/:username", optionalAuth, async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...safeUser } = user;

      // Check if current user follows this user
      let isFollowing = false;
      if (req.userId && req.userId !== user.id) {
        isFollowing = await storage.isFollowing(req.userId, user.id);
      }

      res.json({ user: { ...safeUser, isFollowing } });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Update current user profile
  app.patch("/api/users/me", requireAuth, async (req, res) => {
    try {
      const { displayName, bio, avatarUrl, location, region } = req.body;

      const updated = await storage.updateUser(req.userId!, {
        displayName,
        bio,
        avatarUrl,
        location,
        region,
      });

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...safeUser } = updated;
      res.json({ user: safeUser });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ============ POSTS ROUTES ============

  // Get feed posts
  app.get("/api/feed", requireAuth, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;

      const posts = await storage.getFeedPosts(req.userId!, page, limit);
      res.json({ posts });
    } catch (error) {
      console.error("Get feed error:", error);
      res.status(500).json({ error: "Failed to get feed" });
    }
  });

  // Get explore posts (public, popular)
  app.get("/api/explore", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;

      const posts = await storage.getExplorePosts(page, limit);
      res.json({ posts });
    } catch (error) {
      console.error("Get explore error:", error);
      res.status(500).json({ error: "Failed to get explore posts" });
    }
  });

  // Get single post
  app.get("/api/posts/:id", optionalAuth, async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Check if current user has fired this post
      let isFired = false;
      if (req.userId) {
        isFired = await storage.hasUserFiredPost(req.params.id, req.userId);
      }

      // Increment view count
      await storage.incrementPostViews(req.params.id);

      res.json({ post: { ...post, isFired } });
    } catch (error) {
      console.error("Get post error:", error);
      res.status(500).json({ error: "Failed to get post" });
    }
  });

  // Get user's posts
  app.get("/api/users/:username/posts", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const posts = await storage.getPostsByUser(user.id);
      res.json({ posts });
    } catch (error) {
      console.error("Get user posts error:", error);
      res.status(500).json({ error: "Failed to get posts" });
    }
  });

  // Create post
  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const parsed = insertPostSchema.safeParse({
        ...req.body,
        userId: req.userId,
      });

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const post = await storage.createPost(parsed.data);
      res.status(201).json({ post });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Delete post
  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (post.userId !== req.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.deletePost(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // ============ REACTIONS ROUTES ============

  // Toggle fire reaction on post
  app.post("/api/posts/:id/fire", requireAuth, async (req, res) => {
    try {
      const result = await storage.togglePostReaction(
        req.params.id,
        req.userId!
      );
      res.json(result);
    } catch (error) {
      console.error("Toggle fire error:", error);
      res.status(500).json({ error: "Failed to toggle reaction" });
    }
  });

  // ============ COMMENTS ROUTES ============

  // Get post comments
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getPostComments(req.params.id);
      res.json({ comments });
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  // Add comment
  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const parsed = insertCommentSchema.safeParse({
        postId: req.params.id,
        userId: req.userId,
        content: req.body.content,
      });

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const comment = await storage.createComment(parsed.data);

      // Get user info for response
      const user = await storage.getUser(req.userId!);

      res.status(201).json({
        comment: { ...comment, user, isFired: false }
      });
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Delete comment
  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteComment(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Toggle fire on comment
  app.post("/api/comments/:id/fire", requireAuth, async (req, res) => {
    try {
      const result = await storage.toggleCommentReaction(
        req.params.id,
        req.userId!
      );
      res.json(result);
    } catch (error) {
      console.error("Toggle comment fire error:", error);
      res.status(500).json({ error: "Failed to toggle reaction" });
    }
  });

  // ============ FOLLOWS ROUTES ============

  // Follow user
  app.post("/api/users/:id/follow", requireAuth, async (req, res) => {
    try {
      if (req.params.id === req.userId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }

      const success = await storage.followUser(req.userId!, req.params.id);
      res.json({ success, isFollowing: success });
    } catch (error) {
      console.error("Follow error:", error);
      res.status(500).json({ error: "Failed to follow user" });
    }
  });

  // Unfollow user
  app.delete("/api/users/:id/follow", requireAuth, async (req, res) => {
    try {
      const success = await storage.unfollowUser(req.userId!, req.params.id);
      res.json({ success, isFollowing: false });
    } catch (error) {
      console.error("Unfollow error:", error);
      res.status(500).json({ error: "Failed to unfollow user" });
    }
  });

  // Get followers
  app.get("/api/users/:id/followers", async (req, res) => {
    try {
      const followers = await storage.getFollowers(req.params.id);
      res.json({
        followers: followers.map(f => {
          const { password: _, ...safe } = f;
          return safe;
        })
      });
    } catch (error) {
      console.error("Get followers error:", error);
      res.status(500).json({ error: "Failed to get followers" });
    }
  });

  // Get following
  app.get("/api/users/:id/following", async (req, res) => {
    try {
      const following = await storage.getFollowing(req.params.id);
      res.json({
        following: following.map(f => {
          const { password: _, ...safe } = f;
          return safe;
        })
      });
    } catch (error) {
      console.error("Get following error:", error);
      res.status(500).json({ error: "Failed to get following" });
    }
  });

  // ============ STORIES ROUTES ============

  // Get active stories
  app.get("/api/stories", optionalAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const stories = await storage.getActiveStories(userId);
      res.json({ stories });
    } catch (error) {
      console.error("Get stories error:", error);
      res.status(500).json({ error: "Failed to get stories" });
    }
  });

  // Create story
  app.post("/api/stories", requireAuth, async (req, res) => {
    try {
      // Stories expire after 24 hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const parsed = insertStorySchema.safeParse({
        ...req.body,
        userId: req.userId,
        expiresAt,
      });

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const story = await storage.createStory(parsed.data);
      res.status(201).json({ story });
    } catch (error) {
      console.error("Create story error:", error);
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  // Mark story as viewed
  app.post("/api/stories/:id/view", requireAuth, async (req, res) => {
    try {
      await storage.markStoryViewed(req.params.id, req.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark story viewed error:", error);
      res.status(500).json({ error: "Failed to mark story viewed" });
    }
  });

  // ============ NOTIFICATIONS ROUTES ============

  // Get notifications
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.userId!);
      res.json({ notifications });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark notification read" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ error: "Failed to mark notifications read" });
    }
  });

  // ============ AI GENERATION ROUTES ============

  // Generate image with Flux
  app.post("/api/ai/generate-image", aiRateLimiter, requireAuth, async (req, res) => {
    try {
      const { prompt, aspectRatio = "1:1" } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (!process.env.FAL_API_KEY) {
        return res.status(500).json({ error: "FAL API key not configured" });
      }

      console.log(`Generating image with Flux: "${prompt.substring(0, 50)}..."`);

      const result = await traceExternalAPI("fal-ai", "flux/schnell", "POST", async (span) => {
        span.setAttributes({
          "ai.model": "flux-schnell",
          "ai.prompt_length": prompt.length,
          "ai.aspect_ratio": aspectRatio,
        });

        return fal.subscribe("fal-ai/flux/schnell", {
          input: {
            prompt,
            image_size: aspectRatio === "16:9" ? "landscape_16_9" :
              aspectRatio === "9:16" ? "portrait_16_9" :
                aspectRatio === "4:3" ? "landscape_4_3" :
                  aspectRatio === "3:4" ? "portrait_4_3" : "square",
            num_images: 1,
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              console.log("Flux generation in progress...");
            }
          },
        });
      });

      const images = (result.data as any)?.images || [];
      if (images.length === 0) {
        return res.status(500).json({ error: "No image generated" });
      }

      res.json({
        imageUrl: images[0].url,
        prompt,
      });
    } catch (error: any) {
      console.error("AI image generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  // Ti-Guy AI Chat (V3-TI-GUY from swarm)
  app.post("/api/ai/tiguy-chat", aiRateLimiter, requireAuth, async (req, res) => {
    try {
      const { message, conversationHistory = [] } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!process.env.DEEPSEEK_API_KEY) {
        return res.status(500).json({ error: "DeepSeek API key not configured" });
      }

      // Use V3-TI-GUY from the swarm architecture
      const formattedHistory = conversationHistory.slice(-10).map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      }));

      const response = await v3TiGuyChat(message, formattedHistory);

      res.json({ response });
    } catch (error: any) {
      console.error("Ti-Guy AI error:", error);
      res.status(500).json({ error: error.message || "Ti-Guy est fatigué, réessaie plus tard!" });
    }
  });

  // V3 Flow - Orchestrated AI actions
  app.post("/api/v3/flow", aiRateLimiter, requireAuth, async (req, res) => {
    try {
      const { action, context } = req.body;

      if (!action || typeof action !== 'string') {
        return res.status(400).json({ error: "Action is required" });
      }

      if (!process.env.DEEPSEEK_API_KEY) {
        return res.status(500).json({ error: "DeepSeek API key not configured" });
      }

      const result = await v3Flow(action, context);
      res.json(result);
    } catch (error: any) {
      console.error("V3 Flow error:", error);
      res.status(500).json({ error: error.message || "V3 flow failed" });
    }
  });

  // V3 Feed - Generate AI feed items
  app.post("/api/v3/feed-item", aiRateLimiter, requireAuth, async (req, res) => {
    try {
      const { context } = req.body;

      if (!process.env.DEEPSEEK_API_KEY) {
        return res.status(500).json({ error: "DeepSeek API key not configured" });
      }

      const feedItem = await v3Feed(context);
      res.json(feedItem);
    } catch (error: any) {
      console.error("V3 Feed error:", error);
      res.status(500).json({ error: error.message || "Failed to generate feed item" });
    }
  });

  // V3 Microcopy - Generate UI text in Ti-Guy voice
  app.post("/api/v3/microcopy", aiRateLimiter, requireAuth, async (req, res) => {
    try {
      const { type, context } = req.body;

      if (!type || !["loading", "error", "success", "onboarding", "empty_state"].includes(type)) {
        return res.status(400).json({ error: "Valid type is required" });
      }

      if (!process.env.DEEPSEEK_API_KEY) {
        return res.status(500).json({ error: "DeepSeek API key not configured" });
      }

      const text = await v3Microcopy(type, context);
      res.json({ text });
    } catch (error: any) {
      console.error("V3 Microcopy error:", error);
      res.status(500).json({ error: error.message || "Failed to generate microcopy" });
    }
  });

  // Get FAL presets
  app.get("/api/v3/fal-presets", requireAuth, (req, res) => {
    res.json(FAL_PRESETS);
  });

  // Generate video with Kling (image-to-video)
  app.post("/api/ai/generate-video", aiRateLimiter, requireAuth, async (req, res) => {
    try {
      const { imageUrl, prompt = "Animate this image with natural movement" } = req.body;

      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ error: "Image URL is required" });
      }

      if (!process.env.FAL_API_KEY) {
        return res.status(500).json({ error: "FAL API key not configured" });
      }

      console.log(`Generating video with Kling from image...`);

      const result = await fal.subscribe("fal-ai/kling-video/v2/master/image-to-video", {
        input: {
          image_url: imageUrl,
          prompt,
          duration: "5" as const,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log("Kling video generation in progress...");
          }
        },
      });

      const video = (result.data as any)?.video;
      if (!video?.url) {
        return res.status(500).json({ error: "No video generated" });
      }

      res.json({
        videoUrl: video.url,
        prompt,
      });
    } catch (error: any) {
      console.error("AI video generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate video" });
    }
  });

  // ============ STRIPE SUBSCRIPTION ROUTES ============

  // Create checkout session for premium subscription
  app.post("/api/stripe/create-checkout", requireAuth, async (req, res) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const session = await traceStripe("checkout.sessions.create", async (span) => {
        span.setAttributes({ "stripe.user_id": user.id });
        return stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          line_items: [
            {
              price_data: {
                currency: "cad",
                product_data: {
                  name: "Zyeuté VIP",
                  description: "Accès premium avec Ti-Guy AI, création avancée, et plus!",
                },
                unit_amount: 999, // $9.99 CAD
                recurring: {
                  interval: "month",
                },
              },
              quantity: 1,
            },
          ],
          success_url: `${req.headers.origin}/premium?success=true`,
          cancel_url: `${req.headers.origin}/premium?canceled=true`,
          customer_email: user.email || undefined,
          metadata: {
            userId: user.id,
          },
        });
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  // Get subscription status
  app.get("/api/stripe/subscription-status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        isPremium: user.isPremium || false,
        subscriptionEnd: null, // Would track in DB
      });
    } catch (error: any) {
      console.error("Subscription status error:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  // ============ EMAIL AUTOMATION ROUTES ============

  // Admin middleware for email management routes
  async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await storage.getUser(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  }

  // Get pending emails (admin only)
  app.get("/api/email/pending", requireAdmin, async (req, res) => {
    try {
      const pendingEmails = emailAutomation.getPendingEmails();
      res.json({
        count: pendingEmails.length,
        emails: pendingEmails.map(e => ({
          id: e.id,
          type: e.emailType,
          scheduledFor: e.scheduledFor,
          status: e.status,
        }))
      });
    } catch (error: any) {
      console.error("Email pending error:", error);
      res.status(500).json({ error: "Failed to get pending emails" });
    }
  });

  // Process email queue (admin only - in production use cron job)
  app.post("/api/email/process-queue", requireAdmin, async (req, res) => {
    try {
      const sentCount = await emailAutomation.processEmailQueue();
      res.json({
        success: true,
        processed: sentCount,
        message: `Processed ${sentCount} emails`
      });
    } catch (error: any) {
      console.error("Email queue processing error:", error);
      res.status(500).json({ error: "Failed to process email queue" });
    }
  });

  // Send test welcome email (for testing)
  app.post("/api/email/send-welcome", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      const result = await emailAutomation.sendEmailNow(userId, 'welcome');

      if (result.success) {
        res.json({ success: true, message: "Welcome email sent!" });
      } else {
        res.status(500).json({ error: result.error || "Failed to send email" });
      }
    } catch (error: any) {
      console.error("Send welcome email error:", error);
      res.status(500).json({ error: "Failed to send welcome email" });
    }
  });

  // Resend webhook handler for tracking email events
  app.post("/api/email/webhook", async (req, res) => {
    try {
      const event = req.body;
      console.log(`[Resend Webhook] Event received:`, event.type);

      switch (event.type) {
        case 'email.sent':
          console.log(`[Resend] Email sent: ${event.data?.email_id}`);
          break;
        case 'email.delivered':
          console.log(`[Resend] Email delivered: ${event.data?.email_id}`);
          break;
        case 'email.opened':
          console.log(`[Resend] Email opened: ${event.data?.email_id}`);
          break;
        case 'email.clicked':
          console.log(`[Resend] Email link clicked: ${event.data?.email_id}`);
          break;
        case 'email.bounced':
          console.error(`[Resend] Email bounced: ${event.data?.email_id}`);
          break;
        case 'email.complained':
          console.error(`[Resend] Email spam complaint: ${event.data?.email_id}`);
          break;
        default:
          console.log(`[Resend] Unknown event: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Preview email content (for testing)
  app.post("/api/email/preview", requireAuth, async (req, res) => {
    try {
      const { emailType, username } = req.body;

      if (!emailType || !username) {
        return res.status(400).json({ error: "emailType and username required" });
      }

      const content = await emailAutomation.generatePersonalizedContent(
        emailType,
        username,
        req.body.context
      );

      res.json(content);
    } catch (error: any) {
      console.error("Email preview error:", error);
      res.status(500).json({ error: "Failed to generate email preview" });
    }
  });

  // Manually trigger onboarding sequence (for testing)
  app.post("/api/email/trigger-onboarding", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      emailAutomation.scheduleOnboardingSequence(userId);
      res.json({
        success: true,
        message: "Onboarding sequence scheduled"
      });
    } catch (error: any) {
      console.error("Email trigger error:", error);
      res.status(500).json({ error: "Failed to trigger onboarding" });
    }
  });

  // Cancel pending emails for current user only (user can cancel their own)
  app.delete("/api/email/cancel", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      const { emailType } = req.body;

      // Users can only cancel their own emails
      const cancelled = emailAutomation.cancelPendingEmails(userId, emailType);
      res.json({
        success: true,
        cancelled,
        message: `Cancelled ${cancelled} pending emails`
      });
    } catch (error: any) {
      console.error("Email cancel error:", error);
      res.status(500).json({ error: "Failed to cancel emails" });
    }
  });

  // ============ VIRTUAL GIFTS ROUTES ============

  // Get gift catalog
  app.get("/api/gifts/catalog", (req, res) => {
    res.json({
      gifts: Object.entries(GIFT_CATALOG).map(([type, info]) => ({
        type,
        ...info,
        priceDisplay: `$${(info.price / 100).toFixed(2)}`,
      }))
    });
  });

  // Create payment intent for gift purchase
  app.post("/api/gifts/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const { giftType, postId } = req.body;

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      // Validate gift type
      if (!giftType || !(giftType in GIFT_CATALOG)) {
        return res.status(400).json({ error: "Invalid gift type" });
      }

      // Validate post exists and get recipient
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const senderId = req.userId!;
      const recipientId = post.userId;

      // Can't gift your own post
      if (senderId === recipientId) {
        return res.status(400).json({ error: "Tu peux pas t'envoyer un cadeau à toi-même! 🎁" });
      }

      const giftInfo = GIFT_CATALOG[giftType as GiftType];
      const amount = giftInfo.price;

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "cad",
        metadata: {
          type: "gift",
          giftType,
          postId,
          senderId,
          recipientId,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount,
        giftInfo,
      });
    } catch (error: any) {
      console.error("Gift payment intent error:", error);
      res.status(500).json({ error: error.message || "Failed to create payment intent" });
    }
  });

  // Confirm gift after successful payment
  app.post("/api/gifts/confirm", requireAuth, async (req, res) => {
    try {
      const { paymentIntentId, giftType, postId } = req.body;
      const senderId = req.userId!;

      if (!paymentIntentId || !giftType || !postId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      // Verify metadata matches
      if (paymentIntent.metadata.postId !== postId ||
        paymentIntent.metadata.giftType !== giftType ||
        paymentIntent.metadata.senderId !== senderId) {
        return res.status(400).json({ error: "Payment verification failed" });
      }

      const recipientId = paymentIntent.metadata.recipientId;
      const giftInfo = GIFT_CATALOG[giftType as GiftType];

      // Create the gift
      const gift = await storage.createGift({
        senderId,
        recipientId,
        postId,
        giftType,
        amount: giftInfo.price,
        stripePaymentId: paymentIntentId,
      });

      // Create notification for recipient
      const sender = await storage.getUser(senderId);
      await storage.createNotification({
        userId: recipientId,
        type: 'gift',
        fromUserId: senderId,
        postId,
        giftId: gift.id,
        message: `${sender?.displayName || sender?.username} t'a envoyé un ${giftInfo.emoji} ${giftInfo.name}!`,
      });

      res.json({
        success: true,
        gift,
        giftInfo,
      });
    } catch (error: any) {
      console.error("Gift confirm error:", error);
      res.status(500).json({ error: error.message || "Failed to confirm gift" });
    }
  });

  // Get gifts for a post
  app.get("/api/posts/:id/gifts", async (req, res) => {
    try {
      const postId = req.params.id;
      const gifts = await storage.getGiftsByPost(postId);
      const count = await storage.getPostGiftCount(postId);

      // Group by gift type for display
      const giftCounts: Record<string, number> = {};
      gifts.forEach(g => {
        giftCounts[g.giftType] = (giftCounts[g.giftType] || 0) + 1;
      });

      res.json({
        totalCount: count,
        giftCounts,
        recentGifts: gifts.slice(0, 5).map(g => ({
          id: g.id,
          type: g.giftType,
          sender: {
            id: g.sender.id,
            username: g.sender.username,
            displayName: g.sender.displayName,
            avatarUrl: g.sender.avatarUrl,
          },
          createdAt: g.createdAt,
        })),
      });
    } catch (error: any) {
      console.error("Get post gifts error:", error);
      res.status(500).json({ error: "Failed to get gifts" });
    }
  });

  // Get user's received gifts
  app.get("/api/users/me/gifts", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      const gifts = await storage.getUserReceivedGifts(userId);

      res.json({
        gifts: gifts.map(g => ({
          id: g.id,
          type: g.giftType,
          amount: g.amount,
          sender: {
            id: g.sender.id,
            username: g.sender.username,
            displayName: g.sender.displayName,
            avatarUrl: g.sender.avatarUrl,
          },
          post: {
            id: g.post.id,
            mediaUrl: g.post.mediaUrl,
            thumbnailUrl: g.post.thumbnailUrl,
          },
          createdAt: g.createdAt,
        })),
      });
    } catch (error: any) {
      console.error("Get user gifts error:", error);
      res.status(500).json({ error: "Failed to get gifts" });
    }
  });

  return httpServer;
}
