/**
 * Colony OS - Queen Bee Server
 * HTTP server for Cloud Run deployment
 * Exposes SwarmOrchestrator as a REST API
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { swarmOrchestrator } from "./lib/SwarmOrchestrator.js";
// BigQuery logging (optional, only if in Google Cloud)
let WaxLedger: any;
try {
  const module = await import("./lib/google-cloud/bigquery-logging.js");
  WaxLedger = module.WaxLedger;
} catch {
  // BigQuery not available, continue without it
  WaxLedger = null;
}

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (required for Cloud Run)
app.get("/health", async (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "queen-bee",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Ready check endpoint
app.get("/ready", async (_req: Request, res: Response) => {
  try {
    // Check if orchestrator is initialized
    const isReady = swarmOrchestrator !== undefined;
    res.status(isReady ? 200 : 503).json({
      status: isReady ? "ready" : "not ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: "error",
      error: error.message,
    });
  }
});

// Execute directive endpoint
app.post("/execute", async (req: Request, res: Response) => {
  try {
    const { directive } = req.body;

    if (!directive || typeof directive !== "string") {
      return res.status(400).json({
        error: "Missing or invalid directive",
      });
    }

    console.log(
      `📥 [API] Directive received: ${directive.substring(0, 50)}...`,
    );

    const result = await swarmOrchestrator.executeDirective(directive);

    // Stream telemetry to BigQuery if configured (lazy load)
    if (process.env.GOOGLE_CLOUD_PROJECT) {
      try {
        const { WaxLedger } =
          await import("./lib/google-cloud/bigquery-logging.js");
        const ledger = new WaxLedger(process.env.GOOGLE_CLOUD_PROJECT);
        for (const entry of result.telemetry) {
          await ledger.log({
            timestamp: entry.timestamp.toISOString(),
            unit: entry.unit,
            message: entry.message,
            action: entry.action,
            success: result.success,
            iteration: entry.iteration,
            mission_id: `mission-${Date.now()}`,
          });
        }
      } catch (error) {
        console.error("⚠️ [WAX LEDGER] Failed to log telemetry:", error);
        // Don't fail the request if logging fails
      }
    }

    res.json(result);
  } catch (error: any) {
    console.error("❌ [API] Error executing directive:", error);
    res.status(500).json({
      error: error.message,
      success: false,
    });
  }
});

// Get telemetry history
app.get("/telemetry", (_req: Request, res: Response) => {
  try {
    const history = swarmOrchestrator.getTelemetryHistory();
    res.json({
      count: history.length,
      telemetry: history,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// Initialize server
async function startServer() {
  try {
    // Initialize SwarmOrchestrator
    const projectRoot = process.cwd();
    await swarmOrchestrator.initialize({
      allowedPaths: [projectRoot],
    });

    // Start HTTP server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`👑 [QUEEN BEE] Server running on port ${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🚀 Execute endpoint: http://localhost:${PORT}/execute`);
    });
  } catch (error) {
    console.error("❌ [QUEEN BEE] Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("👑 [QUEEN BEE] SIGTERM received, shutting down gracefully...");
  await swarmOrchestrator.shutdown();
  process.exit(0);
});

// Start the server
startServer();
