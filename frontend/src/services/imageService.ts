/**
 * AI Image Generation Service (Ti-Guy Artiste)
 * Routes all image generation through the backend — no API keys in the browser.
 */

import { logger } from "@/lib/logger";
import { toast } from "../components/Toast";

const imageServiceLogger = logger.withContext("ImageService");

export interface ImageGenerationResult {
  url: string;
  prompt: string;
  revised_prompt?: string;
  style?: string;
}

/**
 * Generate an image via the backend DALL-E proxy endpoint.
 * The OpenAI key lives in process.env.OPENAI_API_KEY on the server and is
 * never bundled into the client JavaScript.
 */
export async function generateImage(
  prompt: string,
  style: string = "cinematic",
): Promise<ImageGenerationResult | null> {
  if (!prompt.trim()) {
    toast.error("Décris ton image d'abord! 🎨");
    return null;
  }

  try {
    const response = await fetch("/api/tiguy/image/dalle", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.trim(), style }),
    });

    if (!response.ok) {
      if (response.status === 503) {
        imageServiceLogger.warn("DALL-E not configured on server, using demo mode.");
        toast.success("🎨 Mode Démo: Image générée!");
        return {
          url: `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/1024`,
          prompt,
          style,
          revised_prompt: `(Démo) ${prompt} - Style ${style} québécois`,
        };
      }
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    toast.success("🎨 Image générée avec succès!");
    return {
      url: data.url,
      prompt,
      revised_prompt: data.revised_prompt,
      style,
    };
  } catch (error: any) {
    imageServiceLogger.error("Image generation error:", error);
    toast.error("Erreur de création. Réessaie!");
    return {
      url: `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/1024`,
      prompt,
      style,
      revised_prompt: `(Fallback) ${prompt}`,
    };
  }
}

/**
 * Remix an existing image
 */
export async function remixImage(
  imageUrl: string,
  mode: "quebec" | "meme" | "vintage",
): Promise<string | null> {
  toast.info("Remix en cours... 🎨");
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Return original for demo, in prod would be processed URL
  return imageUrl;
}
