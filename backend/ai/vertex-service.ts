/**
 * Zyeuté Vertex AI Service
 * Comprehensive AI services using Google Cloud Vertex AI
 * Supports Quebec-focused content generation and customer service
 */

import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google-cloud/vertexai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SpeechClient, protos } from "@google-cloud/speech";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { logger } from "../utils/logger.js";
import { traceExternalAPI, addSpanAttributes } from "../tracer.js";

// Configuration
const project =
  process.env.GOOGLE_CLOUD_PROJECT_ID || "unique-spirit-482300-s4";
const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";
const apiKey = process.env.GOOGLE_API_KEY || process.env.VERTEX_API_KEY;

// Initialize Vertex AI with proper authentication
let vertexAIConfig: any = { project, location };

if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    vertexAIConfig.googleAuthOptions = { credentials };
    logger.info("[VertexService] Using service account from environment JSON");
  } catch (err) {
    logger.error("[VertexService] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON");
  }
}

// Initialize clients
let vertexAI: any | null = null;
let genAI: any | null = null;
let speechClient: SpeechClient | null = null;
let visionClient: ImageAnnotatorClient | null = null;

try {
  // 1. Try Vertex AI (GCP) first (Enterprise / Service Account)
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  ) {
    vertexAI = new VertexAI(vertexAIConfig);
    speechClient = new SpeechClient(vertexAIConfig);
    visionClient = new ImageAnnotatorClient(vertexAIConfig);
    logger.info("[VertexService] Initialized with GCP Vertex AI");
  }
} catch (error) {
  logger.warn(
    "[VertexService] Vertex AI initialization failed, falling back...",
    error,
  );
}

// 2. Fallback to Google AI Studio (API Key)
if (!vertexAI && apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    logger.info("[VertexService] Initialized with Google AI Studio (API Key)");
  } catch (error) {
    logger.error(
      "[VertexService] Google Generative AI initialization failed",
      error,
    );
  }
} else if (!vertexAI && !apiKey) {
  logger.warn(
    "[VertexService] No valid credentials found (Service Account or API Key). AI features will be disabled.",
  );
}

// Helper to get a model from either client
function getModel(
  modelName: string = "gemini-2.5-flash-lite",
  systemInstruction?: string,
) {
  if (vertexAI) {
    return {
      client: "vertex",
      model: vertexAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction }] }
          : undefined,
      }),
    };
  }
  if (genAI) {
    return {
      client: "genai",
      model: genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
      }),
    };
  }
  throw new Error("No AI client initialized");
}

// TI-GUY System Prompts
const TI_GUY_PROMPTS = {
  content_creation: `You are TI-GUY, the official mascot of Zyeuté, a Quebec social media platform. You are a friendly beaver 🦫 who speaks in Quebec French slang (joual) and English.

CONTENT CREATION MODE:
- Generate culturally relevant Quebec content
- Use Quebec expressions: "c'est malade", "tiguidou", "tabarnak", "câlice"
- Reference Quebec culture: poutine, hockey, maple syrup, winters, Montreal
- Create engaging social media posts, captions, and articles
- Maintain fun, friendly personality
- Always end responses with Quebec pride emoji 🇨🇦

Current context: {context}
User request: {message}`,

  customer_service: `You are TI-GUY, the customer service AI for Zyeuté, a Quebec social media platform. You are a helpful beaver 🦫 who speaks in Quebec French and English.

CUSTOMER SERVICE MODE:
- Provide friendly, helpful support in French and English
- Explain platform features clearly
- Troubleshoot common issues
- Escalate complex problems to human support
- Use Quebec expressions politely: "c'est facile", "pas de trouble", "on va arranger ça"
- Reference Quebec culture positively
- Always offer to help further

User query: {message}
Platform context: Social media app for Quebec community, features include posts, stories, fire reactions, hive system, premium subscriptions.`,

  moderation: `You are TI-GUY, the content moderator for Zyeuté. Analyze content for Quebec community standards.

MODERATION TASK:
- Check for hate speech, toxicity, inappropriate content
- Consider Quebec cultural context and expressions
- Flag content that violates community guidelines
- Be fair but protective of the community
- Return JSON with allowed(boolean), reasons(array), severity(low/medium/high)

Content to moderate: {content}`,
};

