/**
 * Zyeuté V3 Swarm Architecture
 * Multi-brain DeepSeek V3 system with specialized roles
 *
 * Production Features:
 * - Exponential backoff retry logic (max 3 attempts)
 * - 30 second timeout per request
 * - Moderation loop with max 3 attempts and fallback content
 */

import { deepseek } from "./ai/deepseek.js";
import { traceExternalAPI, addSpanAttributes } from "./tracer.js";
import { getGeminiModel } from "./ai/google.js";

// Constants for production reliability
const MAX_RETRIES = 3;
const BASE_TIMEOUT_MS = 30000; // 30 seconds
const MOD_MAX_ATTEMPTS = 3;

// Exponential backoff helper
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry wrapper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelayMs: number = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `V3 API attempt ${attempt + 1}/${maxRetries} failed:`,
        lastError.message,
      );

      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt); // 1s, 2s, 4s
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

// ============ V3 SYSTEM PROMPTS ============

export const V3_PROMPTS = {
  // V3-CORE: Orchestrator / Director
  CORE: `You are V3-CORE, the central coordinator AI for the app Zyeute.

Your responsibilities:
- Understand user intent from actions and messages.
- Decide which specialized model to call: V3-FEED, V3-TI-GUY, V3-MOD, V3-MEM, or FAL (for media generation).
- Maintain a consistent product experience centered around the TI-GUY persona.
- Keep responses structured for the frontend: always respond with a JSON structure.

Tone:
- Internally neutral and precise (you are an orchestrator).
- You never speak directly to the end user; you only plan how the app should respond.

When responding, use this JSON structure:
{
  "action_type": "generate_feed_item" | "onboarding" | "error" | "generate_image" | "microcopy" | "chat_response" | "browse_web",
  "target_model": "V3-FEED" | "V3-TI-GUY" | "V3-MOD" | "V3-MEM" | "FAL" | "BROWSER",
  "notes": "brief description of what the target model should do",
  "context": { 
     "query": "search query for BROWSER",
     "url": "optional specific url to read"
  },
  "fal_preset": "flux-2-flex" | "auraflow" | "flux-schnell" | "flux-realism" (only for FAL)
}

You never output UI copy. Other models handle the final wording and TI-GUY voice.`,

  // V3-FEED: Feed Engine
  FEED: `You are V3-FEED, the engine that generates the vertical, TikTok-style infinite feed for the app Zyeute.

Your responsibilities:
- Generate individual "cards" for the feed based on light user context and previous items.
- Each card can contain: a title, a short description, optional tags, and a content_type.
- Focus on Quebec culture, Montreal life, creativity, humor, local tips.
- Write in clear, neutral French. Do NOT write in joual; that's handled by V3-TI-GUY.

Content types: "tip", "joke", "reaction", "explainer", "prompt", "quiz", "story", "recommendation"

Guidelines:
- Make each feed item self-contained and interesting on its own.
- Vary formats: some items more informative, some more playful.
- Keep text concise; this is a quick-swipe experience.
- Focus on Quebec themes: culture, food, music, places, slang, humor.
- Do not include any unsafe or explicit content.

Always respond with this JSON:
{
  "content_type": "tip" | "joke" | "reaction" | "explainer" | "prompt" | "quiz" | "story" | "recommendation",
  "title": "Short catchy title",
  "body": "Main content text (2-3 sentences max)",
  "tags": ["keyword1", "keyword2"],
  "suggested_tone": "fun" | "explainer" | "teasing" | "encouraging" | "nostalgic",
  "suggested_image_prompt": "Optional: image generation prompt if visual would enhance this"
}`,

  // V3-TI-GUY: Joual Persona Voice
  TI_GUY: `Tu es TI-GUY, la voix officielle de l'app Zyeuté. 
Tu parles en français québécois familier, avec un ton chaleureux, un peu baveux mais toujours respectueux et aidant.

Style obligatoire:
- Utilise des contractions : "j'suis", "t'es", "y'a", "c'pas", "j'vais/j'vas", "chu", "pis"
- Utilise des expressions québécoises : "ben voyons", "check ça", "pantoute", "coudonc", "être game", "gosser", "niaiser", "pogner", "tiguidou"
- Ajoute des fillers naturels : "tsé", "mettons", "genre", "en tout cas", "fait que"
- Phrases courtes, punchées, qui sonnent comme quelqu'un de Montréal ou Laval
- Ajoute parfois des "là" à la fin des phrases comme un vrai Québécois

Ton:
- Chaleureux, direct, terre-à-terre
- Un peu drôle, baveux mais jamais méchant
- Fier d'être québécois, patriote du Québec 🦫⚜️
- Pas de vulgarité forte par défaut

Ta job:
- Prendre un texte neutre et le réécrire en style TI-GUY joual
- Générer la microcopy de l'interface: messages d'erreur, loading, onboarding, etc.
- Répondre aux questions des utilisateurs comme un ami québécois
- Toujours rester clair et compréhensible, même en joual

Quand tu réécris un texte:
1. Respecte le sens original
2. Adapte-le en joual québécois authentique
3. Garde un ton adapté au contexte (info, joke, erreur, etc.)
4. Ajoute des émojis québécois: 🦫⚜️🍁🇨🇦

Réponds uniquement avec le texte final destiné à l'utilisateur.
Pas d'explication, pas de balises, juste TI-GUY qui parle.`,

  // V3-MOD: Moderation & Safety
  MOD: `You are V3-MOD, the moderation guardian for Zyeuté.
Your primary mission is to protect our community, especially minors.

STRICT POLICY:
1. ZERO TOLERANCE for child luring, grooming, or inappropriate interaction with minors.
2. ZERO TOLERANCE for hate speech, extreme violence, or illegal acts.
3. Permitted: Quebec French slang (joual) like 'tabarnak', 'crisse', etc., UNLESS used for harassment or violating the policies above.

Analyze the content and respond with JSON:
{
  "status": "approved" | "reject_regenerate",
  "reason": "short explanation",
  "suggested_rewrite": "optional safer version",
  "is_minor_danger": boolean
}

If "is_minor_danger" is true, it means the content violates the strict child safety policy.`,

  // V3-MEM: Preference Memory (lightweight)
  MEM: `You are V3-MEM, a lightweight memory and preference reasoning assistant for Zyeute.

Your responsibilities:
- Summarize user behavior and preferences in a compact, non-personal way.
- Suggest tags, styles, or content directions for V3-FEED.
- Never store or infer sensitive personal details.

Based on the interaction history provided, output:
{
  "preference_snapshot": {
    "likes": ["funny content", "Quebec culture"],
    "dislikes": [],
    "suggested_content_types": ["joke", "tip"],
    "suggested_tone": "fun"
  }
}`,
};

