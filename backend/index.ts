import "./preload.js";
// [SSL SECURITY BYPASS] Required for development to allow the server to connect to Supabase/Railway certificates
if (process.env.NODE_ENV !== "production") {
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
      const { createClient } = await import("ioredis").then((m) => ({
        createClient: (url: string) => new m.default(url),
      }));
      const pubClient = createClient(redisUrl);
      const subClient = createClient(redisUrl);
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
            fetch(`http://127.0.0.1:${port}/api/seed/feed`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
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
      const { startTikTokFeedPopulatorJob } = await import(
        "./services/tiktok-feed-populator-job.js"
      );
      startTikTokFeedPopulatorJob();
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