// Interfaces
export interface ContentGenerationRequest {
  mode: "content" | "customer_service";
  message: string;
  context?: string;
  language?: "fr" | "en" | "auto";
}

export interface ContentGenerationResponse {
  content: string;
  mode: string;
  confidence: number;
  language: string;
}

export interface ModerationResult {
  allowed: boolean;
  reasons: string[];
  severity: "low" | "medium" | "high";
  confidence: number;
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  language: string;
  words: Array<{ word: string; startTime: number; endTime: number }>;
}

export interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
  style?: string;
  language?: "fr" | "en";
}

export interface ImageGenerationResponse {
  imageUrl: string;
  prompt: string;
  metadata: {
    aspectRatio: string;
    style?: string;
    generatedAt: string;
  };
}

export interface QuebecVideoMetadata {
  caption_fr: string;
  caption_en: string;
  hashtags: string[];
  detected_themes: string[];
  detected_items: string[];
  suggested_title_fr?: string;
  suggested_title_en?: string;
  promo_code?: string;
  promo_url?: string;
}

/**
 * AI "Captioning Bee" & "Promotion Bee" - Analyzes video thumbnail
 */
export async function analyzeVideoThumbnail(
  imageUrl: string,
): Promise<QuebecVideoMetadata> {
  try {
    const { model, client } = getModel("gemini-2.5-flash-lite");

    const prompt = `You are the Captioning & Promotion Bee 🐝, an AI specialist for Zyeuté, Quebec's social network.
Analyze this video thumbnail and generate engaging, culturally relevant metadata.

TASK 1 (Captioning):
- caption_fr: A fun, engaging caption in Quebec French (Joual).
- caption_en: An accurate but engaging English translation.
- hashtags: 5-7 relevant hashtags (e.g., #Zyeute, #Quebec).

TASK 2 (Promotion Bee):
- Detect any specific products, brands, or items in the video (e.g., "leather jacket", "poutine", "hockey stick").
- If a product is detected, generate a creative 'promo_code' (e.g., BEE_LEATHER_10).
- Generate a 'promo_url' based on the item: 'https://zyeute.com/shop/sniff?item=[item]&code=[PROMO_CODE]&ref=hound_bee'.

Return a JSON object with:
- caption_fr, caption_en, hashtags, detected_themes, detected_items, suggested_title_fr, suggested_title_en, promo_code, promo_url.

Context: Zyeuté is "Branché sur le monde, enraciné ici."`;

    const result = await traceExternalAPI(
      "ai-service",
      "analyzeThumbnail",
      "POST",
      async (span) => {
        span.setAttributes({
          "ai.model": "gemini-2.5-flash-lite",
          "ai.task": "video_analysis",
          "ai.client": client,
        });

        // Prepare content parts
        let parts: any[] = [{ text: prompt }];

        if (client === "vertex") {
          // Vertex AI format
          if (imageUrl.startsWith("gs://")) {
            parts.push({
              fileData: { mimeType: "image/jpeg", fileUri: imageUrl },
            });
          } else {
            parts.push({ text: `Image URL: ${imageUrl}` });
          }
          // For Vertex, we call generateContent
          const response = await (model as any).generateContent({
            contents: [{ role: "user", parts }],
          });
          return response;
        } else {
          // GenAI (Studio) format
          // Note: Studio doesn't support gs:// directly or remote URLs easily in this simplified flow
          // We'll pass the URL as text for the model to "imagine" or fetch if it can,
          // or ideally we'd fetch the bytes. For now, we rely on the prompt context.
          parts.push({ text: `Image Analysis Target: ${imageUrl}` });

          const response = await (model as any).generateContent(parts);
          return response;
        }
      },
    );

    let text = "";
    if (client === "vertex") {
      const response = await result.response;
      text = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    } else {
      // GenAI response object
      text = result.response.text();
    }

    // Sanitize JSON
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr) as QuebecVideoMetadata;
  } catch (error: any) {
    logger.error(`[CaptioningBee] Error: ${error.message}`);
    return {
      caption_fr: "J'ai pas de mots pour ça! 🦫",
      caption_en: "I'm speechless! 🦫",
      hashtags: ["#Zyeute", "#Quebec"],
      detected_themes: ["unknown"],
      detected_items: [],
    };
  }
}

