/**
 * Vertex AI Model Service
 * Wrapper for calling different Gemini models with consistent interface
 * Used by Circuit Breaker for automatic failover
 */

import { VertexAI, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";
import type { GeminiModel } from "./circuit-breaker.js";
import { logger } from "../utils/logger.js";
import { traceExternalAPI } from "../tracer.js";

interface ModelCallOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: "text/plain" | "application/json";
  safetySettings?: Array<{
    category: HarmCategory;
    threshold: HarmBlockThreshold;
  }>;
}

interface ModelCallResult {
  text: string;
  model: GeminiModel;
}

let vertexAIInstance: VertexAI | null = null;

function getVertexAI(): VertexAI {
  if (!vertexAIInstance) {
    const project =
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT_ID ||
      "unique-spirit-482300-s4";
    const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";

    let vertexAIConfig: any = { project, location };

    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        vertexAIConfig.googleAuthOptions = { credentials };
      } catch (err) {
        logger.error("[VertexModelService] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON");
      }
    }

    vertexAIInstance = new VertexAI(vertexAIConfig);
  }
  return vertexAIInstance;
}

/**
 * Call a specific Gemini model
 * This is the function that the Circuit Breaker wraps
 */
export async function callGeminiModel(
  modelName: GeminiModel,
  options: ModelCallOptions
): Promise<ModelCallResult> {
  try {
    const vertexAI = getVertexAI();
    const {
      prompt,
      systemInstruction,
      temperature = 0.7,
      maxOutputTokens = 1024,
      responseMimeType = "text/plain",
      safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    } = options;

    const model = vertexAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
      generationConfig: {
        temperature,
        topP: 0.8,
        maxOutputTokens,
        responseMimeType,
      },
      safetySettings,
    });

    const result = await traceExternalAPI(
      "vertex-ai-model",
      "generateContent",
      "POST",
      async (span) => {
        span.setAttributes({
          "ai.model": modelName,
          "ai.temperature": temperature.toString(),
        });
        return await model.generateContent(prompt);
      }
    );

    const response = await result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      throw new Error(`Empty response from ${modelName}`);
    }

    return {
      text,
      model: modelName,
    };
  } catch (error: any) {
    logger.error(`[VertexModelService] Error calling ${modelName}:`, error.message);
    throw error; // Re-throw for Circuit Breaker to handle
  }
}

/**
 * Determine which model to use based on user credits and requirements
 */
export function selectModelForRequest(
  userCredits: number,
  requiredCapability?: "vision" | "text"
): GeminiModel {
  const PRO_COST = 10; // Credits required for Pro models

  if (requiredCapability === "vision") {
    // Vision tasks can use pro-vision if credits available
    return userCredits >= PRO_COST ? "gemini-1.5-pro" : "gemini-2.0-flash";
  }

  // Text generation: Use Pro if credits available, otherwise Flash
  return userCredits >= PRO_COST ? "gemini-1.5-pro" : "gemini-2.0-flash";
}