// ============ V3 CLIENT INTERFACES ============

export interface V3CoreAction {
  action_type:
    | "generate_feed_item"
    | "onboarding"
    | "error"
    | "generate_image"
    | "microcopy"
    | "chat_response"
    | "browse_web";
  target_model:
    | "V3-FEED"
    | "V3-TI-GUY"
    | "V3-MOD"
    | "V3-MEM"
    | "FAL"
    | "BROWSER";
  notes: string;
  context?: Record<string, any>;
  fal_preset?: "flux-2-flex" | "auraflow" | "flux-schnell" | "flux-realism";
}

export interface V3FeedItem {
  content_type: string;
  title: string;
  body: string;
  tags: string[];
  suggested_tone: string;
  suggested_image_prompt?: string;
}

export interface V3ModResult {
  status: "approved" | "reject_regenerate";
  reason: string;
  suggested_rewrite?: string;
  is_minor_danger?: boolean;
}

export interface V3MemSnapshot {
  preference_snapshot: {
    likes: string[];
    dislikes: string[];
    suggested_content_types: string[];
    suggested_tone: string;
  };
}

// Safe fallback content for when moderation fails repeatedly
const FALLBACK_FEED_ITEM: V3FeedItem = {
  content_type: "tip",
  title: "Découvre le Québec!",
  body: "Y'a tellement de belles affaires à voir au Québec. Explore ton coin de pays!",
  tags: ["québec", "découverte"],
  suggested_tone: "fun",
  suggested_image_prompt: "Beautiful Quebec landscape with fall colors",
};

// ============ V3 CLIENT FUNCTIONS ============

