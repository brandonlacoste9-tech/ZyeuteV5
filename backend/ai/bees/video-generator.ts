/**
 * 🎬 Video Generator Bee
 * Enables Ti-Guy to generate short videos using AI
 * Delegates to video-engine.ts (FAL.ai/Kling) — single source of truth.
 */

import { z } from "zod";
import { generateVideo } from "../media/video-engine.js";

// Video generation request schema
export const VideoGenerationSchema = z.object({
  prompt: z.string().min(1).max(500),
  duration: z.enum(["5", "10"]).default("5"), // seconds
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("9:16"), // vertical for social
  style: z
    .enum([
      "realistic",
      "cinematic",
      "animated",
      "quebec-winter",
      "urban-montreal",
    ])
    .optional(),
});

export type VideoGenerationRequest = z.infer<typeof VideoGenerationSchema>;

// Quebec-themed video prompt enhancers
const QUEBEC_VIDEO_ENHANCERS: Record<string, string> = {
  "quebec-winter":
    "Canadian winter scene, snow falling gently, cozy atmosphere, Quebec landscape",
  "urban-montreal":
    "Montreal cityscape, vibrant urban life, Saint-Laurent street, Mount Royal view",
  realistic: "photorealistic, cinematic quality, natural lighting, high detail",
  cinematic: "cinematic, dramatic lighting, film grain, professional quality",
  animated: "animated style, smooth motion, vibrant colors, artistic",
};

/**
 * Ti-Guy Video Generator Bee
 * Creates short-form videos with Quebec cultural awareness
 */
export class VideoGeneratorBee {
  constructor() {
    if (!process.env.FAL_API_KEY) {
      console.warn(
        "🦫 Ti-Guy: FAL_API_KEY pas configuré - génération vidéo désactivée",
      );
    }
  }

  /**
   * Enhance prompt with Quebec elements
   */
  private enhancePrompt(prompt: string, style?: string): string {
    let enhanced = prompt;

    if (style && QUEBEC_VIDEO_ENHANCERS[style]) {
      enhanced = `${enhanced}, ${QUEBEC_VIDEO_ENHANCERS[style]}`;
    }

    // Add quality tags for video
    enhanced = `${enhanced}, smooth motion, high quality, detailed`;

    return enhanced;
  }

  /**
   * Generate a video from text prompt
   */
  async generate(request: VideoGenerationRequest): Promise<{
    success: boolean;
    videoUrl?: string;
    prompt?: string;
    duration?: string;
    error?: string;
    cost?: number;
  }> {
    if (!process.env.FAL_API_KEY) {
      return {
        success: false,
        error: "FAL API key not configured",
      };
    }

    const finalPrompt = this.enhancePrompt(request.prompt, request.style);

    console.log(
      `🦫 Ti-Guy: J'crée ton vidéo... "${request.prompt.substring(0, 50)}..."`,
    );

    try {
      const result = await generateVideo({
        prompt: finalPrompt,
        duration: Number(request.duration),
        modelHint: "kling",
      });

      return {
        success: true,
        videoUrl: result.url,
        prompt: finalPrompt,
        duration: request.duration,
        cost: result.cost,
      };
    } catch (error) {
      console.error("🦫 Ti-Guy: Erreur de génération vidéo:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate a video from an image (image-to-video)
   */
  async imageToVideo(
    imageUrl: string,
    motion: string = "gentle zoom",
  ): Promise<{
    success: boolean;
    videoUrl?: string;
    error?: string;
  }> {
    if (!process.env.FAL_API_KEY) {
      return { success: false, error: "FAL API key not configured" };
    }

    console.log(`🦫 Ti-Guy: J'anime ton image...`);

    try {
      const result = await generateVideo({
        prompt: motion,
        imageUrl,
        duration: 5,
        modelHint: "kling",
      });

      return {
        success: true,
        videoUrl: result.url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get Quebec-themed video ideas
   */
  getQuebecVideoIdeas(): string[] {
    return [
      "Neige qui tombe doucement sur le Vieux-Montréal",
      "Timelapse du lever de soleil sur le Mont-Royal",
      "Cascade dans les Laurentides en automne",
      "Rue Saint-Denis animée un soir d'été",
      "Aurores boréales au-dessus d'un lac québécois",
      "Cabane à sucre avec de la vapeur qui s'échappe",
      "Match de hockey des Canadiens avec la foule",
      "Festival d'été de Québec avec des confettis",
      "Promenade sur les Plaines d'Abraham",
      "Vue aérienne du Château Frontenac en hiver",
    ];
  }
}

/**
 * Bee task runner for Hive Mind integration
 */
export async function run(task: any) {
  const payload = task.payload || {};
  const prompt = payload.prompt || payload.message || "";
  const duration = payload.duration || "5";
  const aspectRatio = payload.aspectRatio || "9:16";
  const style = payload.style;
  const type = payload.type || "text-to-video";

  const bee = new VideoGeneratorBee();

  let result;

  switch (type) {
    case "image-to-video":
      result = await bee.imageToVideo(payload.imageUrl, payload.motion);
      break;
    case "ideas":
      return {
        response: formatIdeasResponse(bee.getQuebecVideoIdeas()),
        ideas: bee.getQuebecVideoIdeas(),
        metadata: { bee: "video-generator", type: "ideas" },
      };
    default:
      result = await bee.generate({ prompt, duration, aspectRatio, style });
  }

  return {
    response: formatVideoResponse(result),
    ...result,
    metadata: { bee: "video-generator", type, duration, aspectRatio },
  };
}

function formatVideoResponse(result: {
  success: boolean;
  videoUrl?: string;
  error?: string;
}): string {
  if (!result.success) {
    return `Ayoye! J'ai pas pu créer ton vidéo: ${result.error}. Les vidéos c'est plus long, réessaie! 🎬`;
  }
  return `Tadam! 🎬 Voici ton vidéo! Ça a pris du temps mais ça valait la peine! 🦫✨`;
}

function formatIdeasResponse(ideas: string[]): string {
  const randomIdeas = ideas.sort(() => 0.5 - Math.random()).slice(0, 3);
  return `Voici quelques idées de vidéos québécoises:\n\n${randomIdeas.map((idea, i) => `${i + 1}. ${idea}`).join("\n")}\n\nLaquelle te tente? 🎬🦫`;
}

export const videoGeneratorBee = new VideoGeneratorBee();