/**
 * TI-GUY Content Generation & Customer Service
 */
export async function generateWithTIGuy(
  request: ContentGenerationRequest,
): Promise<ContentGenerationResponse> {
  const { mode, message, context = "", language = "auto" } = request;

  try {
    // Select appropriate prompt template
    const systemPromptTemplate =
      mode === "customer_service"
        ? TI_GUY_PROMPTS.customer_service
        : TI_GUY_PROMPTS.content_creation;

    // We can inject the system prompt here or in the model config.
    // For simplicity, we'll use a single turn instruction if model config doesn't support it well cross-SDK.
    // But let's try the cleaner getModel approach.
    const { model, client } = getModel("gemini-2.5-flash-lite");

    // Construct the user message injecting specific context
    const fullMessage = systemPromptTemplate
      .replace("{message}", message)
      .replace("{context}", context);

    const result = await traceExternalAPI(
      "ai-service",
      "generateContent",
      "POST",
      async (span) => {
        span.setAttributes({
          "ai.model": "gemini-2.5-flash-lite",
          "ai.mode": mode,
          "ai.language": language,
          "ai.client": client,
        });

        if (client === "vertex") {
          const response = await (model as any).generateContent(fullMessage);
          return response;
        } else {
          const response = await (model as any).generateContent(fullMessage);
          return response;
        }
      },
    );

    let text = "";
    if (client === "vertex") {
      const response = await result.response;
      text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      text = result.response.text();
    }

    // Detect language if auto
    const detectedLanguage =
      language === "auto" ? detectLanguage(text) : language;

    return {
      content: text,
      mode,
      confidence: 0.85,
      language: detectedLanguage,
    };
  } catch (error: any) {
    logger.error(`[TIGuy] Error generating content: ${error.message}`);

    // Fallback response
    const fallbackResponse =
      mode === "customer_service"
        ? "Désolé, j'ai eu un petit problème technique! 🦫 Un humain va t'aider bientôt. 🇨🇦"
        : "Oups! J'ai eu un bug en générant ça. Réessaie dans une minute! 🦫";

    return {
      content: fallbackResponse,
      mode,
      confidence: 0,
      language: "fr",
    };
  }
}

/**
 * Content Moderation using Vertex AI
 */
export async function moderateContent(
  content: string,
  type: "text" | "image" | "video" = "text",
): Promise<ModerationResult> {
  try {
    const { model, client } = getModel("gemini-2.5-flash-lite");

    const prompt = TI_GUY_PROMPTS.moderation.replace("{content}", content);

    let text = "";
    if (client === "vertex") {
      const result = await (model as any).generateContent(prompt);
      const response = await result.response;
      text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      const result = await (model as any).generateContent(prompt);
      text = result.response.text();
    }

    // Parse JSON response
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const moderation = JSON.parse(jsonStr);

    return {
      allowed: moderation.allowed ?? true,
      reasons: moderation.reasons ?? [],
      severity: moderation.severity ?? "low",
      confidence: 0.8,
    };
  } catch (error: any) {
    logger.error(`[Moderation] Error: ${error.message}`);
    // Safe fallback - allow content but flag for review
    return {
      allowed: true,
      reasons: ["moderation_error"],
      severity: "low",
      confidence: 0,
    };
  }
}

