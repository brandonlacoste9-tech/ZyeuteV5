/**
 * OpenAI Service
 * Handles text generation, captioning, and hashtags using GPT-4o
 */

import OpenAI from 'openai';
import { logger } from '@/lib/logger';

const openaiServiceLogger = logger.withContext('OpenAIService');

// Initialize OpenAI
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Required for client-side usage (Note: Server-side preferred in prod)
}) : null;

/**
 * Generate a caption for an image or topic
 */
export async function generateCaption(topic: string, tone: string = 'fun'): Promise<string> {
  if (!openai) {
    openaiServiceLogger.warn('⚠️ No OpenAI API Key found. Using mock response.');
    return "Wow! C'est vraiment malade! 🔥 #Quebec #Fun";
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // or gpt-4-turbo / gpt-3.5-turbo
      messages: [
        {
          role: "system",
          content: "Tu es un expert des médias sociaux québécois. Tu parles joual léger, tu utilises des expressions locales et des emojis."
        },
        {
          role: "user",
          content: `Génère une courte légende Instagram amusante sur le sujet: "${topic}". Ton: ${tone}. Ajoute 2-3 emojis.`
        }
      ],
      max_tokens: 150,
    });

    return response.choices[0].message.content || "Impossible de générer la légende.";
  } catch (error) {
    openaiServiceLogger.error('Caption generation error:', error);
    return "Impossible de générer la légende pour le moment. 😅";
  }
}

/**
 * Generate hashtags for a topic
 */
export async function generateHashtags(topic: string): Promise<string[]> {
  if (!openai) {
    return ['#Quebec', '#Zyeute', '#Fun', '#Trending'];
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Génère 5 hashtags populaires pour Instagram liés à "${topic}" dans un contexte québécois. Réponds SEULEMENT avec les hashtags séparés par des espaces (pas de virgules, pas de texte autour).`
        }
      ],
      max_tokens: 50,
    });

    const text = response.choices[0].message.content || "";
    return text.split(' ').filter(tag => tag.startsWith('#'));
  } catch (error) {
    openaiServiceLogger.error('Hashtag generation error:', error);
    return ['#Quebec', '#Zyeute'];
  }
}

/**
 * Analyze an image (stub for compatibility)
 * Note: OpenAI Vision could be implemented here if needed
 */
export async function analyzeImage(file: File): Promise<any> {
  // Moderation is handled by moderationService.ts
  return { safe: true, labels: ['image', 'content'] };
}

