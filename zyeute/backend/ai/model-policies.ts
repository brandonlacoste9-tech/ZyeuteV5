/**
 * Model Policies
 * Define which AI model to use for different routes/use cases
 * Enables fine-grained control: "DMs always use Flash", "Enhance uses Pro", etc.
 */

import type { GeminiModel } from "./circuit-breaker.js";
import { logger } from "../utils/logger.js";

export type UseCase =
  | "chat"              // General chat (DMs, conversations)
  | "content"           // Content generation (posts, captions)
  | "enhancement"       // Media enhancement (video, image)
  | "moderation"        // Content moderation
  | "onboarding"        // User onboarding flows
  | "customer_service"  // Support/help
  | "analytics"         // Analytics summaries
  | "studio"            // Creative studio features
  | "default";          // Fallback

export interface ModelPolicy {
  primaryModel: GeminiModel;
  fallbackModel: GeminiModel;
  requireCredits?: number;      // Minimum credits to use primary
  priority: "speed" | "quality" | "cost" | "balanced";
  allowCircuitBreaker: boolean; // Can circuit breaker override?
}

/**
 * Model Policies Configuration
 * Define which model to use for each use case
 */
export const MODEL_POLICIES: Record<UseCase, ModelPolicy> = {
  // Chat/DMs: Fast, cheap, reliable
  chat: {
    primaryModel: "gemini-2.0-flash",
    fallbackModel: "gemini-2.0-flash", // Same model = no circuit breaker needed
    requireCredits: 0,
    priority: "speed",
    allowCircuitBreaker: false, // Flash is already the fallback
  },

  // Content generation: Balanced quality/speed
  content: {
    primaryModel: "gemini-1.5-pro",
    fallbackModel: "gemini-2.0-flash",
    requireCredits: 10,
    priority: "balanced",
    allowCircuitBreaker: true,
  },

  // Media enhancement: High quality, can be slower
  enhancement: {
    primaryModel: "gemini-1.5-pro",
    fallbackModel: "gemini-2.0-flash",
    requireCredits: 20,
    priority: "quality",
    allowCircuitBreaker: true,
  },

  // Moderation: Fast, reliable, cost-effective
  moderation: {
    primaryModel: "gemini-2.0-flash",
    fallbackModel: "gemini-2.0-flash",
    requireCredits: 0,
    priority: "cost",
    allowCircuitBreaker: false,
  },

  // Onboarding: Fast, friendly, cost-effective
  onboarding: {
    primaryModel: "gemini-2.0-flash",
    fallbackModel: "gemini-2.0-flash",
    requireCredits: 0,
    priority: "speed",
    allowCircuitBreaker: false,
  },

  // Customer service: Balanced, reliable
  customer_service: {
    primaryModel: "gemini-2.0-flash",
    fallbackModel: "gemini-2.0-flash",
    requireCredits: 0,
    priority: "balanced",
    allowCircuitBreaker: false,
  },

  // Analytics: Quality summaries
  analytics: {
    primaryModel: "gemini-1.5-pro",
    fallbackModel: "gemini-2.0-flash",
    requireCredits: 15,
    priority: "quality",
    allowCircuitBreaker: true,
  },

  // Studio: Premium quality for creative work
  studio: {
    primaryModel: "gemini-1.5-pro",
    fallbackModel: "gemini-2.0-flash",
    requireCredits: 25,
    priority: "quality",
    allowCircuitBreaker: true,
  },

  // Default: Balanced approach
  default: {
    primaryModel: "gemini-2.0-flash",
    fallbackModel: "gemini-2.0-flash",
    requireCredits: 0,
    priority: "balanced",
    allowCircuitBreaker: false,
  },
};

/**
 * Get model policy for a use case
 */
export function getModelPolicy(useCase: UseCase = "default"): ModelPolicy {
  return MODEL_POLICIES[useCase] || MODEL_POLICIES.default;
}

/**
 * Select model based on policy and user credits
 */
export function selectModelFromPolicy(
  useCase: UseCase,
  userCredits: number = 0
): {
  model: GeminiModel;
  policy: ModelPolicy;
  reason: string;
} {
  const policy = getModelPolicy(useCase);

  // Check if user has enough credits for primary model
  if (userCredits >= (policy.requireCredits || 0)) {
    return {
      model: policy.primaryModel,
      policy,
      reason: `Policy: ${useCase} requires ${policy.primaryModel} (credits: ${userCredits})`,
    };
  }

  // Fall back to fallback model
  logger.debug(
    `[ModelPolicy] Insufficient credits for ${useCase}. Using ${policy.fallbackModel} instead of ${policy.primaryModel}`
  );

  return {
    model: policy.fallbackModel,
    policy,
    reason: `Policy: ${useCase} fallback due to insufficient credits (${userCredits} < ${policy.requireCredits})`,
  };
}