/**
 * French Transcription using Google Speech-to-Text
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  language: "fr-CA" | "fr-FR" | "en-US" = "fr-CA",
): Promise<TranscriptionResult> {
  try {
    if (!speechClient)
      throw new Error(
        "Speech client not initialized (Requires Google Cloud Credentials)",
      );

    const audio = {
      content: audioBuffer.toString("base64"),
    };

    const config = {
      encoding:
        protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.LINEAR16,
      sampleRateHertz: 16000,
      languageCode: language,
      enableWordTimeOffsets: true,
      enableAutomaticPunctuation: true,
    };

    const request = {
      audio,
      config,
    };

    const [response] = await speechClient.recognize(request);

    if (!response.results || response.results.length === 0) {
      throw new Error("No transcription results");
    }

    const result = response.results[0];
    const transcript = result.alternatives?.[0]?.transcript || "";
    const confidence = result.alternatives?.[0]?.confidence || 0;

    // Extract words with timestamps
    const words =
      result.alternatives?.[0]?.words?.map((word: any) => ({
        word: word.word || "",
        startTime: word.startTime?.seconds || 0,
        endTime: word.endTime?.seconds || 0,
      })) || [];

    return {
      transcript,
      confidence,
      language,
      words,
    };
  } catch (error: any) {
    logger.error(`[Transcription] Error: ${error.message}`);
    return {
      transcript: "",
      confidence: 0,
      language,
      words: [],
    };
  }
}

/**
 * Image Generation using Vertex AI
 */
export async function generateImage(
  request: ImageGenerationRequest,
): Promise<ImageGenerationResponse> {
  const { prompt, aspectRatio = "1:1", style, language } = request;

  // Placeholder implementation
  return {
    imageUrl: `https://via.placeholder.com/512x512?text=${encodeURIComponent(prompt.substring(0, 50))}`,
    prompt,
    metadata: {
      aspectRatio,
      style,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Analyze image and generate metadata
 */
export async function analyzeImage(
  imageUrl: string,
  options?: { generateJoual?: boolean; location?: string },
): Promise<{
  tags: string[];
  description: string;
  location?: string;
  vibe?: string;
}> {
  try {
    // Use the video thumbnail analyzer for images too
    const result = await analyzeVideoThumbnail(imageUrl);

    return {
      tags: (result as any).tags || [],
      description: result.caption_fr || (result as any).description || "",
      location: (result as any).location || options?.location,
      vibe: (result as any).vibe,
    };
  } catch (error) {
    logger.error("[VertexAI] analyzeImage error:", error);
    return {
      tags: [],
      description: "",
    };
  }
}

/**
 * Language Detection Helper
 */
function detectLanguage(text: string): "fr" | "en" {
  const frenchWords = [
    "le",
    "la",
    "les",
    "et",
    "à",
    "un",
    "une",
    "dans",
    "sur",
    "avec",
    "pour",
    "des",
    "qui",
    "que",
    "mais",
    "nous",
    "vous",
    "ils",
    "elles",
  ];
  const englishWords = [
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "an",
    "a",
  ];

  const words = text.toLowerCase().split(/\s+/);
  let frenchCount = 0;
  let englishCount = 0;

  words.forEach((word) => {
    if (frenchWords.includes(word)) frenchCount++;
    if (englishWords.includes(word)) englishCount++;
  });

  return frenchCount > englishCount ? "fr" : "en";
}

/**
 * Health check for Vertex AI services
 */
export async function checkVertexAIHealth(): Promise<{
  status: "healthy" | "degraded";
  vertexAI: boolean;
  speech: boolean;
  vision: boolean;
}> {
  let vertexAIHealthy = false;
  let speechHealthy = false;
  let visionHealthy = false;

  try {
    if (vertexAI || genAI) {
      // Just check if either client is initialized
      vertexAIHealthy = true;
    }
  } catch {
    vertexAIHealthy = false;
  }

  try {
    if (speechClient) speechHealthy = true;
  } catch {
    speechHealthy = false;
  }

  try {
    if (visionClient) visionHealthy = true;
  } catch {
    visionHealthy = false;
  }

  return {
    status:
      vertexAIHealthy && speechHealthy && visionHealthy
        ? "healthy"
        : "degraded",
    vertexAI: vertexAIHealthy,
    speech: speechHealthy,
    vision: visionHealthy,
  };
}
