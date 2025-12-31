import "dotenv/config"; // Load environment variables from .env
import "express-async-errors";
import express, { type Request, Response, NextFunction } from "express";
// --- OpenTelemetry Tracing (Disabled temporarily due to version mismatch) ---
// import '../tracing-setup';
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import tiGuyRouter from "./routes/tiguy.js";
import { createServer } from "http";
// import { tracingMiddleware, getTraceContext, recordException } from "./tracer.js";

console.log("🚀 Starting ZyeuteV5 backend...");
console.log("📍 Environment:", process.env.NODE_ENV);
console.log("🔌 Port:", process.env.PORT || 5000);

const app = express();

// Trust proxy for proper IP detection behind reverse proxy
app.set("trust proxy", 1);

const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
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
// app.use(tracingMiddleware()); // Disabled - OTel version mismatch

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // Include trace context in logs for correlation (disabled)
  // const traceContext = getTraceContext();
  // const traceInfo = traceContext.traceId
  //   ? ` [trace:${traceContext.traceId.substring(0, 8)}]`
  //   : "";

  console.log(`${formattedTime} [${source}] ${message}`);
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
  try {
    app.use("/api/tiguy", tiGuyRouter);
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite.js");
      await setupVite(httpServer, app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
      },
      () => {
        log(`serving on port ${port}`);
        console.log(`🏥 Health check available at /api/health`);
      },
    );
  } catch (error) {
    console.error("❌ CRITICAL STARTUP ERROR:", error);
    process.exit(1);
  }
})();