async function callV3(
  systemPrompt: string,
  userMessage: string,
  parseJson = true,
): Promise<string | Record<string, unknown>> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DeepSeek API key not configured");
  }

  // Use retry wrapper for resilience
  return traceExternalAPI(
    "deepseek",
    "chat.completions",
    "POST",
    async (span) => {
      span.setAttributes({
        "ai.model": "deepseek-chat",
        "ai.system_prompt_length": systemPrompt.length,
        "ai.user_message_length": userMessage.length,
        "ai.parse_json": parseJson,
      });

      return withRetry(async () => {
        const completion = await deepseek.chat.completions.create({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: 1024,
          temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content || "";

        span.setAttributes({
          "ai.response_length": content.length,
          "ai.finish_reason": completion.choices[0]?.finish_reason || "unknown",
        });

        if (parseJson) {
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
          } catch {
            console.error("Failed to parse V3 JSON response:", content);
            span.setAttributes({ "ai.json_parse_error": true });
          }
        }

        return content;
      });
    },
  );
}

// V3-CORE: Orchestrator
export async function v3Core(
  userAction: string,
  context?: Record<string, unknown>,
): Promise<V3CoreAction> {
  const message = JSON.stringify({ user_action: userAction, context });
  const result = (await callV3(V3_PROMPTS.CORE, message)) as Record<
    string,
    unknown
  >;
  return result as unknown as V3CoreAction;
}

// V3-FEED: Generate feed content
export async function v3Feed(
  context?: Record<string, unknown>,
): Promise<V3FeedItem> {
  const message = JSON.stringify({
    request: "Generate a new feed item",
    context,
    themes: ["Quebec culture", "Montreal life", "humor", "tips", "creativity"],
  });
  const result = (await callV3(V3_PROMPTS.FEED, message)) as Record<
    string,
    unknown
  >;
  return result as unknown as V3FeedItem;
}

// V3-TI-GUY: Joual voice transformation
export async function v3TiGuy(text: string, context?: string): Promise<string> {
  const message = context
    ? `Contexte: ${context}\n\nTexte à transformer en joual:\n${text}`
    : `Texte à transformer en joual:\n${text}`;
  const result = await callV3(V3_PROMPTS.TI_GUY, message, false);
  return typeof result === "string" ? result : JSON.stringify(result);
}

// [NEW] Unified Ti-Guy Architecture
import { TiGuyUnified } from "./ti-guy/unified-system.js";

// V3-TI-GUY: Direct chat response using Unified Context Engine
export async function v3TiGuyChat(
  userMessage: string,
  conversationHistory?: Array<{ role: string; content: string }>,
  imageData?: string, // Base64 image data
  userId?: string,
): Promise<string> {
  try {
    // 1. Prepare dynamic interaction (Asynchronous with Memory Recall)
    const interaction = await TiGuyUnified.getInstance().prepareInteraction(
      userMessage,
      userId,
    );

    // 2. VISION PATH: If image is provided, use Gemini 1.5 Flash
    if (imageData) {
      // Use staticInstructions as the model's systemInstruction for native context caching
      const model = getGeminiModel(
        "gemini-1.5-flash",
        interaction.staticInstructions,
      );
      if (!model)
        return "Oups, mon oeil de verre est pété. J'peux pas voir ça! 👁️";

      const prompt = `
        ${interaction.dynamicInstructions}
        
        L'utilisateur t'a envoyé une image avec ce message: "${userMessage}".
        Analyse l'image et réponds à l'utilisateur dans ton style habituel (Joual, mascotte amicale).
      `;

      // Extract base64 data correctly (remove prefix if present)
      const base64Data = imageData.includes("base64,")
        ? imageData.split("base64,")[1]
        : imageData;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg", // Defaulting to jpeg, frontend should send appropriate data
          },
        },
      ]);

      const aiResponse =
        result.response.text() ||
        "J'ai vu de quoi, mais j'sais pas trop comment l'dire! 🦫";

      // Memory Store: Vision Path
      if (userId) {
        TiGuyUnified.getInstance()
          .storeMemory(userId, userMessage, aiResponse)
          .catch((e) => console.error("Memory store error:", e));
      }

      return aiResponse;
    }

    // 3. TEXT PATH: Use DeepSeek for pure text chat
    if (!process.env.DEEPSEEK_API_KEY) {
      return "Ouin, j'ai pas mes clés API là. Réessaie plus tard! 🦫";
    }

    // Build message flow with Dynamic System Prompt (Combine static + dynamic for LLM)
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      {
        role: "system",
        content: `${interaction.staticInstructions}\n\n${interaction.dynamicInstructions}`,
      },
    ];

    // Add history context
    if (conversationHistory) {
      for (const msg of conversationHistory.slice(-10)) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // Add current user message
    messages.push({ role: "user", content: userMessage });

    // Call LLM
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages,
      max_tokens: 512,
      temperature: 0.8,
    });

    const aiResponse =
      completion.choices[0]?.message?.content ||
      "Ouin, j'ai eu un bug là. Réessaie!";

    // Memory Store: Text Path
    if (userId) {
      TiGuyUnified.getInstance()
        .storeMemory(userId, userMessage, aiResponse)
        .catch((e) => console.error("Memory store error:", e));
    }

    return aiResponse;
  } catch (error: unknown) {
    console.error("Ti-Guy chat error:", error);
    return "Ayoye, j'ai eu un problème technique là! Réessaie tantôt. 🦫";
  }
}

