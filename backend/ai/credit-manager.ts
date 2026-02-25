/**
 * 💰 AI Credit Manager
 * Tracks and manages AI service credits with automatic cutoff
 * Prevents unexpected charges when credits run out
 */

import { logger } from "../utils/logger.js";

interface CreditConfig {
  initialAmount: number;
  warningThreshold: number; // Alert when below this
  cutoffThreshold: number; // Stop service when below this
  currency: string;
}

interface CreditUsage {
  service: string;
  estimatedCost: number;
  timestamp: Date;
  endpoint: string;
}

// Credit configurations for each service
const CREDIT_CONFIGS: Record<string, CreditConfig> = {
  "dialogflow-cx": {
    initialAmount: 813.16,
    warningThreshold: 100.0,
    cutoffThreshold: 10.0,
    currency: "USD",
  },
  "genai-app-builder": {
    initialAmount: 1367.95,
    warningThreshold: 100.0,
    cutoffThreshold: 10.0,
    currency: "USD",
  },
  "vertex-ai": {
    initialAmount: 0, // No trial credits - use sparingly
    warningThreshold: 0,
    cutoffThreshold: 0,
    currency: "USD",
  },
};

// Estimated costs per request (USD)
const COST_ESTIMATES: Record<string, number> = {
  // Dialogflow CX (per session/interaction)
  "dialogflow-cx-text": 0.002, // ~$2 per 1000 text sessions
  "dialogflow-cx-audio": 0.006, // ~$6 per 1000 audio sessions

  // GenAI App Builder (per 1000 characters/image)
  "genai-image-analysis": 0.005, // ~$5 per 1000 images
  "genai-text-generation": 0.001, // ~$1 per 1000 chars

  // Vertex AI (fallback - more expensive)
  "vertex-gemini-flash": 0.0005, // $0.50 per 1M tokens
  "vertex-gemini-pro": 0.0035, // $3.50 per 1M tokens
};

// In-memory usage tracking (would use Redis/DB in production)
const usageLog: CreditUsage[] = [];
const estimatedRemaining: Record<string, number> = {
  "dialogflow-cx": CREDIT_CONFIGS["dialogflow-cx"].initialAmount,
  "genai-app-builder": CREDIT_CONFIGS["genai-app-builder"].initialAmount,
  "vertex-ai": 0,
};

const warningSent = {
  "dialogflow-cx": false,
  "genai-app-builder": false,
  "vertex-ai": false,
};

/**
 * Check if a service has available credits
 */
export function hasCredits(service: string): boolean {
  const config = CREDIT_CONFIGS[service];
  if (!config) return false;

  return estimatedRemaining[service] > config.cutoffThreshold;
}

/**
 * Record credit usage for a service
 */
export function recordUsage(
  service: string,
  requestType: string,
  endpoint: string,
): void {
  const cost = COST_ESTIMATES[requestType] || 0.001;

  // Deduct from estimated remaining
  if (estimatedRemaining[service] !== undefined) {
    estimatedRemaining[service] -= cost;
  }

  // Log usage
  usageLog.push({
    service,
    estimatedCost: cost,
    timestamp: new Date(),
    endpoint,
  });

  // Check thresholds
  checkThresholds(service);
}

/**
 * Check credit thresholds and send warnings
 */
function checkThresholds(service: string): void {
  const config = CREDIT_CONFIGS[service];
  const remaining = estimatedRemaining[service];

  if (!config) return;

  // Critical cutoff - stop all requests
  if (remaining <= config.cutoffThreshold) {
    logger.error(
      `🛑 [CreditManager] ${service.toUpperCase()} CREDITS DEPLETED! ` +
        `Remaining: $${remaining.toFixed(2)}. Service DISABLED.`,
    );
    return;
  }

  // Warning threshold
  if (remaining <= config.warningThreshold && !warningSent[service]) {
    logger.warn(
      `⚠️ [CreditManager] ${service.toUpperCase()} CREDITS RUNNING LOW! ` +
        `Remaining: $${remaining.toFixed(2)}. Top up soon!`,
    );
    warningSent[service] = true;
  }
}

/**
 * Check if a request should be allowed
 * Returns { allowed, reason }
 */
export function checkRequestAllowed(
  service: string,
  requestType: string,
): { allowed: boolean; reason?: string } {
  const config = CREDIT_CONFIGS[service];
  const remaining = estimatedRemaining[service];

  if (!config) {
    return { allowed: false, reason: `Unknown service: ${service}` };
  }

  // Check if credits depleted
  if (remaining <= config.cutoffThreshold) {
    return {
      allowed: false,
      reason:
        `🛑 ${service} credits depleted. Remaining: $${remaining.toFixed(2)}. ` +
        `Please add credits to continue using AI features.`,
    };
  }

  return { allowed: true };
}

/**
 * Get credit status for all services
 */
export function getCreditStatus(): Record<string, any> {
  return Object.keys(CREDIT_CONFIGS).map((service) => {
    const config = CREDIT_CONFIGS[service];
    const remaining = estimatedRemaining[service];
    const used = config.initialAmount - remaining;
    const percentRemaining =
      config.initialAmount > 0 ? (remaining / config.initialAmount) * 100 : 0;

    return {
      service,
      initial: config.initialAmount,
      used: Math.max(0, used),
      remaining: Math.max(0, remaining),
      percentRemaining: percentRemaining.toFixed(1),
      status:
        remaining <= config.cutoffThreshold
          ? "DEPLETED"
          : remaining <= config.warningThreshold
            ? "LOW"
            : "HEALTHY",
      cutoffAt: config.cutoffThreshold,
    };
  });
}

/**
 * Middleware to check credits before processing AI requests
 */
export function creditCheckMiddleware(service: string, requestType: string) {
  return (req: any, res: any, next: any) => {
    const check = checkRequestAllowed(service, requestType);

    if (!check.allowed) {
      logger.warn(
        `[CreditManager] Blocked ${service} request: ${check.reason}`,
      );
      return res.status(503).json({
        error: "AI Service Unavailable",
        message: check.reason,
        credits: getCreditStatus(),
        fallback: {
          message:
            "Désolé, les crédits AI sont épuisés! Réessaie plus tard. 🦫",
          suggestion: "Contact support to add more credits.",
        },
      });
    }

    // Record usage after request (estimate)
    recordUsage(service, requestType, req.path);

    next();
  };
}

/**
 * Get usage statistics
 */
export function getUsageStats(): any {
  const last24h = usageLog.filter(
    (u) => new Date().getTime() - u.timestamp.getTime() < 24 * 60 * 60 * 1000,
  );

  const byService: Record<string, { count: number; cost: number }> = {};
  last24h.forEach((u) => {
    if (!byService[u.service]) {
      byService[u.service] = { count: 0, cost: 0 };
    }
    byService[u.service].count++;
    byService[u.service].cost += u.estimatedCost;
  });

  return {
    last24Hours: {
      totalRequests: last24h.length,
      totalEstimatedCost: last24h.reduce((sum, u) => sum + u.estimatedCost, 0),
      byService,
    },
    creditStatus: getCreditStatus(),
  };
}

// Log initial status
logger.info("[CreditManager] Initialized with credit limits:");
Object.keys(CREDIT_CONFIGS).forEach((service) => {
  const config = CREDIT_CONFIGS[service];
  logger.info(
    `  ${service}: $${config.initialAmount} ` +
      `(warn at $${config.warningThreshold}, cutoff at $${config.cutoffThreshold})`,
  );
});