/**
 * Route-to-UseCase mapping
 * Maps API routes to their use case for automatic policy selection
 */
export const ROUTE_USE_CASES: Record<string, UseCase> = {
  // Chat routes
  "/api/ai/tiguy-chat": "chat",
  "/api/tiguy/chat": "chat",
  "/api/chat": "chat",
  "/api/messages": "chat",

  // Content routes
  "/api/posts": "content",
  "/api/posts/create": "content",
  "/api/captions": "content",
  "/api/generate": "content",

  // Enhancement routes
  "/api/enhance": "enhancement",
  "/api/studio/enhance": "enhancement",
  "/api/video/process": "enhancement",
  "/api/image/enhance": "enhancement",

  // Moderation routes
  "/api/moderation": "moderation",
  "/api/mod": "moderation",
  "/api/content/check": "moderation",

  // Onboarding routes
  "/api/onboarding": "onboarding",
  "/api/setup": "onboarding",

  // Customer service routes
  "/api/support": "customer_service",
  "/api/help": "customer_service",

  // Analytics routes
  "/api/analytics": "analytics",
  "/api/insights": "analytics",

  // Studio routes
  "/api/studio": "studio",
  "/api/artiste": "studio",
};

/**
 * Get use case from route path
 */
export function getUseCaseFromRoute(routePath: string): UseCase {
  // Exact match first
  if (ROUTE_USE_CASES[routePath]) {
    return ROUTE_USE_CASES[routePath];
  }

  // Prefix match
  for (const [route, useCase] of Object.entries(ROUTE_USE_CASES)) {
    if (routePath.startsWith(route)) {
      return useCase;
    }
  }

  return "default";
}

/**
 * Policy-aware model selection
 * Combines policy, credits, and circuit breaker state
 */
export interface PolicyModelSelection {
  intendedModel: GeminiModel;
  actualModel: GeminiModel;
  useCase: UseCase;
  policy: ModelPolicy;
  reason: string;
  circuitBreakerIntervened: boolean;
}

export function selectModelWithPolicy(
  useCase: UseCase,
  userCredits: number = 0,
  circuitBreakerState?: {
    model: GeminiModel;
    state: "CLOSED" | "OPEN" | "HALF_OPEN";
  }
): PolicyModelSelection {
  const policy = getModelPolicy(useCase);
  const { model: intendedModel, reason: creditReason } = selectModelFromPolicy(
    useCase,
    userCredits
  );

  // Check circuit breaker state if enabled
  let actualModel = intendedModel;
  let circuitBreakerIntervened = false;
  let reason = creditReason;

  if (
    policy.allowCircuitBreaker &&
    circuitBreakerState &&
    circuitBreakerState.model === intendedModel &&
    circuitBreakerState.state === "OPEN"
  ) {
    actualModel = policy.fallbackModel;
    circuitBreakerIntervened = true;
    reason = `Circuit breaker OPEN for ${intendedModel}, using ${actualModel}`;
  }

  return {
    intendedModel,
    actualModel,
    useCase,
    policy,
    reason,
    circuitBreakerIntervened,
  };
}

/**
 * Override policy for testing/admin
 */
let policyOverrides: Map<UseCase, ModelPolicy> = new Map();

export function setPolicyOverride(useCase: UseCase, policy: Partial<ModelPolicy>): void {
  const basePolicy = getModelPolicy(useCase);
  policyOverrides.set(useCase, { ...basePolicy, ...policy });
  logger.info(`[ModelPolicy] Override set for ${useCase}:`, policy);
}

export function clearPolicyOverride(useCase?: UseCase): void {
  if (useCase) {
    policyOverrides.delete(useCase);
  } else {
    policyOverrides.clear();
  }
  logger.info(`[ModelPolicy] Override cleared for ${useCase || "all"}`);
}

export function getPolicyWithOverrides(useCase: UseCase): ModelPolicy {
  return policyOverrides.get(useCase) || getModelPolicy(useCase);
}
