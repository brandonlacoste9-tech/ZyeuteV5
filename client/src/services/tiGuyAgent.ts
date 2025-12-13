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

import OpenAI from 'openai';
import { logger } from '@/lib/logger';

const tiGuyAgentLogger = logger.withContext('TiGuyAgent');

// Initialize OpenAI client
// NOTE: Using client-side OpenAI is for demo/development purposes
// In production, this should be moved to a server-side endpoint to protect the API key
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true // SECURITY WARNING: Exposes API key in client code. Use server-side proxy in production.
}) : null;

export type TiGuyInput = {
  text: string;
  intent: 'joke' | 'rant' | 'event' | 'ad' | 'poem';
};

export type TiGuyResponse = {
  caption: string;
  emojis: string[];
  tags: string[];
  flagged: boolean;
  reply: string;
};

/**
 * Ti-Guy Agent - Generate Quebec-style content using AI
 * @param input - User text and intent for content generation
 * @returns Response with caption, emojis, tags, moderation flag, and Ti-Guy's reply
 */
export const TiGuyAgent = async (input: TiGuyInput): Promise<TiGuyResponse | null> => {
  // Demo mode if no API key
  if (!openai) {
    tiGuyAgentLogger.warn('⚠️ No OpenAI API Key found. Using demo response.');
    return generateDemoResponse(input);
  }

  try {
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4 Omni (latest multimodal model)
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: "json_object" } // Ensure JSON response
    });

    const content = response.choices[0].message?.content ?? '';
    const parsed = JSON.parse(content) as TiGuyResponse;
    
    // Validate response structure
    if (!parsed.caption || !Array.isArray(parsed.emojis) || !Array.isArray(parsed.tags)) {
      tiGuyAgentLogger.error('Invalid Ti-Guy response structure:', parsed);
      return generateDemoResponse(input);
    }
    
    return parsed;
  } catch (error) {
    tiGuyAgentLogger.error('Ti-Guy Error:', error);
    return null;
  }
};

/**
 * Generate a demo response when OpenAI is not available
 */
function generateDemoResponse(input: TiGuyInput): TiGuyResponse {
  const responses: Record<TiGuyInput['intent'], TiGuyResponse> = {
    joke: {
      caption: "Haha! C'est ben drôle ça, mon loup! 😂🔥",
      emojis: ['😂', '🔥', '🦫'],
      tags: ['Humour', 'Quebec', 'Funny'],
      flagged: false,
      reply: "C'est tiguidou! Continue comme ça, mon ami! 🇨🇦"
    },
    rant: {
      caption: "Tabarnak! Je comprends ton point, c'est vrai en esti! 😤🔥",
      emojis: ['😤', '💢', '🔥'],
      tags: ['Rant', 'Real', 'Quebec'],
      flagged: false,
      reply: "C'est ben correct de se défouler! Je suis avec toi! ⚜️"
    },
    event: {
      caption: "Ça va être malade! Tout le monde au rendez-vous! 🎉⚜️",
      emojis: ['🎉', '⚜️', '🦫', '🇨🇦'],
      tags: ['Event', 'MTL', 'Quebec'],
      flagged: false,
      reply: "Nice event! J'espère que ça va être hot en esti! 🔥"
    },
    ad: {
      caption: "Check ça! C'est sick comme offre! 💰🔥",
      emojis: ['💰', '🔥', '⚜️'],
      tags: ['Deal', 'Quebec', 'Local'],
      flagged: false,
      reply: "Belle promo! Supporte local, c'est important! 🇨🇦"
    },
    poem: {
      caption: "Des mots qui touchent le cœur québécois... 📝💙",
      emojis: ['📝', '💙', '⚜️', '🍁'],
      tags: ['Poesie', 'Quebec', 'Culture'],
      flagged: false,
      reply: "Wow! T'as du talent, mon ami! Continue d'écrire! ✨"
    }
  };

  return responses[input.intent] || {
    caption: `${input.text} 🔥⚜️`,
    emojis: ['🔥', '⚜️', '🦫'],
    tags: ['Quebec', 'Zyeute'],
    flagged: false,
    reply: "C'est ben correct ça! Continue comme ça! 🇨🇦"
  };
}
