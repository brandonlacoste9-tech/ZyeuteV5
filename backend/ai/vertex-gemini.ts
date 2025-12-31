import { logger } from "../utils/logger";

// Vertex AI Gemini Configuration
const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.VERTEX_AI_PROJECT_ID ||
  "zyeute-production";
const LOCATION = process.env.VERTEX_AI_LOCATION || "us-central1";

// Optional import - only load if package is available
let VertexAI: any = null;
let vertexAI: any = null;

// Initialize Vertex AI client
async function initializeVertexAI() {
  if (vertexAI) return vertexAI;

  try {
    const vertexAIModule = await import("@google-cloud/vertexai");
    VertexAI = vertexAIModule.VertexAI;

    if (VertexAI) {
      vertexAI = new VertexAI({
        project: PROJECT_ID,
        location: LOCATION,
      });
      logger.info(
        `[VertexGemini] Initialized Vertex AI for project: ${PROJECT_ID}, location: ${LOCATION}`,
      );
    }
  } catch (error) {
    logger.warn(
      "[VertexGemini] @google-cloud/vertexai not available. Falling back to free Gemini API.",
    );
  }

  return vertexAI;
}

// Initialize on module load
initializeVertexAI().catch(() => {
  // Ignore initialization errors
});

/**
 * Gets a Vertex AI Gemini model (uses credits)
 * Falls back to free API if Vertex AI not available
 */
export async function getVertexGeminiModel(
  modelName:
    | "gemini-1.5-flash"
    | "gemini-1.5-pro"
    | "gemini-1.5-pro-vision" = "gemini-1.5-flash",
  systemInstruction?: string,
) {
  const client = await initializeVertexAI();

  if (!client) {
    // Fallback to free API
    const { getGeminiModel } = await import("./google.js");
    return getGeminiModel(modelName, systemInstruction);
  }

  try {
    const model = client.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction,
    });

    logger.info(`[VertexGemini] Using Vertex AI model: ${modelName}`);
    return model;
  } catch (error) {
    logger.error(`[VertexGemini] Failed to get model ${modelName}:`, error);
    // Fallback to free API
    const { getGeminiModel } = await import("./google.js");
    return getGeminiModel(modelName, systemInstruction);
  }
}

/**
 * Generates embeddings using Vertex AI (uses credits)
 * Falls back to free API if Vertex AI not available
 */
export async function getVertexEmbeddings(text: string): Promise<number[]> {
  const client = await initializeVertexAI();

  if (!client) {
    // Fallback to free API
    const { getEmbeddings } = await import("./google.js");
    return getEmbeddings(text);
  }

  try {
    const model = client.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);

    // text-embedding-004 returns 768 dims, but we might need 384
    const embedding = result.embedding?.values || result.embedding || [];

    // Return full 768 dims or slice to 384 if needed
    return embedding.slice(0, 384);
  } catch (error) {
    logger.error("[VertexGemini] Failed to generate embeddings:", error);
    // Fallback to free API
    const { getEmbeddings } = await import("./google.js");
    return getEmbeddings(text);
  }
}

/**
 * Check if Vertex AI is available and configured
 */
export async function isVertexAIAvailable(): Promise<boolean> {
  const client = await initializeVertexAI();
  return !!client;
}
