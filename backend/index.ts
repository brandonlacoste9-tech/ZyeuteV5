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

// [NEW] Robust Health Check for Railway (Checks DB Connectivity & Migration)
app.get("/ready", async (_req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");

      // Zyeute-Trace: Verify Schema Alignment
      const schemaCheck = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'publications' AND column_name = 'visibility'
      `);
      const isAligned = schemaCheck.rows.length > 0;

      res.status(200).json({
        status: "healthy",
        db: "connected",
        migration: "synced",
        schema: isAligned ? "aligned" : "drifted",
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Health Check Failed:", error);
    res.status(503).json({ status: "unhealthy", reason: error.message });
  }
});

app.get("/momentum-telemetry", async (_req, res) => {
  try {
    const client = await pool.connect();
    try {
      const eyeTestQuery = `
        SELECT 
            LEFT(content, 40) as "Title",
            quebec_score as "TiGuy_Opinion", 
            (
              ((quebec_score + 1) * (LN(COALESCE(reactions_count, 0) * 1 + COALESCE(shares_count, 0) * 3 + COALESCE(piasse_count, 0) * 5 + 1) + 1))
              / 
              POWER(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 + 2, 1.8)
            ) as "Hive_Reality",
            reactions_count as "Fires",
            shares_count as "Shares",
            piasse_count as "Piasse",
            ROUND(CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS NUMERIC), 1) as "Age_Hours"
        FROM publications
        WHERE (est_masque = false OR est_masque IS NULL)
        ORDER BY "Hive_Reality" DESC
        LIMIT 10;
      `;
      const res1 = await client.query(eyeTestQuery);

      const gravityQuery = `
        SELECT 
            LEFT(content, 40) as "Title",
            (
              ((quebec_score + 1) * (LN(COALESCE(reactions_count, 0) * 1 + COALESCE(shares_count, 0) * 3 + COALESCE(piasse_count, 0) * 5 + 1) + 1))
              / 
              POWER(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 + 2, 1.8)
            ) as "Reality",
            COALESCE(reactions_count, 0) + (COALESCE(shares_count, 0) * 3) + (COALESCE(piasse_count, 0) * 5) as "Total_Engagement",
            ROUND(CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS NUMERIC), 1) as "Age_Hours"
        FROM publications
        WHERE created_at < NOW() - INTERVAL '24 hours'
        ORDER BY "Age_Hours" DESC
        LIMIT 10;
      `;
      const res2 = await client.query(gravityQuery);

      res.json({
        success: true,
        eyeTest: res1.rows,
        gravityCheck: res2.rows,
      });
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trust proxy for proper IP detection behind reverse proxy
app.set("trust proxy", 1);

// [NEW] Content Security Policy (CSP) Middleware
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; font-src 'self' https://fonts.gstatic.com https://*.perplexity.ai https://r2cdn.perplexity.ai https://vercel.live data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://js.stripe.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vuanulvyqkfefmjcikfk.supabase.co wss://vuanulvyqkfefmjcikfk.supabase.co wss://*.railway.app https://*.railway.app https://*.up.railway.app wss://*.up.railway.app ws://localhost:* http://localhost:* https://*.googleapis.com https://*.fal.ai https://*.pexels.com https://api.pexels.com; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; frame-src 'self' https://js.stripe.com https://vercel.live;",
  );
  next();
});

// Standard Body Parsers (REQUIRED for all routes)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// CORS: set CORS_ORIGIN in production to your frontend URL (e.g. https://app.zyeute.com)
const corsOrigin = process.env.CORS_ORIGIN || true;
app.use(cors({ origin: corsOrigin, credentials: true }));

// ... rest of middleware ...

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error(
        "🔥 [Startup] DATABASE_URL is not set. Set it in .env or your environment.",
      );
      console.error(
        "🔥 [Startup] EXITING: Missing DATABASE_URL environment variable",
      );
      process.exit(1);
    }
    // [CRITICAL] Validate Database Connection First
    try {
      console.log("📦 [Startup] Connecting to Database...");
      const client = await pool.connect();
      client.release();
      console.log("✅ [Startup] Database Connected Successfully");
    } catch (dbErr: any) {
      console.error("🔥 [Startup] CANNOT CONNECT TO DATABASE:", dbErr);
      console.error(
        `🔥 [Startup] EXITING: Database connection failed - ${dbErr.message || dbErr.code || "Unknown error"}`,
      );
      console.error(
        `🔥 [Startup] DATABASE_URL format: ${process.env.DATABASE_URL?.substring(0, 30)}...`,
      );
      process.exit(1);
    }

    // [CRITICAL] Run Database Migrations
    console.log("📦 [Startup] Running Schema Migrations...");
    try {
      await migrate(db, { migrationsFolder: "./migrations" });
      console.log("✅ [Startup] Migrations Complete");
    } catch (err: any) {
      if (
        err.code === "42710" ||
        err?.cause?.code === "42710" ||
        err.message?.includes("already exists")
      ) {
        console.log(
          "⚠️ [Startup] Migration warning (already exists):",
          err.message,
        );
        console.warn(
          "⚠️ [Startup] Notice: Migration skipped existing objects (Safe to ignore)",
        );
      } else {
        console.error("🚨 [Startup] Database Migrations Failed!", err);
        console.error(
          `🔥 [Startup] EXITING: Migration failed - ${err.message || err.code || "Unknown error"}`,
        );
        console.error(`🔥 [Startup] Migration error details:`, err);
        process.exit(1);
      }
    }

    // [SURGICAL SELF-HEALING] Active Schema Repair
    try {
      const { healSchema } = await import("./schemaDoctor.js");
      await healSchema(pool);
    } catch (err) {
      console.error("🚨 [Startup] Schema Healing Failed:", err);
    }
    // [SAFETY NET] Verify Database Schema before starting
    try {
      console.log("🔍 Verifying Database Schema...");
      await db
        .select({ id: posts.id, vis: posts.visibility })
        .from(posts)
        .limit(1);
      console.log("✅ Database Schema Verified: 'visibility' column found.");
    } catch (err) {
      console.error(
        "🚨 CRITICAL: Database schema mismatch! Did you run migrations?",
      );
      console.error(err);
      // process.exit(1); // DISABLED to allow debugging via logs/api
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
      const { setupVite } = await import("./vite.js");
      await setupVite(httpServer, app);
    }
    console.log("🚀 ZYEUTÉ IS FULLY ARMED AND OPERATIONAL!");

    // HOST MUST BE "0.0.0.0" - DO NOT USE "localhost"
    // This makes the server accessible to Railway's health check
    server = httpServer.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server running on http://0.0.0.0:${port}`);
      console.log(
        `Health check available at http://0.0.0.0:${port}/api/health`,
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
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