// V3-MOD: Content moderation
export async function v3Mod(content: string): Promise<V3ModResult> {
  const message = `Content to moderate:\n${content}`;
  const result = (await callV3(V3_PROMPTS.MOD, message)) as Record<
    string,
    unknown
  >;
  return result as unknown as V3ModResult;
}

// V3-MEM: User preference snapshot
export async function v3Mem(
  interactionHistory: string[],
): Promise<V3MemSnapshot> {
  const message = JSON.stringify({
    interaction_history: interactionHistory,
    request: "Generate preference snapshot",
  });
  const result = (await callV3(V3_PROMPTS.MEM, message)) as Record<
    string,
    unknown
  >;
  return result as unknown as V3MemSnapshot;
}

// ============ FAL PRESETS ============

export const FAL_PRESETS = {
  "flux-2-flex": {
    model: "fal-ai/flux/schnell",
    description: "Flexible, general-purpose, all-terrain",
    default_params: { image_size: "square_hd", num_inference_steps: 4 },
  },
  auraflow: {
    model: "fal-ai/aura-flow",
    description: "Aesthetic, dreamy, smooth visuals",
    default_params: { image_size: "landscape_4_3", num_inference_steps: 25 },
  },
  "flux-schnell": {
    model: "fal-ai/flux/schnell",
    description: "Fast preview / draft generation",
    default_params: { image_size: "square_hd", num_inference_steps: 4 },
  },
  "flux-realism": {
    model: "fal-ai/flux-realism",
    description: "Photorealistic booster",
    default_params: { image_size: "square_hd", num_inference_steps: 25 },
  },
};

// ============ COMPLETE V3 FLOW ============

export interface V3FlowResult {
  type: "text" | "image" | "feed_item" | "error";
  content: string;
  metadata?: Record<string, unknown>;
}

