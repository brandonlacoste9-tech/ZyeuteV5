/**
 * Ti-Guy Agent Service
 * AI-powered assistant that generates Quebec-style content
 * Uses GPT-4 to create captions, emojis, tags, and replies in authentic Joual
 *
 * @example
 * ```typescript
 * import { TiGuyAgent } from '../services/tiGuyAgent';
 *
 * // Generate content for a joke
 * const response = await TiGuyAgent({
 *   text: "J'ai vu 3 cônes orange sur le chemin!",
 *   intent: 'joke'
 * });
 *
 * if (response) {
 *   tiGuyAgentLogger.debug(response.caption);   // "Haha! C'est ben drôle ça..."
 *   tiGuyAgentLogger.debug(response.emojis);    // ['😂', '🔥', '🦫']
 *   tiGuyAgentLogger.debug(response.tags);      // ['Humour', 'Quebec', 'Construction']
 *   tiGuyAgentLogger.debug(response.reply);     // "C'est tiguidou! Continue comme ça..."
 *   tiGuyAgentLogger.debug(response.flagged);   // false
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Generate content for an event
 * const response = await TiGuyAgent({
 *   text: "Party sur la terrasse ce soir!",
 *   intent: 'event'
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Generate content for a rant
 * const response = await TiGuyAgent({
 *   text: "La construction sur le pont Jacques-Cartier encore!",
 *   intent: 'rant'
 * });
 * ```
 */

import { logger } from "@/lib/logger";

const tiGuyAgentLogger = logger.withContext("TiGuyAgent");

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type TiGuyInput = {
  text: string;
  intent: "joke" | "rant" | "event" | "ad" | "poem";
};

export type TiGuyResponse = {
  caption: string;
  emojis: string[];
  tags: string[];
  flagged: boolean;
  reply: string;
};

/**
 * Helper to call DeepSeek API via proxy
 */
async function callDeepSeek(prompt: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/proxy/deepseek`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    tiGuyAgentLogger.error("DeepSeek Fetch Error:", error);
    return null;
  }
}

/**
 * Ti-Guy Agent - Generate Quebec-style content using AI
 * @param input - User text and intent for content generation
 * @returns Response with caption, emojis, tags, moderation flag, and Ti-Guy's reply
 */
export const TiGuyAgent = async (
  input: TiGuyInput,
): Promise<TiGuyResponse | null> => {
  const prompt = `
    Tu es Ti-Guy, un assistant AI 100% Québécois. 
    Parle en Joual, sois drôle, franc, jamais en français standard.

    CONTEXTE:
    Intent: ${input.intent}
    Texte utilisateur: "${input.text}"

    GÉNÈRE:
    - Une caption punchée en Joual
    - Une liste de 3 à 5 emojis pertinents
    - 1 à 3 tags québécois (ex: Poutine, Hiver, Construction)
    - Un flag true si le contenu est inapproprié ou sensible
    - Une réponse signature de Ti-Guy (genre: "C'est ben correct ça, mon loup!")

    FORMATE ta réponse en JSON:
    {
      "caption": string,
      "emojis": string[],
      "tags": string[],
      "flagged": boolean,
      "reply": string
    }
  `;

  const responseJson = await callDeepSeek(prompt);

  if (!responseJson) {
    return generateDemoResponse(input);
  }

  try {
    const content = responseJson.choices[0].message?.content ?? "";
    const parsed = JSON.parse(content) as TiGuyResponse;

    // Validate response structure
    if (
      !parsed.caption ||
      !Array.isArray(parsed.emojis) ||
      !Array.isArray(parsed.tags)
    ) {
      tiGuyAgentLogger.error("Invalid Ti-Guy response structure:", parsed);
      return generateDemoResponse(input);
    }

    return parsed;
  } catch (error) {
    tiGuyAgentLogger.error("Ti-Guy Parsing Error:", error);
    return generateDemoResponse(input);
  }
};

/**
 * Generate a demo response when OpenAI is not available
 */
function generateDemoResponse(input: TiGuyInput): TiGuyResponse {
  const responses: Record<TiGuyInput["intent"], TiGuyResponse> = {
    joke: {
      caption: "Haha! C'est ben drôle ça, mon loup! 😂🔥",
      emojis: ["😂", "🔥", "🦫"],
      tags: ["Humour", "Quebec", "Funny"],
      flagged: false,
      reply: "C'est tiguidou! Continue comme ça, mon ami! 🇨🇦",
    },
    rant: {
      caption: "Tabarnak! Je comprends ton point, c'est vrai en esti! 😤🔥",
      emojis: ["😤", "💢", "🔥"],
      tags: ["Rant", "Real", "Quebec"],
      flagged: false,
      reply: "C'est ben correct de se défouler! Je suis avec toi! ⚜️",
    },
    event: {
      caption: "Ça va être malade! Tout le monde au rendez-vous! 🎉⚜️",
      emojis: ["🎉", "⚜️", "🦫", "🇨🇦"],
      tags: ["Event", "MTL", "Quebec"],
      flagged: false,
      reply: "Nice event! J'espère que ça va être hot en esti! 🔥",
    },
    ad: {
      caption: "Check ça! C'est sick comme offre! 💰🔥",
      emojis: ["💰", "🔥", "⚜️"],
      tags: ["Deal", "Quebec", "Local"],
      flagged: false,
      reply: "Belle promo! Supporte local, c'est important! 🇨🇦",
    },
    poem: {
      caption: "Des mots qui touchent le cœur québécois... 📝💙",
      emojis: ["📝", "💙", "⚜️", "🦫"],
      tags: ["Poesie", "Quebec", "Culture"],
      flagged: false,
      reply: "Wow! T'as du talent, mon ami! Continue d'écrire! ✨",
    },
  };

  return (
    responses[input.intent] || {
      caption: `${input.text} 🔥⚜️`,
      emojis: ["🔥", "⚜️", "🦫"],
      tags: ["Quebec", "Zyeute"],
      flagged: false,
      reply: "C'est ben correct ça! Continue comme ça! 🇨🇦",
    }
  );
}
