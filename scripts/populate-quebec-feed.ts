#!/usr/bin/env tsx
/**
 * ⚜️ Populate Quebec Feed
 * Adds high-quality Quebec-themed videos to the feed
 * Uses a mix of sample videos and AI generation
 */

import { config } from "dotenv";
import { join } from "path";
import { feedAutoGenerator } from "../backend/services/feed-auto-generator.js";
import { storage } from "../backend/storage.js";
import { logger } from "../backend/utils/logger.js";
import { randomUUID } from "crypto";

config({ path: join(__dirname, "../.env") });

const log = logger.withContext("PopulateQuebec");

/**
 * Curated Quebec video content
 * Mix of public domain videos and AI-generated content themes
 */
const QUEBEC_VIDEOS = [
  // Nature & Landscapes
  {
    caption:
      "🌅 Le soleil se couche sur le Fleuve Saint-Laurent. Magnifique Québec! ⚜️",
    content: "Coucher de soleil sur le fleuve Saint-Laurent",
    mediaUrl:
      "https://player.vimeo.com/external/371835672.sd.mp4?s=636da9b422f4f9d7c8c9d2e3b6f8b9c9d8e7f6a5&profile_id=164&oauth2_token_id=57447761",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=720",
    tags: ["nature", "fleuve", "coucher-soleil"],
    reactions: 1200,
  },
  {
    caption: "🌲 L'automne québécois est magique. Regarde ces couleurs! 🍂",
    content: "Forêt québécoise en automne",
    mediaUrl:
      "https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a77dbc4f0b8c8f6e8e7f8a9b0c1d2e3&profile_id=164&oauth2_token_id=57447761",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=720",
    tags: ["automne", "nature", "arbres"],
    reactions: 890,
  },
  {
    caption:
      "❄️ L'hiver au Québec, c'est ça! La neige qui tombe doucement sur Montréal 🌨️",
    content: "Neige à Montréal",
    mediaUrl:
      "https://player.vimeo.com/external/451855980.sd.mp4?s=f4e5d6c7b8a9e8f7a6b5c4d3e2f1a0b9c8d7e6f5&profile_id=164&oauth2_token_id=57447761",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1477601263568-180e2c6d046e?w=720",
    tags: ["hiver", "neige", "montreal"],
    reactions: 750,
  },

  // Culture & Food
  {
    caption:
      "🍟 La poutine parfaite n'existe pas... SI! Celle-ci est parfaite! 🧀",
    content: "Poutine québécoise",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1547584370-2cc98b8b8dc8?w=720",
    tags: ["poutine", "food", "quebec"],
    reactions: 2100,
  },
  {
    caption:
      "🥞 Temps des sucres! Rien de meilleur que le sirop d'érable frais 🍯",
    content: "Cabane à sucre au Québec",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=720",
    tags: ["sucre", "cabane", "printemps"],
    reactions: 1500,
  },
  {
    caption: "🎭 Le Carnaval de Québec est de retour! Bonhomme nous attend! 🧤",
    content: "Carnaval de Québec",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=720",
    tags: ["carnaval", "hiver", "fete"],
    reactions: 1800,
  },

  // Urban & City Life
  {
    caption: "🌃 Montréal la nuit, c'est magique. La skyline qui s'illumine ✨",
    content: "Skyline de Montréal",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1519178256752-0fa684c5c4c7?w=720",
    tags: ["montreal", "nuit", "ville"],
    reactions: 950,
  },
  {
    caption: "🚶‍♂️ Une balade dans le Vieux-Montréal, nos rues historiques 💒",
    content: "Vieux-Montréal",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=720",
    tags: ["vieux-montreal", "histoire", "architecture"],
    reactions: 670,
  },
  {
    caption:
      "🎨 La culture street art de Montréal! Notre ville est un musée à ciel ouvert 🖌️",
    content: "Street art Montréal",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=720",
    tags: ["art", "street", "culture"],
    reactions: 820,
  },

  // Sports & Activities
  {
    caption: "🏒 Le hockey, c'est notre religion au Québec! Go Habs Go! 🔴🔵⚪",
    content: "Hockey au Québec",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=720",
    tags: ["hockey", "habs", "sport"],
    reactions: 3200,
  },
  {
    caption: "⛷️ Ski au Mont-Tremblant! La meilleure neige au monde 🎿",
    content: "Ski au Québec",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=720",
    tags: ["ski", "tremblant", "sport"],
    reactions: 1100,
  },
  {
    caption: "🎿 Patinage au lac gelé. Vive l'hiver québécois! ⛸️",
    content: "Patinage extérieur",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1516961642265-531546e84af2?w=720",
    tags: ["patin", "hiver", "lac"],
    reactions: 780,
  },

  // Music & Festivals
  {
    caption: "🎵 Festival d'été de Québec! La meilleure ambiance de l'été ☀️",
    content: "Festival d'été Québec",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=720",
    tags: ["festival", "musique", "ete"],
    reactions: 1450,
  },
  {
    caption: "🎸 Osheaga! Le plus grand festival de musique de Montréal 🎶",
    content: "Festival Osheaga",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=720",
    tags: ["osheaga", "musique", "festival"],
    reactions: 1300,
  },

  // Language & Identity
  {
    caption:
      "🗣️ Le joual, c'est notre identité! Tabarnouche qu'on est fiers! ⚜️",
    content: "Fierté québécoise",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=720",
    tags: ["joual", "langue", "fierte"],
    reactions: 2100,
  },
  {
    caption:
      "⚜️ Fleurdelisé! Notre drapeau, notre fierté. Vive le Québec libre! ⚜️",
    content: "Drapeau du Québec",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1550931937-2dfd45a40da1?w=720",
    tags: ["drapeau", "fleurdelise", "quebec"],
    reactions: 3400,
  },
];