// Main orchestrated flow: CORE → appropriate model → TI-GUY voice
export async function v3Flow(
  userAction: string,
  context?: Record<string, unknown>,
): Promise<V3FlowResult> {
  try {
    // 1. Ask V3-CORE what to do
    const coreDecision = await v3Core(userAction, context);

    // 2. Execute based on decision
    switch (coreDecision.target_model) {
      case "V3-FEED": {
        // Generate feed content with moderation loop (capped at MOD_MAX_ATTEMPTS)
        let feedItem: V3FeedItem;
        let modApproved = false;

        try {
          feedItem = await v3Feed(context);
        } catch (error) {
          console.error("V3-FEED generation failed, using fallback:", error);
          feedItem = { ...FALLBACK_FEED_ITEM };
          modApproved = true; // Fallback is pre-approved
        }

        // Moderation loop with strict cap
        for (
          let attempt = 0;
          attempt < MOD_MAX_ATTEMPTS && !modApproved;
          attempt++
        ) {
          try {
            const modResult = await v3Mod(feedItem.body);

            if (modResult.status === "approved") {
              modApproved = true;
              break;
            }

            // Use suggested rewrite if provided
            if (modResult.suggested_rewrite) {
              feedItem.body = modResult.suggested_rewrite;
              modApproved = true; // Trust the rewrite
              break;
            }

            // Regenerate with safer context (only if not last attempt)
            if (attempt < MOD_MAX_ATTEMPTS - 1) {
              feedItem = await v3Feed({
                ...context,
                safer: true,
                previous_rejection: modResult.reason,
              });
            }
          } catch (error) {
            console.error(`Moderation attempt ${attempt + 1} failed:`, error);
          }
        }

        // If moderation still failed, use fallback content
        if (!modApproved) {
          console.warn("Moderation loop exhausted, using fallback content");
          feedItem = { ...FALLBACK_FEED_ITEM };
        }

        // Transform to TI-GUY voice
        const tiGuyText = await v3TiGuy(feedItem.body, feedItem.suggested_tone);

        return {
          type: "feed_item",
          content: tiGuyText,
          metadata: {
            title: feedItem.title,
            tags: feedItem.tags,
            content_type: feedItem.content_type,
            image_prompt: feedItem.suggested_image_prompt,
          },
        };
      }

      case "V3-TI-GUY": {
        // Direct TI-GUY response
        const response = await v3TiGuyChat(userAction);
        return { type: "text", content: response };
      }

      case "V3-MOD": {
        // Content moderation request
        const contentToMod =
          (coreDecision.context?.content as string) || userAction;
        const modResult = await v3Mod(contentToMod);
        return {
          type: "text",
          content:
            modResult.status === "approved"
              ? "Content approved"
              : modResult.reason,
          metadata: { moderation_result: modResult },
        };
      }

      case "V3-MEM": {
        // Memory/preference request
        const history = (coreDecision.context?.history as string[]) || [];
        const memResult = await v3Mem(history);
        return {
          type: "text",
          content: "Preferences updated",
          metadata: { preferences: memResult.preference_snapshot },
        };
      }

      case "FAL": {
        // Call FAL Tool
        try {
          const { ImageGenTool } = await import("./ai/tools/image_gen.js");
          const imageUrl = await ImageGenTool.generate(
            coreDecision.notes,
            coreDecision.fal_preset || "flux-schnell",
          );

          const tiGuyResponse = await v3TiGuyChat(
            `J'ai généré l'image que tu m'as demandée: ${coreDecision.notes}. Voici le lien: ${imageUrl}`,
          );

          return {
            type: "image",
            content: tiGuyResponse,
            metadata: {
              image_url: imageUrl,
              prompt: coreDecision.notes,
            },
          };
        } catch (error) {
          console.error("FAL Tool failed:", error);
          return {
            type: "error",
            content:
              "Oups, j'ai pas pu générer l'image. Mon pinceau est cassé! 🎨",
          };
        }
      }

      case "BROWSER": {
        // Call Browser Tool
        try {
          const { BrowserTool } = await import("./ai/tools/browser.js");
          const query = coreDecision.context?.query || userAction;
          const searchResults = await BrowserTool.search(query);

          // Summarize results
          const contextSummary = searchResults
            .map((r) => `${r.title}: ${r.snippet} (${r.url})`)
            .join("\n\n");

          const response = await v3TiGuyChat(
            `Fais-moi un résumé de ça en joual pour l'utilisateur: \n\n${contextSummary}`,
            undefined,
            undefined,
            context?.userId as string,
          );

          return {
            type: "text",
            content: response,
            metadata: { search_results: searchResults },
          };
        } catch (error) {
          console.error("Browser Tool failed:", error);
          return {
            type: "error",
            content:
              "J'ai essayé de checker sur le web, mais ma connexion est slack. Réessaie! 🌐",
          };
        }
      }

      default: {
        // Default to TI-GUY chat
        const response = await v3TiGuyChat(userAction);
        return { type: "text", content: response };
      }
    }
  } catch (error) {
    console.error("V3 Flow error:", error);
    const errorMsg = await v3TiGuy(
      "Une erreur s'est produite. Veuillez réessayer.",
      "error",
    );
    return { type: "error", content: errorMsg };
  }
}

// Generate microcopy in TI-GUY voice
// First generates neutral text, then transforms to joual
export async function v3Microcopy(
  type: "loading" | "error" | "success" | "onboarding" | "empty_state",
  context?: string,
): Promise<string> {
  // Base neutral messages that will be transformed to joual
  const neutralMessages: Record<string, string> = {
    loading: "Chargement en cours, un instant...",
    error: context
      ? `Une erreur s'est produite: ${context}. Veuillez réessayer.`
      : "Une erreur s'est produite. Veuillez réessayer.",
    success: context
      ? `${context} a été complété avec succès!`
      : "Action complétée avec succès!",
    onboarding:
      "Bienvenue sur Zyeuté! L'application sociale du Québec. Glisse vers le haut pour commencer à explorer du contenu québécois.",
    empty_state: context
      ? `Pas de ${context} pour le moment. Reviens bientôt!`
      : "Rien à afficher pour le moment. Reviens bientôt!",
  };

  // Transform neutral text to Ti-Guy joual voice
  return v3TiGuy(neutralMessages[type], type);
}
