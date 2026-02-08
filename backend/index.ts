import "dotenv/config";
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason, promise);
  process.exit(1);
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

// [NEW] Startup Liveness Middleware
// Blocks traffic until DB is ready, but allows Health Check
app.use((req, res, next) => {
  // Always allow health checks - RETURN IMMEDIATELY, DO NOT USE next()
  if (req.path === "/api/health") {
    return res.status(200).json({
      status: "ok",
      stage: isSystemReady ? "ready" : "initializing",
      uptime: process.uptime(),
    });
  }

  // Debug route also overrides
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
        `Health check available at http://0.0.0.0:${port}/api/health`,
      );
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
        console.log("📦 [Startup] Running Schema Migrations...");
        try {
          await migrate(db, { migrationsFolder: "./migrations" });
          console.log("✅ [Startup] Migrations Complete");
        } catch (err: any) {
          // Log but don't crash main loop if possible, unless critical
          console.error("⚠️ [Startup] Migration warning/error:", err.message);
        }

        // [SURGICAL SELF-HEALING] Active Schema Repair
        try {
          const { healSchema } = await import("./schemaDoctor.js");
          await healSchema(pool);
        } catch (err) {
          console.warn("⚠️ [Startup] Schema healing skipped:", err);
        }
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

    console.log("🛠️  Step 2: Registering bulk routes...");
    await registerRoutes(httpServer, app);

    if (process.env.NODE_ENV === "production") {
      console.log("🛠️  Step 3: Serving static files (Production)...");
      serveStatic(app);
    } else {
      console.log("🛠️  Step 3: Setting up Vite (Development)...");
      // const { setupVite } = await import("./vite.js");
      // await setupVite(httpServer, app);
      console.log(
        "⚠️ Skipping integrated Vite server. Please run 'npx vite' for frontend.",
      );
    }

    // 3. Mark System Ready
    isSystemReady = true;
    console.log("🚀 ZYEUTÉ IS FULLY ARMED AND OPERATIONAL! (Traffic Allowed)");
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
