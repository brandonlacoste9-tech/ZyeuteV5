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
import { SpeechClient, protos } from "@google-cloud/speech";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { logger } from "../utils/logger.js";
import { traceExternalAPI, addSpanAttributes } from "../tracer.js";

// Configuration
const project =
  process.env.GOOGLE_CLOUD_PROJECT_ID || "unique-spirit-482300-s4";
const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";

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

// Initialize clients inside try-catch to prevent crash if config is bad
let vertexAI: VertexAI;
let speechClient: SpeechClient;
let visionClient: ImageAnnotatorClient;

try {
  vertexAI = new VertexAI(vertexAIConfig);
  speechClient = new SpeechClient(vertexAIConfig);
  visionClient = new ImageAnnotatorClient(vertexAIConfig);
} catch (error) {
  logger.error("[VertexService] Failed to initialize AI clients", error);
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
    if (!vertexAI) throw new Error("Vertex AI not initialized");

    const model = vertexAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    });

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

Context: Zyeuté is "Branché sur le monde, enraciné ici."

Image URL: ${imageUrl}`;

    const result = await traceExternalAPI(
      "vertex-ai",
      "analyzeThumbnail",
      "POST",
      async (span) => {
        span.setAttributes({
          "ai.model": "gemini-1.5-flash",
          "ai.task": "video_analysis",
        });

        // Use the Gemini 1.5 multi-modal capability
        const parts: any[] = [{ text: prompt }];

        if (imageUrl.startsWith("gs://")) {
          parts.push({
            fileData: {
              mimeType: "image/jpeg",
              fileUri: imageUrl,
            },
          });
        } else {
          // If public URL, we pass it in the prompt (Gemini can often resolve it if enabled)
          // or we could fetch it and pass as inlineData.
          // For now, we've already included it in the text prompt.
        }

        const response = await model.generateContent({
          contents: [{ role: "user", parts }],
        });
        return response;
      },
    );

    const response = await result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return JSON.parse(text) as QuebecVideoMetadata;
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
    if (!vertexAI) throw new Error("Vertex AI not initialized");

    const model = vertexAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: mode === "customer_service" ? 0.3 : 0.7,
        topP: 0.8,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Select appropriate prompt
    const systemPrompt =
      mode === "customer_service"
        ? TI_GUY_PROMPTS.customer_service
        : TI_GUY_PROMPTS.content_creation;

    const fullPrompt = systemPrompt
      .replace("{message}", message)
      .replace("{context}", context);

    const result = await traceExternalAPI(
      "vertex-ai",
      "generateContent",
      "POST",
      async (span) => {
        span.setAttributes({
          "ai.model": "gemini-1.5-flash",
          "ai.mode": mode,
          "ai.language": language,
        });

        const response = await model.generateContent(fullPrompt);
        return response;
      },
    );

    const response = await result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
    if (!vertexAI) throw new Error("Vertex AI not initialized");

    const model = vertexAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = TI_GUY_PROMPTS.moderation.replace("{content}", content);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
    if (!speechClient) throw new Error("Speech client not initialized");

    const audio = {
      content: audioBuffer.toString("base64"),
    };

    const config = {
      encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.LINEAR16,
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
    if (vertexAI) {
      const model = vertexAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      // We don't actually call it to save tokens/avoid failures if no creds,
      // just verify if the client exists or do a very light check if possible.
      // For a real check, we'd do a tiny generation if creds exist.
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
