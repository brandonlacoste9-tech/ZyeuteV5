import dotenv from "dotenv";
// Load .env ONLY in development (Railway provides env vars directly in production)
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
  dotenv.config({ path: ".env.local", override: true });
  console.log("🔧 [Dev] Loaded .env files");
} else {
  console.log(
    "🚂 [Production] Using Railway environment variables (skipping .env)",
  );
}
// Log but do NOT exit — keep server up so one bad error doesn't kill the process.
// Use a process manager (e.g. Railway, PM2) to restart if needed.
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception (server staying up):", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection (server staying up):", reason, promise);
});
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import tiGuyRouter from "./routes/tiguy.js";
import hiveRouter from "./routes/hive.js";
import { createServer } from "http";
import pg from "pg";
import { Server as SocketIOServer } from "socket.io";
import { db, pool } from "./storage.js";
import { posts } from "../shared/schema.js";
import { migrate } from "drizzle-orm/node-postgres/migrator";

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
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        console.log(`[CORS] Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
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
    origin: true,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

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

    const { default: debugRouter } = await import("./routes/debug.js");
    app.use("/api/debug", debugRouter);
    app.use("/api/tiguy", tiGuyRouter);
    app.use("/api/hive", hiveRouter);

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
      const { setupVite } = await import("./vite.js");
      await setupVite(httpServer, app);
    }

    // 3. Mark System Ready
    isSystemReady = true;
    console.log("🚀 ZYEUTÉ IS FULLY ARMED AND OPERATIONAL! (Traffic Allowed)");
    console.log(`   → Open app: http://127.0.0.1:${port}`);
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
