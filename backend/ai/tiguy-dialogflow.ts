/**
 * TI-GUY Dialogflow Integration
 * Connects Dialogflow CX/ES to Zyeuté messaging via WebSocket
 */

import { SessionsClient } from "@google-cloud/dialogflow-cx";
import { broadcastAIResponse, broadcastAITyping } from "../websocket/gateway";
import { db } from "../db";

// Dialogflow CX configuration
const DF_CONFIG = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: process.env.DIALOGFLOW_LOCATION || "global",
  agentId: process.env.DIALOGFLOW_AGENT_ID,
  languageCode: "fr-CA", // Quebec French
};

const client = new SessionsClient({
  apiEndpoint: DF_CONFIG.location === "global" 
    ? "dialogflow.googleapis.com" 
    : `${DF_CONFIG.location}-dialogflow.googleapis.com`,
});

// TI-GUY's user ID (special system user)
export const TI_GUY_USER_ID = "00000000-0000-0000-0000-000000000001";

interface DialogflowResponse {
  text: string;
  intent?: string;
  confidence?: number;
  parameters?: Record<string, any>;
  sentiment?: {
    score: number;
    magnitude: number;
  };
}

/**
 * Send message to Dialogflow and get TI-GUY response
 */
export async function queryTI Guy(
  conversationId: string,
  userMessage: string,
  userId: string,
  io: any
): Promise<DialogflowResponse> {
  // Broadcast "TI-GUY is typing..."
  await broadcastAITyping(io, conversationId, true);

  const sessionId = `${conversationId}_${userId}`;
  const sessionPath = client.projectLocationAgentSessionPath(
    DF_CONFIG.projectId!,
    DF_CONFIG.location,
    DF_CONFIG.agentId!,
    sessionId
  );

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: userMessage,
      },
      languageCode: DF_CONFIG.languageCode,
    },
  };

  try {
    const [response] = await client.detectIntent(request);
    
    // Extract response text
    const responseMessages = response.queryResult?.responseMessages || [];
    const textResponse = responseMessages
      .filter((msg: any) => msg.text)
      .map((msg: any) => msg.text?.text?.[0])
      .join("\n");

    // Get intent info
    const intent = response.queryResult?.intent?.displayName;
    const confidence = response.queryResult?.match?.confidence;
    const parameters = response.queryResult?.parameters;
    const sentiment = response.queryResult?.sentimentAnalysisResult?.queryTextSentiment;

    // Simulate thinking time for realism
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Stop typing indicator
    await broadcastAITyping(io, conversationId, false);

    return {
      text: textResponse || "Je ne comprends pas bien. Peux-tu reformuler?",
      intent,
      confidence,
      parameters: parameters ? Object.fromEntries(Object.entries(parameters)) : undefined,
      sentiment: sentiment ? {
        score: sentiment.score || 0,
        magnitude: sentiment.magnitude || 0,
      } : undefined,
    };
  } catch (err) {
    console.error("[TI-GUY] Dialogflow error:", err);
    await broadcastAITyping(io, conversationId, false);
    
    return {
      text: "Oups, j'ai un petit problème technique. Réessaie dans un moment!",
    };
  }
}

/**
 * Store TI-GUY response as message and broadcast
 */
export async function sendTIGuyResponse(
  conversationId: string,
  response: DialogflowResponse,
  io: any
): Promise<void> {
  try {
    // Store in database
    const insertResult = await db.query(
      `INSERT INTO messages (
        conversation_id, sender_id, content_type, content_text,
        content_metadata, is_encrypted, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *`,
      [
        conversationId,
        TI_GUY_USER_ID,
        "text",
        response.text,
        JSON.stringify({
          intent: response.intent,
          confidence: response.confidence,
          sentiment: response.sentiment,
          isAI: true,
        }),
        false,
      ]
    );

    const message = insertResult.rows[0];

    // Broadcast via WebSocket
    await broadcastAIResponse(io, conversationId, {
      id: message.id,
      senderId: TI_GUY_USER_ID,
      sender: {
        username: "ti-guy",
        displayName: "TI-GUY",
        avatarUrl: "/avatars/ti-guy.png",
      },
      contentType: "text",
      contentText: response.text,
      contentMetadata: {
        intent: response.intent,
        confidence: response.confidence,
        sentiment: response.sentiment,
        isAI: true,
      },
      createdAt: message.created_at,
    });
  } catch (err) {
    console.error("[TI-GUY] Store response error:", err);
  }
}

/**
 * Handle user message and trigger TI-GUY response if needed
 */
export async function handleUserMessage(
  conversationId: string,
  userMessage: string,
  userId: string,
  io: any,
  options: {
    enableAI: boolean;
    aiTriggerKeywords?: string[];
  } = { enableAI: true }
): Promise<void> {
  if (!options.enableAI) return;

  // Check if message should trigger AI
  const shouldTriggerAI = 
    // Direct mention
    userMessage.toLowerCase().includes("@ti-guy") ||
    userMessage.toLowerCase().includes("ti-guy") ||
    userMessage.toLowerCase().includes("ti guy") ||
    // Keywords
    options.aiTriggerKeywords?.some((kw) => 
      userMessage.toLowerCase().includes(kw.toLowerCase())
    ) ||
    // AI-enabled conversation (no keyword needed)
    await isAIEnabledConversation(conversationId);

  if (shouldTriggerAI) {
    const response = await queryTI Guy(conversationId, userMessage, userId, io);
    await sendTIGuyResponse(conversationId, response, io);
  }
}

/**
 * Check if conversation has AI enabled
 */
async function isAIEnabledConversation(conversationId: string): Promise<boolean> {
  // For now, enable AI in all conversations
  // Later: check conversation settings
  return true;
}

/**
 * Get TI-GUY's suggested replies for a message
 */
export async function getSuggestedReplies(
  messageText: string
): Promise<string[]> {
  // Use Dialogflow to generate quick reply suggestions
  const suggestions = [
    "👍 D'accord!",
    "🤔 Explique-moi plus...",
    "😂 C'est drôle!",
    "🔥 Super!",
  ];

  // TODO: Use Dialogflow to generate contextual suggestions
  
  return suggestions;
}
