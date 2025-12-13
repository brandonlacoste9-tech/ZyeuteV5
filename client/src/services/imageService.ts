/**
 * AI Image Generation Service (Ti-Guy Artiste)
 * Uses OpenAI DALL-E 3 with robust fallback and demo modes
 */

import { supabase } from '../lib/supabase';
import { logger } from '@/lib/logger';

const imageServiceLogger = logger.withContext('ImageService');
import { toast } from '../components/Toast';

// OpenAI API Key
const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

export interface ImageGenerationResult {
  url: string;
  prompt: string;
  revised_prompt?: string;
  style?: string;
}

/**
 * Generate an image using OpenAI DALL-E 3
 */
export async function generateImage(
  prompt: string,
  style: string = 'cinematic'
): Promise<ImageGenerationResult | null> {
  // 1. Validation
  if (!prompt.trim()) {
    toast.error('Décris ton image d\'abord! 🎨');
    return null;
  }

  // 2. Demo Mode (if no API key)
  if (!openaiKey) {
    imageServiceLogger.warn('⚠️ No OpenAI API Key found. Using Demo Mode.');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
    
    toast.success('🎨 Mode Démo: Image générée!');
    return {
      url: `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/1024`,
      prompt,
      style,
      revised_prompt: `(Démo) ${prompt} - Style ${style} québécois`
    };
  }

  try {
    // 3. Enhance Prompt for Quebec Context
    const enhancedPrompt = `${prompt}, style ${style}, high quality, detailed. 
    CONTEXTE QUÉBÉCOIS: Include subtle Quebec elements if fitting (snow, nature, architecture).`;

    // 4. Call OpenAI DALL-E 3
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0]?.url;
    const revisedPrompt = data.data[0]?.revised_prompt;

    if (!imageUrl) {
      throw new Error('No image URL returned');
    }

    toast.success('🎨 Image générée avec succès!');
    return {
      url: imageUrl,
      prompt,
      revised_prompt: revisedPrompt || enhancedPrompt,
      style
    };

  } catch (error: any) {
    imageServiceLogger.error('Image generation error:', error);
    toast.error('Erreur de création. Réessaie!');
    
    // Fallback to demo image
    return {
      url: `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/1024`,
      prompt,
      style,
      revised_prompt: `(Fallback) ${prompt}`
    };
  }
}

/**
 * Remix an existing image
 */
export async function remixImage(imageUrl: string, mode: 'quebec' | 'meme' | 'vintage'): Promise<string | null> {
  toast.info('Remix en cours... 🎨');
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  // Return original for demo, in prod would be processed URL
  return imageUrl;
}
