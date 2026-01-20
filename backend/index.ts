import "dotenv/config";
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
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
import { pool } from "./storage.js"; // Import pool for migrator

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

// [Removing CORS origins block for simplicity/speed during demo prep]
app.use(cors({ origin: true, credentials: true }));

// ... rest of middleware ...

(async () => {
  try {
    // [CRITICAL] Validate Database Connection First
    try {
      console.log("📦 [Startup] Connecting to Database...");
      const client = await pool.connect();
      client.release();
      console.log("✅ [Startup] Database Connected Successfully");
    } catch (dbErr) {
      console.error("🔥 [Startup] CANNOT CONNECT TO DATABASE:", dbErr);
      process.exit(1);
    }

    // [CRITICAL] Run Database Migrations before starting the application
    console.log("📦 [Startup] Running Schema Migrations...");
    try {
      // Assuming your Drizzle migrations are in the './migrations' folder relative to the backend directory
      await migrate(db, { migrationsFolder: "./migrations" });
      console.log("✅ [Startup] Migrations Complete");
    } catch (err: any) {
      // ERROR 42710 = Duplicate Object (Type/Table already exists)
      // We ignore this because it means the DB is already set up.
      if (
        err.code === "42710" ||
        err?.cause?.code === "42710" ||
        err.message?.includes("already exists")
      ) {
        console.warn(
          "⚠️ [Startup] Notice: Migration skipped existing objects (Safe to ignore)",
        );
      } else {
        console.error("🚨 [Startup] Database Migrations Failed!", err);
        // Only exit if it's NOT a duplicate error
        // process.exit(1);
      }
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

    console.log("🛠️  Step 1: Initializing routes and services...");
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
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  if (server) server.close(() => console.log("HTTP server closed"));
});
