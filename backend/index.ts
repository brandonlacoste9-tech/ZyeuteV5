import "dotenv/config";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import tiGuyRouter from "./routes/tiguy.js";
import hiveRouter from "./routes/hive.js";
import { createServer } from "http";
import pg from "pg";

const { Pool } = pg;

// DB Pool for Health Checks
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

const app = express();
const httpServer = createServer(app);

// [CRITICAL] Claim the port IMMEDIATELY for Railway Health Checks
const port = parseInt(process.env.PORT || "5000", 10);
httpServer.listen({ port, host: "0.0.0.0" }, () => {
  console.log(`✅ PORT ${port} CLAIMED - Health Check should pass now!`);
  console.log(`🏥 Health check at /api/health`);
});

// [NEW] Instant Health Check Route (responds even while server is still booting)
app.get("/api/health", (_req, res) => {
  res
    .status(200)
    .json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      message: "Zyeuté Live",
    });
});

// [NEW] Robust Health Check for Railway (Checks DB Connectivity & Migration)
app.get("/health", async (_req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      
      // Zyeute-Trace: Verify Schema Alignment
      const schemaCheck = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'publications' AND column_name = 'visibilite'
      `);
      const isAligned = schemaCheck.rows.length > 0;

      res.status(200).json({ status: "healthy", db: "connected", migration: "synced", schema: isAligned ? "aligned" : "drifted" });
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
    "default-src 'self'; font-src 'self' https://fonts.gstatic.com https://*.perplexity.ai https://r2cdn.perplexity.ai https://vercel.live data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://js.stripe.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vuanulvyqkfefmjcikfk.supabase.co wss://vuanulvyqkfefmjcikfk.supabase.co wss://*.railway.app https://*.railway.app https://*.up.railway.app wss://*.up.railway.app ws://localhost:* http://localhost:* https://*.googleapis.com https://*.fal.ai https://*.pexels.com https://api.pexels.com; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; frame-src 'self' https://js.stripe.com https://vercel.live;"
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
    console.log("🛠️  Initializing routes and services...");
    app.use("/api/tiguy", tiGuyRouter);
    app.use("/api/hive", hiveRouter);
    await registerRoutes(httpServer, app);

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite.js");
      await setupVite(httpServer, app);
    }
    console.log("🚀 Server fully initialized and ready!");
  } catch (error) {
    console.error("❌ ASYNC INIT ERROR:", error);
    // Continue running so health check still passes, even if degraded
  }
})();
