import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";

// Create Express app for Vercel serverless
const app = express();

// Trust proxy for Vercel
app.set("trust proxy", 1);

// Session configuration (using memory store for serverless - consider Redis for production)
const sessionSecret = process.env.SESSION_SECRET || "dev-secret-change-in-production";

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    name: "zyeute.sid",
  })
);

// Parse JSON with raw body for Stripe webhooks
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
  })
);

app.use(express.urlencoded({ extended: false }));

// CORS for API routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.header(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Register all routes
const httpServer = createServer(app);

// Initialize routes (async IIFE)
let routesInitialized = false;
const initRoutes = async () => {
  if (!routesInitialized) {
    await registerRoutes(httpServer, app);
    routesInitialized = true;
  }
};

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API Error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Vercel serverless handler
export default async function handler(req: Request, res: Response) {
  await initRoutes();
  return app(req, res);
}

// Export for Vercel
export const config = {
  api: {
    bodyParser: false, // We handle body parsing ourselves for Stripe webhooks
  },
};
