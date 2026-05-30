import express from "express";
import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "../utils/logger.js";

const execAsync = promisify(exec);
const router = express.Router();

/**
 * Max API Routes
 *
 * Endpoints for Max (WhatsApp Production Manager) to execute Zyeuté commands
 *
 * Authentication: Uses MAX_API_TOKEN header
 * Phone: +15143481161
 */

// Middleware: Verify Max API Token
function verifyMaxAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const authToken = req.headers.authorization || req.headers["x-max-api-token"];
  const expectedToken = process.env.MAX_API_TOKEN;

  if (!expectedToken) {
    logger.warn("[MaxAPI] MAX_API_TOKEN not set - Max API disabled");
    return res.status(503).json({
      error: "Max API not configured",
      message: "MAX_API_TOKEN environment variable not set",
    });
  }

  if (authToken !== expectedToken) {
    logger.warn("[MaxAPI] Unauthorized request attempt");
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid Max API token",
    });
  }

  next();
}

/**
 * GET /api/max/status
 *
 * Health check endpoint for Max
 * Returns overall system status
 */
router.get("/status", verifyMaxAuth, async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      system: "Zyeuté Colony OS",
      status: "operational",
      components: {
        backend: "online",
        database: "unknown", // Could check DB connection
        gcs: "unknown", // Could check GCS
        vertexAI: "unknown", // Could check Vertex AI
        dialogflowCX: "unknown", // Could check Dialogflow
      },
    };

    // Quick health checks
    try {
      // Check database (if available)
      // const dbStatus = await checkDatabase();
      // status.components.database = dbStatus ? "online" : "offline";
    } catch (error) {
      status.components.database = "error";
    }

    logger.info("[MaxAPI] Status check requested");
    res.json(status);
  } catch (error: any) {
    logger.error("[MaxAPI] Status check failed:", error);
    res.status(500).json({
      error: "Status check failed",
      message: error.message,
    });
  }
});

/**
 * GET /api/max/verify-gcs
 *
 * Run GCS verification script
 * Max command: "verify:gcs" or "check gcs"
 */
router.get("/verify-gcs", verifyMaxAuth, async (req, res) => {
  try {
    logger.info("[MaxAPI] GCS verification requested by Max");

    // Run GCS verification script
    const { stdout, stderr } = await execAsync("npm run verify:gcs");

    res.json({
      status: "success",
      command: "verify:gcs",
      timestamp: new Date().toISOString(),
      output: stdout,
      errors: stderr || null,
    });
  } catch (error: any) {
    logger.error("[MaxAPI] GCS verification failed:", error);
    res.status(500).json({
      status: "error",
      command: "verify:gcs",
      error: error.message,
    });
  }
});

/**
 * GET /api/max/security-audit
 *
 * Run security audit
 * Max command: "scan the hive" or "security audit"
 */
router.get("/security-audit", verifyMaxAuth, async (req, res) => {
  try {
    logger.info("[MaxAPI] Security audit requested by Max");

    // Run security audit script
    const { stdout, stderr } = await execAsync("npm run audit:security");

    res.json({
      status: "success",
      command: "security-audit",
      timestamp: new Date().toISOString(),
      output: stdout,
      errors: stderr || null,
    });
  } catch (error: any) {
    // Security audit might exit with code 1 if issues found
    const output = error.stdout || "";
    const hasIssues = error.code === 1;

    res.json({
      status: hasIssues ? "issues_found" : "error",
      command: "security-audit",
      timestamp: new Date().toISOString(),
      output: output || error.message,
      hasIssues,
    });
  }
});

/**
 * GET /api/max/verify-service-account
 *
 * Verify Service Account configuration
 * Max command: "check service account" or "verify credentials"
 */
router.get("/verify-service-account", verifyMaxAuth, async (req, res) => {
  try {
    logger.info("[MaxAPI] Service Account verification requested by Max");

    const { stdout, stderr } = await execAsync(
      "npm run verify:service-account",
    );

    res.json({
      status: "success",
      command: "verify-service-account",
      timestamp: new Date().toISOString(),
      output: stdout,
      errors: stderr || null,
    });
  } catch (error: any) {
    res.json({
      status: "error",
      command: "verify-service-account",
      timestamp: new Date().toISOString(),
      output: error.stdout || error.message,
      errors: error.stderr || null,
    });
  }
});

/**
 * POST /api/max/command
 *
 * Generic command handler for Max
 * Supports various Zyeuté commands
 */
router.post("/command", verifyMaxAuth, async (req, res) => {
  try {
    const { command, args } = req.body;

    if (!command) {
      return res.status(400).json({
        error: "Command required",
        message: "Provide 'command' field in request body",
      });
    }

    logger.info(`[MaxAPI] Command received: ${command}`, args);

    let result: any = {};

    switch (command.toLowerCase()) {
      case "verify:gcs":
      case "check gcs":
      case "gcs": {
        const { stdout: gcsOutput } = await execAsync("npm run verify:gcs");
        result = {
          status: "success",
          output: gcsOutput,
        };
        break;
      }

      case "security-audit":
      case "scan hive":
      case "scan": {
        const { stdout: auditOutput } = await execAsync(
          "npm run audit:security",
        );
        result = {
          status: "success",
          output: auditOutput,
        };
        break;
      }

      case "status":
      case "health":
        result = {
          status: "success",
          output: "System operational",
          timestamp: new Date().toISOString(),
        };
        break;

      default:
        return res.status(400).json({
          error: "Unknown command",
          message: `Command '${command}' not recognized`,
          availableCommands: [
            "verify:gcs",
            "security-audit",
            "status",
            "verify-service-account",
          ],
        });
    }

    res.json({
      command,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    logger.error("[MaxAPI] Command execution failed:", error);
    res.status(500).json({
      error: "Command execution failed",
      message: error.message,
    });
  }
});

export default router;
