import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { tracingMiddleware, getTraceContext, recordException } from "./tracer.js";

const app = express();

// Trust proxy for proper IP detection behind reverse proxy (Replit/production)
app.set("trust proxy", 1);

const httpServer = createServer(app);

// Production-ready session configuration with PostgreSQL store
const PgSession = connectPgSimple(session);
const isProduction = process.env.NODE_ENV === "production";

// Session secret - fail fast in production if not set
const sessionSecret = process.env.SESSION_SECRET;
if (isProduction && !sessionSecret) {
  console.error("FATAL: SESSION_SECRET environment variable must be set in production");
  process.exit(1);
}

// Create PostgreSQL pool for session store
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: sessionSecret || "dev-only-secret-not-for-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // Only send over HTTPS in production
      httpOnly: true, // Prevent XSS access to cookie
      sameSite: "strict", // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    name: "zyeute.sid", // Custom session cookie name
  })
);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Add tracing middleware early to capture all requests
app.use(tracingMiddleware());

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // Include trace context in logs for correlation
  const traceContext = getTraceContext();
  const traceInfo = traceContext.traceId 
    ? ` [trace:${traceContext.traceId.substring(0, 8)}]`
    : "";

  console.log(`${formattedTime} [${source}]${traceInfo} ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Record exception in trace
    recordException(err, {
      "error.status": status,
      "error.message": message,
    });

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite.js");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
