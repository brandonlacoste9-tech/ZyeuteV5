import { logger } from "../utils/logger";

// --- Configuration ---
const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT || "spatial-garden-483401-g8";
const LOCATION = process.env.GOOGLE_CLOUD_REGION || "us-central1";
const AGENT_ID = process.env.DIALOGFLOW_CX_AGENT_ID || "";

// Optional import - only load if package is available
let SessionsClient: any = null;
let client: any = null;

// Initialize Dialogflow CX client
async function initializeClient() {
  if (client) return client;

  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Optional dependency, may not be installed
    const dialogflowCx = await import("@google-cloud/dialogflow-cx");
    SessionsClient = dialogflowCx.SessionsClient;
    if (SessionsClient && AGENT_ID) {
      client = new SessionsClient({
        apiEndpoint: `${LOCATION}-dialogflow.googleapis.com`,
      });
      logger.info(
        `[DialogflowBridge] Initialized Dialogflow CX client for agent: ${AGENT_ID}`,
      );
    }
  } catch (error) {
    logger.warn(
      "[DialogflowBridge] @google-cloud/dialogflow-cx not available, using mock mode",
    );
  }

  return client;
}

// Initialize on module load
initializeClient().catch(() => {
  // Ignore initialization errors
});

/**
 * DialogflowBridge - Uses Dialogflow CX credits ($813.16) for voice/text sessions
 *
 * CRITICAL: This uses Dialogflow CX credits, NOT standard Gemini API credits.
 * Only call this for Dialogflow CX agent interactions.
 */
export const DialogflowBridge = {
  /**
   * Detect intent from user input (text or audio)
   * Uses Dialogflow CX credits for each session
   *
   * @param sessionId Unique session ID (e.g., user ID or conversation ID)
   * @param queryInput Text or audio input from user
   * @param languageCode Language code (default: "fr-CA" for Quebec French/Joual)
   */
  async detectIntent(
    sessionId: string,
    queryInput: { text?: string; audio?: Buffer },
    languageCode: string = "fr-CA",
  ) {
    // Try to initialize client if not already done
    if (!client) {
      await initializeClient();
    }

    if (!AGENT_ID || !client) {
      logger.warn(
        "[DialogflowBridge] DIALOGFLOW_CX_AGENT_ID not set or client not available. Mocking response.",
      );
      return mockIntentResponse(queryInput.text || "Bonjour");
    }

    try {
      const sessionPath = client.projectLocationAgentSessionPath(
        PROJECT_ID,
        LOCATION,
        AGENT_ID,
        sessionId,
      );

      const request = {
        session: sessionPath,
        queryInput: {
          text: queryInput.text
            ? {
                text: queryInput.text,
              }
            : undefined,
          audio: queryInput.audio
            ? {
                audio: queryInput.audio.toString("base64"),
              }
            : undefined,
          languageCode,
        },
      };

      logger.info(
        `[DialogflowBridge] Detecting intent for session ${sessionId}: "${queryInput.text || "audio"}"`,
      );

      const [response] = await client.detectIntent(request);

      return {
        intent: response.queryResult?.intent?.displayName || "unknown",
        confidence: response.queryResult?.intentDetectionConfidence || 0,
        fulfillmentText: response.queryResult?.fulfillmentText || "",
        parameters: response.queryResult?.parameters?.fields || {},
        payload: response.queryResult?.webhookPayload || null,
      };
    } catch (error: any) {
      logger.error("[DialogflowBridge] Detect intent failed:", error);
      return mockIntentResponse(queryInput.text || "Bonjour");
    }
  },

  /**
   * Stream audio for real-time voice interactions
   * Uses Dialogflow CX audio session credits
   *
   * @param sessionId Unique session ID
   * @param audioChunk Audio data chunk
   * @param languageCode Language code (default: "fr-CA")
   */
  async streamAudio(
    sessionId: string,
    audioChunk: Buffer,
    languageCode: string = "fr-CA",
  ) {
    if (!client) {
      await initializeClient();
    }

    if (!AGENT_ID || !client) {
      logger.warn(
        "[DialogflowBridge] Stream audio not available (agent not configured)",
      );
      return null;
    }

    try {
      const sessionPath = client.projectLocationAgentSessionPath(
        PROJECT_ID,
        LOCATION,
        AGENT_ID,
        sessionId,
      );

      // For streaming, we'd use streamingDetectIntent, but for simplicity,
      // we'll use detectIntent with audio
      return await this.detectIntent(
        sessionId,
        { audio: audioChunk },
        languageCode,
      );
    } catch (error: any) {
      logger.error("[DialogflowBridge] Stream audio failed:", error);
      return null;
    }
  },

  /**
   * Get Ti-Guy voice response via Dialogflow CX
   * This uses Dialogflow CX credits for Ti-Guy's voice interactions
   *
   * @param userId User ID for session management
   * @param message User message to Ti-Guy
   * @param context Optional context for the conversation
   */
  async getTiGuyVoiceResponse(
    userId: string,
    message: string,
    context?: Record<string, any>,
  ) {
    const sessionId = `tiguy-${userId}`;

    // Add context to query if provided
    let queryText = message;
    if (context) {
      queryText = `${message} [Context: ${JSON.stringify(context)}]`;
    }

    const result = await this.detectIntent(
      sessionId,
      { text: queryText },
      "fr-CA",
    );

    return {
      response: result.fulfillmentText,
      intent: result.intent,
      confidence: result.confidence,
      parameters: result.parameters,
      // If Dialogflow returns a custom payload with navigation/actions, use it
      action: result.payload?.action || null,
    };
  },
};

// --- Mock Data for Development without Credits ---
function mockIntentResponse(query: string) {
  // Simple mock responses for common Ti-Guy queries
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("bonjour") || lowerQuery.includes("salut")) {
    return {
      intent: "greeting",
      confidence: 0.9,
      fulfillmentText:
        "Salut là! Comment ça va? Je suis Ti-Guy, ton assistant Zyeuté.",
      parameters: {},
      payload: null,
    };
  }

  if (lowerQuery.includes("feed") || lowerQuery.includes("vidéo")) {
    return {
      intent: "show_feed",
      confidence: 0.85,
      fulfillmentText: "Je t'ouvre le feed maintenant!",
      parameters: {},
      payload: { action: "navigate", route: "/feed" },
    };
  }

  return {
    intent: "unknown",
    confidence: 0.5,
    fulfillmentText: "Désolé, je n'ai pas compris. Peux-tu répéter?",
    parameters: {},
    payload: null,
  };
}