async function populateFeed() {
  console.log("⚜️ Populating Zyeuté with Quebec Videos...\n");

  try {
    // Get or create system user
    let systemUserId = await storage.getSystemUserId();
    if (!systemUserId) {
      const systemUser = await storage.createUser({
        id: randomUUID(),
        username: "zyeute_quebec",
        email: "quebec@zyeute.com",
        displayName: "Zyeuté Québec ⚜️",
        role: "citoyen",
      });
      systemUserId = systemUser.id;
      await storage.setSystemUserId(systemUserId);
      log.info(`Created system user: ${systemUserId}`);
    }

    console.log(`📊 Adding ${QUEBEC_VIDEOS.length} Quebec videos...\n`);

    let added = 0;
    let errors = 0;

    for (const video of QUEBEC_VIDEOS) {
      try {
        // Note: In production, you'd check for duplicates here

        // Create post
        await storage.createPost({
          userId: systemUserId,
          mediaUrl: video.mediaUrl,
          thumbnailUrl: video.thumbnailUrl,
          type: "video",
          caption: video.caption,
          content: video.content,
          visibility: "public",
          hiveId: "quebec",
          processingStatus: "completed",
          aiGenerated: false,
          aspectRatio: "16:9",
          duration: 30,
          reactionsCount: video.reactions,
          createdAt: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
          ), // Random time in last 7 days
        } as any);

        console.log(`✅ Added: ${video.caption.substring(0, 50)}...`);
        added++;
      } catch (error: any) {
        console.log(`❌ Error adding video: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n🎉 Done! Added ${added} videos, ${errors} errors`);

    // Also trigger AI generation for more variety
    console.log("\n🤖 Triggering AI video generation...");
    const genResult = await feedAutoGenerator.generateNow(3);
    console.log(
      `   Generated: ${genResult.generated}, Errors: ${genResult.errors}`,
    );

    console.log("\n✨ Quebec feed populated successfully!");
    console.log("   Check the feed at: /feed");
  } catch (error: any) {
    log.error("Failed to populate feed:", error);
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

populateFeed();
