/**
 * 🦫 TI-GUY Service
 * Unified TI-GUY interface that routes to Dialogflow CX
 * Uses Dialogflow CX credits ($813.16) for all conversational AI
 */

import { DialogflowBridge } from "./dialogflow-bridge.js";
import { logger } from "../utils/logger.js";
import {
  hasCredits,
  recordUsage,
  checkRequestAllowed,
} from "./credit-manager.js";

export interface TIGuyResponse {
  response: string;
  intent?: string;
  confidence?: number;
  action?: any;
  type: "dialogflow-cx" | "fallback";
  creditsUsed: string;
}

export interface TIGuyContext {
  userId: string;
  location?: string;
  previousMessages?: string[];
  mood?: string;
}

/**
 * Main TI-GUY chat function
 * Routes to Dialogflow CX to use $813.16 credits
 * Falls back to rule-based if credits depleted
 */
export async function chatWithTIGuy(
  message: string,
  context: TIGuyContext,
): Promise<TIGuyResponse> {
  const { userId } = context;

  // Check if Dialogflow CX credits available
  const creditCheck = checkRequestAllowed(
    "dialogflow-cx",
    "dialogflow-cx-text",
  );

  if (!creditCheck.allowed) {
    logger.warn(`[TI-GUY] Dialogflow CX credits depleted, using fallback`);
    return fallbackResponse(message, context);
  }

  try {
    // Use Dialogflow CX (consumes $813.16 pool)
    const result = await DialogflowBridge.getTiGuyVoiceResponse(
      userId,
      message,
      context,
    );

    // Record credit usage
    recordUsage("dialogflow-cx", "dialogflow-cx-text", "/api/tiguy/chat");

    return {
      response: result.response,
      intent: result.intent,
      confidence: result.confidence,
      action: result.action,
      type: "dialogflow-cx",
      creditsUsed: "dialogflow-cx",
    };
  } catch (error: any) {
    logger.error("[TI-GUY] Dialogflow CX error:", error);

    // Fallback to rule-based response
    return fallbackResponse(message, context);
  }
}

/**
 * Detect intent using Dialogflow CX
 */
export async function detectTIGuyIntent(
  sessionId: string,
  query: { text?: string; audio?: Buffer },
  languageCode: string = "fr-CA",
): Promise<any> {
  // Check credits
  const creditCheck = checkRequestAllowed(
    "dialogflow-cx",
    query.audio ? "dialogflow-cx-audio" : "dialogflow-cx-text",
  );

  if (!creditCheck.allowed) {
    throw new Error(creditCheck.reason);
  }

  // Use Dialogflow CX
  const result = await DialogflowBridge.detectIntent(
    sessionId,
    query,
    languageCode,
  );

  // Record usage
  recordUsage(
    "dialogflow-cx",
    query.audio ? "dialogflow-cx-audio" : "dialogflow-cx-text",
    "/api/tiguy/detect-intent",
  );

  return result;
}

/**
 * Fallback responses when credits depleted or service unavailable
 * Quebec-themed rule-based responses
 */
function fallbackResponse(
  message: string,
  context: TIGuyContext,
): TIGuyResponse {
  const responses = [
    "Hé, j'ai un petit problème technique là! Réessaie dans un peu. 🦫",
    "Osti, les serveurs sont encombrés! Reviens vite. 🔥",
    "Ben coudonc, j'ai perconne ma connexion! Un instant... ⚡",
    "Tabarnouche, y'a du monde sur l'app! Réessaie bientôt. 🍁",
  ];

  // Simple keyword matching for better UX
  const lowerMsg = message.toLowerCase();
  let response = responses[Math.floor(Math.random() * responses.length)];

  if (lowerMsg.includes("bonjour") || lowerMsg.includes("salut")) {
    response =
      "Salut! Désolé, j'ai un petit problème technique là. Réessaie dans quelques minutes! 🦫";
  } else if (lowerMsg.includes("aide") || lowerMsg.includes("help")) {
    response =
      "J'aimerais ben t'aider, mais j'ai un problème de connexion. Réessaie bientôt! 🔧";
  } else if (lowerMsg.includes("merci")) {
    response = "Avec plaisir! (Quand je vais être de retour 😉)";
  }

  return {
    response,
    type: "fallback",
    creditsUsed: "none",
    action: {
      type: "error",
      message: "Credits depleted or service unavailable",
    },
  };
}

/**
 * Get TI-GUY health status including credits
 */
export async function getTIGuyHealth(): Promise<any> {
  const dialogflowCredits = hasCredits("dialogflow-cx");

  return {
    status: dialogflowCredits ? "healthy" : "degraded",
    service: "TI-GUY",
    backend: "Dialogflow CX",
    credits: {
      available: dialogflowCredits,
      service: "dialogflow-cx",
      pool: "$813.16",
    },
    capabilities: {
      chat: dialogflowCredits,
      voice: dialogflowCredits,
      fallback: true,
    },
    timestamp: new Date().toISOString(),
  };
}
