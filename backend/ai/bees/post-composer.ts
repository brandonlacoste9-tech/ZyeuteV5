/**
 * Post Composer Bee
 * Composes complete posts with caption and optional image
 */

import { v3TiGuy, v3Feed } from "../../v3-swarm.js";
import { generateImage } from "../media/image-engine.js";

export async function run(task: any) {
  const payload = task.payload || {};
  const prompt = payload.prompt || "Share something about Quebec";
  const includeImage = payload.includeImage !== false;

  console.log("[Post Composer] Composing post:", prompt.substring(0, 50));

  try {
    // Generate feed-style content
    const feedContent = await v3Feed({ prompt, style: "social post" });

    // Transform to Ti-Guy voice
    const caption = await v3TiGuy(feedContent.body, "social media");

    let imageUrl = null;
    let imageCost = 0;

    // Generate image if requested and we have a prompt
    if (includeImage && feedContent.suggested_image_prompt) {
      try {
        const imageResult = await generateImage({
          prompt: feedContent.suggested_image_prompt,
        });
        imageUrl = imageResult.url;
        imageCost = imageResult.cost;
      } catch (imgError: any) {
        console.warn(
          "[Post Composer] Image generation failed:",
          imgError.message,
        );
      }
    }

    return {
      caption,
      title: feedContent.title,
      tags: feedContent.tags,
      contentType: feedContent.content_type,
      imageUrl,
      metadata: {
        model: "deepseek",
        bee: "post-composer",
        cost: imageCost,
      },
    };
  } catch (error: any) {
    console.error("[Post Composer] Error:", error.message);
    throw error;
  }
}
