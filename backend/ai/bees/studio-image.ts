/**
 * Studio Image Bee
 * Uses the real Image Engine with FAL/Flux
 */

import { generateImage } from "../media/image-engine.js";

export async function run(task: any) {
  const payload = task.payload || {};
  const prompt = payload.prompt || "A beautiful Quebec landscape";
  const imageSize = payload.imageSize || "square";

  console.log("[Studio Image] Generating image:", prompt.substring(0, 50));

  const result = await generateImage({
    prompt,
    modelHint: "flux",
    imageSize,
  });

  return {
    ...result,
    metadata: { bee: "studio-image" },
  };
}
