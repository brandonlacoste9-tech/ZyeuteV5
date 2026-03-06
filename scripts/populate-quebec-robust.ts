#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";
import { feedAutoGenerator } from "../backend/services/feed-auto-generator.js";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const QUEBEC_VIDEOS = [
  {
    caption:
      "🌅 Le soleil se couche sur le Fleuve Saint-Laurent. Magnifique Québec! ⚜️",
    content: "Coucher de soleil sur le fleuve Saint-Laurent",
    mediaUrl:
      "https://player.vimeo.com/external/371835672.sd.mp4?s=636da9b422f4f9d7c8c9d2e3b6f8b9c9d8e7f6a5&profile_id=164&oauth2_token_id=57447761",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=720",
    reactions: 1200,
  },
  {
    caption: "🌲 L'automne québécois est magique. Regarde ces couleurs! 🍂",
    content: "Forêt québécoise en automne",
    mediaUrl:
      "https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a77dbc4f0b8c8f6e8e7f8a9b0c1d2e3&profile_id=164&oauth2_token_id=57447761",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=720",
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
    reactions: 750,
  },
  {
    caption:
      "🍟 La poutine parfaite n'existe pas... SI! Celle-ci est parfaite! 🧀",
    content: "Poutine québécoise",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1547584370-2cc98b8b8dc8?w=720",
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
    reactions: 1500,
  },
  {
    caption: "🎭 Le Carnaval de Québec est de retour! Bonhomme nous attend! 🧤",
    content: "Carnaval de Québec",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=720",
    reactions: 1800,
  },
  {
    caption: "🌃 Montréal la nuit, c'est magique. La skyline qui s'illumine ✨",
    content: "Skyline de Montréal",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1519178256752-0fa684c5c4c7?w=720",
    reactions: 950,
  },
  {
    caption: "🚶‍♂️ Une balade dans le Vieux-Montréal, nos rues historiques 💒",
    content: "Vieux-Montréal",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=720",
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
    reactions: 820,
  },
  {
    caption: "🏒 Le hockey, c'est notre religion au Québec! Go Habs Go! 🔴🔵⚪",
    content: "Hockey au Québec",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=720",
    reactions: 3200,
  },
  {
    caption: "⛷️ Ski au Mont-Tremblant! La meilleure neige au monde 🎿",
    content: "Ski au Québec",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=720",
    reactions: 1100,
  },
  {
    caption: "🎿 Patinage au lac gelé. Vive l'hiver québécois! ⛸️",
    content: "Patinage extérieur",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1516961642265-531546e84af2?w=720",
    reactions: 780,
  },
  {
    caption:
      "🗣️ Le joual, c'est notre identité! Tabarnouche qu'on est fiers! ⚜️",
    content: "Fierté québécoise",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=720",
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
    reactions: 3400,
  },
];

async function run() {
  console.log("⚜️ Starting Robust Quebec Feed Population...");

  // 1. Get system user: ti_guy_bot
  const { data: userData } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", "ti_guy_bot")
    .single();

  let systemUserId = userData?.id;

  if (!systemUserId) {
    console.log("Creating system user (ti_guy_bot)...");
    const { data: newUser, error: createError } = await supabase
      .from("user_profiles")
      .insert({
        id: randomUUID(),
        username: "ti_guy_bot",
        email: "bot@zyeute.com",
        display_name: "Ti-Guy ⚜️",
        role: "citoyen",
        hive_id: "quebec",
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create user:", createError.message);
      process.exit(1);
    }
    systemUserId = newUser.id;
  }

  console.log(`👤 System User: ${systemUserId}`);

  // 2. Add videos with duplicate check
  for (const video of QUEBEC_VIDEOS) {
    const { data: existing } = await supabase
      .from("publications")
      .select("id")
      .eq("caption", video.caption)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⏭️  Skipping: ${video.caption.substring(0, 40)}...`);
      continue;
    }

    const { error: insertError } = await supabase.from("publications").insert({
      user_id: systemUserId,
      media_url: video.mediaUrl,
      thumbnail_url: video.thumbnailUrl,
      type: "video",
      caption: video.caption,
      content: video.content,
      visibility: "public",
      hive_id: "quebec",
      processing_status: "completed",
      ai_generated: false,
      aspect_ratio: "16:9",
      duration: 30,
      reactions_count: video.reactions,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error(`❌ Error adding video: ${insertError.message}`);
    } else {
      console.log(`✅ Added: ${video.caption.substring(0, 40)}...`);
    }
  }

  console.log("\n🤖 Triggering AI Video Generation...");
  try {
    const result = await feedAutoGenerator.generateNow(3);
    console.log(
      `AI Result: Generated ${result.generated}, Errors ${result.errors}`,
    );
  } catch (err: any) {
    console.error("AI Generation failed:", err.message);
  }

  console.log("\n✨ Mission Complete.");
}

run();
