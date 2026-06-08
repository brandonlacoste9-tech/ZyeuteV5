import "./preload.js";
// [SECURITY] SSL certificate validation bypass for local development.
// This is required when connecting to certain Supabase/Railway endpoints with self-signed certs.
// WARNING: Never enable this in production.
if (
  process.env.NODE_ENV !== "production" &&
  process.env.SKIP_SSL_VALIDATION === "true"
) {
  console.warn(
    "⚠️ Security: SSL certificate validation is disabled (SKIP_SSL_VALIDATION=true)",
  );
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import tiGuyRouter from "./routes/tiguy.js";
import hiveRouter from "./routes/hive.js";
import messagingRouter from "./routes/messaging.js";
import { createServer } from "http";
import pg from "pg";
import { Server as SocketIOServer } from "socket.io";
import { db, pool } from "./storage.js";
import { posts } from "../shared/schema.js";
import { migrate } from "drizzle-orm/node-postgres/migrator";

// Log but do NOT exit — keep server up so one bad error doesn't kill the process.
// Use a process manager (e.g. Railway, PM2) to restart if needed.
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception (server staying up):", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection (server staying up):", reason, promise);
});

// DB Pool is imported from ./storage.js
// const { Pool } = pg;
// const pool = new Pool({...}) -> Removed to avoid collision

const app = express();

// Trust proxy (Railway, Vercel) - required for express-rate-limit to work behind reverse proxy
app.set("trust proxy", 1);

