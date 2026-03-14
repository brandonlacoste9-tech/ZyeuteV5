#!/usr/bin/env tsx
/**
 * Generate Wan Video
 * Manually trigger Wan AI video generation and post to feed
 */

import { config } from "dotenv";
import { join } from "path";
import { randomUUID } from "crypto";

// Load env FIRST
config({ path: join(__dirname, "../.env") });

async function main() {
  // Dynamic imports AFTER env is loaded
  const { generateVideo } = await import("../backend/ai/media/video-engine.js");
  const { storage } = await import("../backend/storage.js");
  
  const prompt = process.argv[2] || "Cinematic 4k video of a futuristic cyberpunk Montreal at night, neon lights in red and black, hyper-realistic, WanVideo style.";
  
  console.log("Zyeuté Wan AI Video Generator");
  console.log("============================");
  console.log(`Prompt: ${prompt}`);
  console.log(`FAL_KEY: ${process.env.FAL_KEY ? "Set" : "Not set"}\n`);

  if (!process.env.FAL_KEY) {
    console.error("FAL_KEY not set! Add it to .env");
    process.exit(1);
  }

  try {
    console.log("Step 1: Generating video with Wan (FAL)...");
    const videoResult = await generateVideo({
      prompt,
      modelHint: "wan",
      duration: 5
    });

    if (videoResult.model === "placeholder" || !videoResult.url) {
      throw new Error("Video generation not available - check FAL_KEY");
    }
    console.log(`✅ Video Generated: ${videoResult.url}`);

    console.log("Step 2: Posting to feed...");
    
    let systemUserId = await storage.getSystemUserId();
    if (!systemUserId) {
      console.log("Creating system user 'wan_bot'...");
      const systemUser = await storage.createUser({
        id: randomUUID(),
        username: "wan_bot",
        email: "wan@zyeute.com",
        displayName: "Wan AI",
        role: "citoyen",
      } as any);
      systemUserId = systemUser.id;
      await storage.setSystemUserId(systemUserId);
    }

    const post = await storage.createPost({
      userId: systemUserId,
      mediaUrl: videoResult.url,
      thumbnailUrl: videoResult.url.replace(".mp4", ".jpg"), // Rough guess or Fal might provide one
      type: "video",
      caption: `Généré par Wan AI: ${prompt} #Zyeute #WanVideo #AI`,
      content: prompt,
      visibility: "public",
      hiveId: "global",
      processingStatus: "completed",
      aiGenerated: true,
      aspectRatio: "9:16",
      duration: 5,
    } as any);

    console.log(`\n🚀 Success! Posted to feed: ${post.id}`);
    console.log(`View it in the app soon!`);

  } catch (error: any) {
    console.error(`\n❌ Failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
