#!/usr/bin/env tsx
/**
 * 🎬 Generate Quebec Videos
 * Manually trigger AI video generation for the feed
 */

import { config } from "dotenv";
import { join } from "path";
import { generateVideo } from "../backend/ai/media/video-engine.js";
import { generateImage } from "../backend/ai/vertex-service.js";
import { storage } from "../backend/storage.js";
import { logger } from "../backend/utils/logger.js";
import { randomUUID } from "crypto";

config({ path: join(__dirname, "../.env") });

const log = logger.withContext("GenerateVideos");

/**
 * Quebec video themes with prompts
 */
const QUEBEC_THEMES = [
  {
    title: "Coucher de soleil sur le Fleuve",
    imagePrompt:
      "Beautiful sunset over Saint Lawrence River, Montreal skyline silhouette, orange and purple sky, cinematic",
    videoPrompt:
      "Gentle camera movement, river waves, clouds moving slowly, golden hour lighting",
  },
  {
    title: "Hiver Québécois",
    imagePrompt:
      "Snow falling in Montreal, cozy winter scene, soft white snow, warm lights from windows",
    videoPrompt:
      "Snowflakes falling gently, subtle camera drift, peaceful winter atmosphere",
  },
  {
    title: "Forêt en Automne",
    imagePrompt:
      "Quebec forest in autumn, vibrant red and orange maple trees, golden sunlight",
    videoPrompt:
      "Leaves falling slowly, gentle wind movement, warm golden light",
  },
  {
    title: "Poutine Parfaite",
    imagePrompt:
      "Delicious poutine close-up, cheese curds, rich brown gravy, crispy fries, steam rising",
    videoPrompt:
      "Steam rising slowly, gentle camera movement, appetizing food shot",
  },
  {
    title: "Cabane à Sucre",
    imagePrompt:
      "Traditional Quebec sugar shack, maple trees, wooden cabin, spring season",
    videoPrompt:
      "Steam from maple syrup boiling, peaceful countryside, warm atmosphere",
  },
  {
    title: "Vieux-Québec",
    imagePrompt:
      "Old Quebec city at night, Château Frontenac, cobblestone streets, warm lights",
    videoPrompt:
      "Night lights twinkling, gentle camera movement, romantic atmosphere",
  },
];

/**
 * TI-GUY style captions in joual
 */
const CAPTION_TEMPLATES = [
  "{theme} 🍁 C'est ça le Québec! ⚜️ #Zyeute #Quebec",
  "Osti que c'est beau! {theme} 🦫 #Quebec #JOUAL",
  "Tabarnouche! {theme} 🇨🇦 #ZyeuteV5 #QuebecLife",
  "Regarde-moi ça! {theme} ⚜️ #Quebec #Viral",
  "C'est la vie au Québec! {theme} 🍁 #Zyeute",
];

async function generateQuebecVideo(theme: (typeof QUEBEC_THEMES)[0]) {
  console.log(`\n🎬 Generating: ${theme.title}`);
  console.log(`   Image: ${theme.imagePrompt.substring(0, 60)}...`);

  try {
    // 1. Generate image
    console.log("   Step 1: Generating image...");
    const imageResult = await generateImage({
      prompt: theme.imagePrompt,
      aspectRatio: "9:16",
    });

    if (!imageResult?.imageUrl) {
      throw new Error("Image generation failed");
    }
    console.log(`   ✅ Image: ${imageResult.imageUrl.substring(0, 60)}...`);

    // 2. Generate video from image
    console.log("   Step 2: Generating video (this takes 30-60s)...");
    const videoResult = await generateVideo({
      prompt: theme.videoPrompt,
      imageUrl: imageResult.imageUrl,
      duration: 5,
    });

    if (videoResult.model === "placeholder" || !videoResult.url) {
      throw new Error("Video generation not available - check FAL_API_KEY");
    }
    console.log(`   ✅ Video: ${videoResult.url.substring(0, 60)}...`);

    // 3. Generate caption
    const captionTemplate =
      CAPTION_TEMPLATES[Math.floor(Math.random() * CAPTION_TEMPLATES.length)];
    const caption = captionTemplate.replace("{theme}", theme.title);

    return {
      title: theme.title,
      imageUrl: imageResult.imageUrl,
      videoUrl: videoResult.url,
      caption,
      cost: videoResult.cost,
    };
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
    return null;
  }
}

async function postToFeed(videoData: any) {
  try {
    // Get or create system user
    let systemUserId = await storage.getSystemUserId();
    if (!systemUserId) {
      const systemUser = await storage.createUser({
        id: randomUUID(),
        username: "zyeute_quebec",
        email: "quebec@zyeute.com",
        displayName: "Zyeuté Québec 🍁",
        role: "citoyen",
      });
      systemUserId = systemUser.id;
      await storage.setSystemUserId(systemUserId);
    }

    // Create post
    const post = await storage.createPost({
      userId: systemUserId,
      mediaUrl: videoData.videoUrl,
      thumbnailUrl: videoData.imageUrl,
      type: "video",
      caption: videoData.caption,
      content: videoData.title,
      visibility: "public",
      hiveId: "quebec",
      processingStatus: "completed",
      aiGenerated: true,
      aspectRatio: "9:16",
      duration: 5,
    } as any);

    return post.id;
  } catch (error: any) {
    console.error(`   ❌ Failed to post: ${error.message}`);
    return null;
  }
}

async function main() {
  const count = parseInt(process.argv[2]) || 3;

  console.log("🍁 Zyeuté AI Video Generator");
  console.log("═══════════════════════════════");
  console.log(
    `FAL_API_KEY: ${process.env.FAL_API_KEY ? "✅ Set" : "❌ Not set"}`,
  );
  console.log(`Generating: ${count} Quebec videos\n`);

  if (!process.env.FAL_API_KEY) {
    console.error("❌ FAL_API_KEY not set! Add it to .env");
    process.exit(1);
  }

  // Shuffle themes and pick requested count
  const shuffled = [...QUEBEC_THEMES].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  let generated = 0;
  let posted = 0;
  let totalCost = 0;

  for (const theme of selected) {
    const video = await generateQuebecVideo(theme);

    if (video) {
      generated++;
      totalCost += video.cost || 0;

      // Post to feed
      const postId = await postToFeed(video);
      if (postId) {
        posted++;
        console.log(`   📤 Posted to feed: ${postId}`);
      }
    }
  }

  console.log("\n═══════════════════════════════");
  console.log(`🎉 Done! Generated: ${generated}, Posted: ${posted}`);
  console.log(`💰 Total cost: ~$${totalCost.toFixed(2)}`);
  console.log("\nCheck your feed at: /feed");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