// CORS: allow frontend (Vercel / localhost) to call this backend
const allowedOrigins = [
  "https://www.zyeute.com",
  "https://zyeute.com",
  "https://zyeute.vercel.app",
  "https://zyeutev5-production.up.railway.app",
  "https://zyeutev5-1.onrender.com",
  "http://localhost:12000",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        console.log(`[CORS] Blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  }),
);

// Handle OPTIONS preflight for all routes - use regex pattern to avoid path-to-regexp issues
app.options(/.*/, cors());

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  next();
});

// Capture raw body for Stripe webhook signature verification
// Must come BEFORE express.json() and only for the webhook path
app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  (req: any, _res: any, next: any) => {
    req.rawBody = req.body; // Buffer
    next();
  },
);

app.use(express.json());

const httpServer = createServer(app);

// Initialize Socket.IO for Real-Time Features
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
  // Connection limits for production
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB max message size
});

// Redis adapter for multi-instance scale (if Redis is available)
(async () => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const { createAdapter } = await import("@socket.io/redis-adapter");
      const ioredis = await import("ioredis");
      const QUOTA_MSG = "max requests limit exceeded";

      const pubClient = new ioredis.default(redisUrl, {
        maxRetriesPerRequest: null,
        retryStrategy: (times: number) => {
          // Stop immediately on quota errors
          if ((pubClient as any)._quotaExceeded) return null;
          if (times > 3) return null;
          return Math.min(times * 50, 2000);
        },
      });
      const subClient = new ioredis.default(redisUrl, {
        maxRetriesPerRequest: null,
        retryStrategy: (times: number) => {
          if ((subClient as any)._quotaExceeded) return null;
          if (times > 3) return null;
          return Math.min(times * 50, 2000);
        },
      });

      // Detect quota error and permanently stop both clients
      const handleQuota = (client: any, name: string) => (err: Error) => {
        if (err.message.includes(QUOTA_MSG)) {
          client._quotaExceeded = true;
          console.warn(
            `[Socket.IO Redis ${name}] 🚫 Quota exceeded — disabling adapter`,
          );
          try {
            client.disconnect();
          } catch {
            /* ignore */
          }
        }
      };
      pubClient.on("error", handleQuota(pubClient, "pub"));
      subClient.on("error", handleQuota(subClient, "sub"));

      io.adapter(createAdapter(pubClient as any, subClient as any));
      console.log(
        "✅ Socket.IO Redis adapter connected (multi-instance ready)",
      );
    } catch (err) {
      console.warn(
        "⚠️ Socket.IO Redis adapter not available, single-instance mode",
      );
    }
  }
})();

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket.IO Client Connected:", socket.id);

  // ─── LIVE CHAT ────────────────────────────────────────────────────────────
  // Join a live stream room to receive/send chat messages
  socket.on("live:join", ({ streamId, userId, username, avatarUrl }: any) => {
    if (!streamId) return;
    const room = `live:${streamId}`;
    socket.join(room);
    console.log(`[Live] ${username || socket.id} joined ${room}`);

    // Broadcast viewer joined to room
    socket.to(room).emit("live:viewer_joined", {
      userId,
      username,
      avatarUrl,
      timestamp: Date.now(),
    });

    // Update and broadcast viewer count
    const count = io.sockets.adapter.rooms.get(room)?.size ?? 1;
    io.to(room).emit("live:viewer_count", { count });
  });

  socket.on("live:leave", ({ streamId }: any) => {
    if (!streamId) return;
    const room = `live:${streamId}`;
    socket.leave(room);
    const count = io.sockets.adapter.rooms.get(room)?.size ?? 0;
    io.to(room).emit("live:viewer_count", { count });
  });

  // Chat message in a live room
  socket.on(
    "live:message",
    ({ streamId, userId, username, avatarUrl, text, tier }: any) => {
      if (!streamId || !text?.trim()) return;
      const room = `live:${streamId}`;
      const message = {
        id: `${Date.now()}-${socket.id}`,
        userId,
        username: username || "Anonyme",
        avatarUrl,
        text: text.slice(0, 200),
        tier: tier || "free", // bronze/silver/gold — used for coloured name
        timestamp: Date.now(),
      };
      io.to(room).emit("live:message", message);
    },
  );

  // Gift sent during a live
  socket.on(
    "live:gift",
    ({
      streamId,
      senderId,
      senderName,
      recipientId,
      giftEmoji,
      giftName,
      giftCost,
    }: any) => {
      if (!streamId) return;
      const room = `live:${streamId}`;
      io.to(room).emit("live:gift", {
        id: `${Date.now()}-${socket.id}`,
        senderId,
        senderName: senderName || "Quelqu'un",
        recipientId,
        giftEmoji,
        giftName,
        giftCost,
        timestamp: Date.now(),
      });
    },
  );

  // Broadcaster ends stream
  socket.on("live:end", ({ streamId }: any) => {
    if (!streamId) return;
    const room = `live:${streamId}`;
    io.to(room).emit("live:ended", { streamId });
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket.IO Client Disconnected:", socket.id);
  });
});

// Port Management - Strictly follow PORT on Railway
const port = Number(process.env.PORT) || 3000;
let server: any;
let isSystemReady = false;

// [CRITICAL] Explicit health route - MUST be registered before middleware
// This ensures Railway healthchecks pass even during initialization
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    stage: isSystemReady ? "ready" : "initializing",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// [NEW] Startup Liveness Middleware
// Blocks traffic until DB is ready, but allows Health Check
app.use((req, res, next) => {
  // Debug route overrides
  if (req.path === "/api/debug") {
    return res
      .status(200)
      .json({ status: "debug_ok", systemReady: isSystemReady });
  }

  // If system works, proceed
  if (isSystemReady) {
    return next();
  }

  // Otherwise, return 503 Service Unavailable (Initializing)
  res.status(503).json({
    status: "initializing",
    message: "Server is starting up. Please wait...",
    uptime: process.uptime(),
  });
});

(async () => {
  try {
    // 1. Start Listening IMMEDIATELY (Satisfy Railway Healthcheck)
    // HOST MUST BE "0.0.0.0" - DO NOT USE "localhost"
    server = httpServer.listen(port, "0.0.0.0", () => {
      console.log(
        `✅ Server running on http://0.0.0.0:${port} (Initializing...)`,
      );
      console.log(
        `   Open in browser: http://127.0.0.1:${port}  (or http://localhost:${port})`,
      );
      console.log(`   Health: http://127.0.0.1:${port}/api/health`);
    });

    // 2. Perform Initialization in Background
    console.log("🛠️  [Startup] Beginning background initialization...");

    if (!process.env.DATABASE_URL) {
      console.error(
        "🔥 [Startup] DATABASE_URL is not set. Set it in .env or your environment.",
      );
      // We don't exit process, just log error. Server stays up but 503s.
      // actually, without DB we can't do much.
    } else {
      // [CRITICAL] Validate Database Connection
      try {
        console.log("📦 [Startup] Connecting to Database...");
        const client = await pool.connect();
        client.release();
        console.log("✅ [Startup] Database Connected Successfully");

        // Run critical migrations that are safe to run on every startup
        // (they all use IF NOT EXISTS / safe guards)
        try {
          const { readFileSync } = await import("fs");
          const { join } = await import("path");
          const migClient = await pool.connect();
          const migrations = [
            "20260202_add_hls_url.sql",
            "20260221_video_playback_schema.sql",
            "20260224_add_type_column.sql",
            "20260225_bulk_repair_videos.sql",
            "20260608_gifts_nullable_post_id.sql",
            "20260608_grid_rush_matches.sql",
            "20260608_grid_rush_tokens.sql",
            "20260608_grid_rush_bot.sql",
          ];
          for (const file of migrations) {
            try {
              const sql = readFileSync(
                join(process.cwd(), "backend/migrations", file),
                "utf-8",
              );
              await migClient.query(sql);
              console.log(`✅ [Startup] Migration applied: ${file}`);
            } catch (migErr: any) {
              console.warn(
                `⚠️ [Startup] Migration skipped (${file}): ${migErr.message?.split("\n")[0]}`,
              );
            }
          }
          migClient.release();
        } catch (migSetupErr: any) {
          console.warn(
            "⚠️ [Startup] Migration runner skipped:",
            migSetupErr.message,
          );
        }

        // Auto-seed feed if empty (ensures first boot has content)
        try {
          const checkClient = await pool.connect();
          const countResult = await checkClient.query(
            "SELECT COUNT(*) FROM publications WHERE processing_status = 'completed' AND COALESCE(est_masque, false) = false AND deleted_at IS NULL",
          );
          checkClient.release();
          const postCount = parseInt(countResult.rows[0]?.count || "0");
          if (postCount === 0) {
            console.log("🌱 [Startup] Feed is empty — triggering auto-seed...");
            const seedHeaders: Record<string, string> = {
              "Content-Type": "application/json",
            };
            if (process.env.CRON_SECRET) {
              seedHeaders["X-Cron-Secret"] = process.env.CRON_SECRET;
            }
            fetch(`http://127.0.0.1:${port}/api/seed/feed`, {
              method: "POST",
              headers: seedHeaders,
            })
              .then((r) => r.json())
              .then((d) => {
                console.log(
                  `✅ [Startup] Auto-seed complete: ${d.message || JSON.stringify(d)}`,
                );
              })
              .catch((e) => {
                console.warn("⚠️ [Startup] Auto-seed failed:", e.message);
              });
          } else {
            console.log(
              `✅ [Startup] Feed has ${postCount} posts — no seeding needed`,
            );
          }
        } catch (seedCheckErr: any) {
          console.warn(
            "⚠️ [Startup] Feed check skipped:",
            seedCheckErr.message,
          );
        }

        // [CRITICAL] Run Database Migrations
        // TEMPORARILY DISABLED - Migration causing startup crash
        // console.log("📦 [Startup] Running Schema Migrations...");
        // try {
        //   await migrate(db, { migrationsFolder: "./migrations" });
        //   console.log("✅ [Startup] Migrations Complete");
        // } catch (err: any) {
        //   // Log but don't crash main loop if possible, unless critical
        //   console.error("⚠️ [Startup] Migration warning/error:", err.message);
        // }

        // [SURGICAL SELF-HEALING] Active Schema Repair
        // TEMPORARILY DISABLED
        // try {
        //   const { healSchema } = await import("./schemaDoctor.js");
        //   await healSchema(pool);
        // } catch (err) {
        //   console.warn("⚠️ [Startup] Schema healing skipped:", err);
        // }
      } catch (dbErr: any) {
        console.error("🔥 [Startup] CANNOT CONNECT TO DATABASE:", dbErr);
      }
    }

    console.log("🛠️  Step 1: Initializing Scoring Engine & Routes...");
    try {
      const { initScoringEngine, createExploreRouteV2 } =
        await import("./scoring/integration.js");
      await initScoringEngine();
      createExploreRouteV2(app, db);

      // [NEW] Layer 3.2: Register Evolution Engine
      const { createEvolutionRouter } = await import("./scoring/evolution.js");
      app.use("/api/evolution", createEvolutionRouter(db));

      console.log("✅ Momentum Engine, Shadow Route & Evolution Engine Ready");

      // [VIRAL SCORE] Batch recompute viral_score every 10 minutes
      // Uses the HN-style formula: (reactions*1 + shares*3 + piasse*5) / time_decay^1.8
      const { batchUpdateViralScores } =
        await import("./scoring/integration.js");
      const runBatch = async () => {
        try {
          const updated = await batchUpdateViralScores(db);
          if (updated > 0)
            console.log(`[ViralScore] Batch updated ${updated} posts`);
        } catch (e) {
          console.warn("[ViralScore] Batch update failed:", e);
        }
      };
      // Run once on startup, then every 10 minutes
      runBatch();
      setInterval(runBatch, 10 * 60 * 1000);

      // [MONTHLY CENNES] Credit Argent/Or subscribers their monthly cenne allowance
      // Runs once per hour; only credits users whose last_cenne_credit was > 30 days ago
      const creditMonthlyCennes = async () => {
        try {
          const supabase = (await import("@supabase/supabase-js")).createClient(
            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          );

          const TIER_CENNES: Record<string, number> = {
            silver: 100,
            gold: 500,
          };
          const thirtyDaysAgo = new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString();

          for (const [tier, amount] of Object.entries(TIER_CENNES)) {
            // Find active subscribers not credited in last 30 days
            const { data: subs } = await supabase
              .from("subscription_tiers")
              .select("user_id, last_cenne_credit")
              .eq("tier_name", tier)
              .eq("status", "active");

            if (!subs?.length) continue;

            const due = subs.filter(
              (s: any) =>
                !s.last_cenne_credit || s.last_cenne_credit < thirtyDaysAgo,
            );

            for (const sub of due) {
              try {
                // Credit cennes
                await db
                  .update((await import("../shared/schema.js")).users)
                  .set({
                    cashCredits: (await import("drizzle-orm")).sql`${
                      (await import("../shared/schema.js")).users.cashCredits
                    } + ${amount}`,
                  })
                  .where(
                    (await import("drizzle-orm")).eq(
                      (await import("../shared/schema.js")).users.id,
                      sub.user_id,
                    ),
                  );

                // Record credit timestamp
                await supabase
                  .from("subscription_tiers")
                  .update({ last_cenne_credit: new Date().toISOString() })
                  .eq("user_id", sub.user_id)
                  .eq("tier_name", tier);

                console.log(
                  `[Cennes] Credited ${amount}¢ to ${tier} subscriber ${sub.user_id}`,
                );
              } catch (e) {
                console.warn(`[Cennes] Failed to credit ${sub.user_id}:`, e);
              }
            }
          }
        } catch (e) {
          console.warn("[Cennes] Monthly credit job failed:", e);
        }
      };

      // Run every hour
      setInterval(creditMonthlyCennes, 60 * 60 * 1000);
      creditMonthlyCennes(); // run once on startup to catch any missed credits
    } catch (err) {
      console.error("🚨 [Scoring] Engine setup failed:", err);
    }

    app.use("/api/tiguy", tiGuyRouter);
    app.use("/api/hive", hiveRouter);
    app.use("/api/messaging", messagingRouter);

    // Seed route for emergency feed population
    const { default: seedRouter } = await import("./routes/seed.js");
    app.use("/api/seed", seedRouter);

    console.log("🛠️  Step 2: Registering bulk routes...");
    await registerRoutes(httpServer, app);

    if (process.env.NODE_ENV === "production") {
      console.log("🛠️  Step 3: Serving static files (Production)...");
      serveStatic(app);
    } else {
      console.log("🛠️  Step 3: Setting up Vite (Development)...");
      try {
        const { setupVite } = await import("./vite.js");
        await setupVite(httpServer, app);
      } catch (viteErr: any) {
        console.warn(
          "⚠️ Vite dev server skipped (backend API still works):",
          viteErr?.message ?? viteErr,
        );
        console.warn(
          "   If you see Rollup/lightningcss native module errors, run: rm -rf node_modules package-lock.json && npm install",
        );
        console.warn(
          "   To run the frontend separately: npx vite (from project root)",
        );
      }
    }

    // 3. Mark System Ready
    isSystemReady = true;
    console.log("🚀 ZYEUTÉ IS FULLY ARMED AND OPERATIONAL! (Traffic Allowed)");
    console.log(`   → Open app: http://127.0.0.1:${port}`);

    try {
      const { startTikTokFeedPopulatorJob } =
        await import("./services/tiktok-feed-populator-job.js");
      startTikTokFeedPopulatorJob();
      const { startFeedReplenishJob } =
        await import("./services/feed-replenish-tikapi.js");
      startFeedReplenishJob();
    } catch (jobErr: unknown) {
      const msg = jobErr instanceof Error ? jobErr.message : String(jobErr);
      console.warn("⚠️ [Startup] TikTok feed job not started:", msg);
    }
  } catch (error) {
    console.error("❌ Failed to start server logic:", error);
    // Don't exit, let the server run 503s so we can see logs
  }
})();

// Graceful shutdown to prevent hanging processes
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  try {
    const { shutdownScoringEngine } = await import("./scoring/integration.js");
    await shutdownScoringEngine();
  } catch (err) {
    console.error("🚨 [Scoring] Error during shutdown:", err);
  }
  if (server) server.close(() => console.log("HTTP server closed"));
});
// deploy trigger 1774728117
