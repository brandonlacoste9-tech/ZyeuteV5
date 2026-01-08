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
import { initSentry, setUserContext, captureException } from "./utils/sentry.js";
import { synapseBridge } from "./colony/synapse-bridge.js";

// Initialize Sentry early
initSentry();

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
    // Initialize Colony OS Synapse Bridge
    if (process.env.COLONY_OS_URL) {
      await synapseBridge.connect();
      synapseBridge.on("connected", async () => {
        console.log("✅ Colony OS Synapse Bridge connected");
        
        // Initialize Bee System
        const { beeSystem } = await import("./colony/bee-system.js");
        const { hiveManager } = await import("./colony/hive-manager.js");
        const { learningSystem } = await import("./colony/learning-system.js");
        const { initializeVertexAILearning } = await import("./colony/vertex-learning-integration.js");
        const { mlopsPipelines } = await import("./colony/mlops-pipelines.js");
        const { featureStore } = await import("./colony/feature-store.js");
        
        // Initialize Vertex AI Learning System
        await initializeVertexAILearning();
        
        // Initialize Governance Engine and Observability Dashboard
        const { governanceEngine } = await import("./colony/governance-engine.js");
        const { observabilityDashboard } = await import("./colony/observability-dashboard.js");
        const { bugBot } = await import("./colony/bugbot.js");
        
        // MLOps Pipelines and Feature Store are auto-initialized
        console.log(`🚀 MLOps Pipelines ready`);
        console.log(`📊 Feature Store initialized`);
        console.log(`🛡️ Governance Engine initialized`);
        console.log(`👑 Observability Dashboard ready`);
        console.log(`🐛 BugBot initialized`);
        
        // Register all bees from registry
        const { BEE_REGISTRY } = await import("./ai/bee-registry.js");
        for (const [beeId, bee] of Object.entries(BEE_REGISTRY)) {
          await beeSystem.registerBee(beeId, bee.capabilities);
        }
        
        // Discover other hives
        await hiveManager.discoverHives();
        
        console.log(`🐝 Bee System initialized with ${Object.keys(BEE_REGISTRY).length} bees`);
        console.log(`🧠 Learning System initialized`);
      });
      synapseBridge.on("disconnected", () => {
        console.warn("⚠️ Colony OS Synapse Bridge disconnected");
      });
      synapseBridge.on("connection_failed", () => {
        console.warn("⚠️ Colony OS Synapse Bridge connection failed - operating in standalone mode");
      });
    } else {
      console.log("ℹ️ Colony OS URL not configured, skipping Synapse Bridge");
    }

    // Initialize Windows Automation Service
    if (process.env.WINDOWS_USE_BRIDGE_ENABLED !== "false") {
      try {
        const { automationService } = await import("./services/automation-service.js");
        await automationService.initialize();
        console.log("🤖 Windows Automation Service initialized");
        automationService.on("initialized", () => {
          console.log("✅ Windows Automation Bridge is ready");
        });
      } catch (error: any) {
        console.warn(`⚠️ Failed to initialize Windows Automation Service: ${error.message}`);
        console.warn("   Automation features will be unavailable");
      }
    } else {
      console.log("ℹ️ Windows Automation Bridge disabled");
    }

    app.use("/api/tiguy", tiGuyRouter);
    await registerRoutes(httpServer, app);

    // Sentry middleware for user context (before routes)
    app.use((req: Request, _res: Response, next: NextFunction) => {
      if (req.userId) {
        setUserContext(req.userId, {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        });
      }
      next();
    });

    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Capture error in Sentry
      captureException(err, {
        tags: {
          endpoint: req.path,
          method: req.method,
          status_code: status.toString(),
        },
        extra: {
          userId: req.userId,
          body: req.body,
          query: req.query,
        },
        userId: req.userId,
      });
      
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

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  synapseBridge.disconnect();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  synapseBridge.disconnect();
  process.exit(0);
});
