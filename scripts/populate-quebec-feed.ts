#!/usr/bin/env tsx
/**
 * ⚜️ Populate Quebec Feed — TikTok-Style Video Seeder
 * Seeds the Zyeuté feed with diverse Quebec-themed videos.
 * Uses Google CDN & Pexels MP4s — CORS-safe, no domain blocks.
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env FIRST
config({ path: join(__dirname, "../.env") });
config({ path: join(__dirname, "../.env.local"), override: true });

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://[REF].supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is not set!");
  console.error("   Fill it in at .env → SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Stable CORS-safe video sources ────────────────────────────────
// Google CDN sample videos — publicly served with proper CORS headers
const GOOGLE_CDN_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
];

const SAMPLE_THUMBNAILS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=720&h=1280&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=720&h=1280&fit=crop",
  "https://images.unsplash.com/photo-1477601263568-180e2c6d046e?w=720&h=1280&fit=crop",
  "https://images.unsplash.com/photo-1547584370-2cc98b8b8dc8?w=720&h=1280&fit=crop",
  "https://images.unsplash.com/photo-1519177746063-c07a0b24130d?w=720&h=1280&fit=crop",
  "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=720&h=1280&fit=crop",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=720&h=1280&fit=crop",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=720&h=1280&fit=crop",
  "https://images.unsplash.com/photo-1516961642265-531546e84af2?w=720&h=1280&fit=crop",
  "https://images.unsplash.com/photo-1533089860892-a7c6f081396a?w=720&h=1280&fit=crop",
  "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=720&h=1280&fit=crop",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=720&h=1280&fit=crop",
];

const QUEBEC_POSTS = [
  {
    caption: "🌅 Le soleil se couche sur le Fleuve Saint-Laurent. Magnifique Québec! ⚜️",
    content: "Coucher de soleil majestueux sur le fleuve Saint-Laurent, couleurs orange et violet",
    hashtags: ["nature", "fleuve", "coucher-soleil", "stlaurent", "quebec"],
    reactions: 1200,
  },
  {
    caption: "❄️ Premier matin de neige à Montréal — la ville devient magique 🏙️",
    content: "La première neige transforme les rues de Montréal en carte postale hivernale",
    hashtags: ["montreal", "hiver", "neige", "magie", "quebec"],
    reactions: 890,
  },
  {
    caption: "🍁 Le temps des sucres est arrivé! Petit déjeuner à la cabane! 🧇 #Quebec #Erable",
    content: "Les traditions québécoises du temps des sucres reviennent chaque printemps",
    hashtags: ["erable", "printemps", "tradition", "cabane", "quebec"],
    reactions: 1200,
  },
  {
    caption: "⚜️ La Chute-Montmorency est plus haute que le Niagara! 🌊 #VoyageQuebec",
    content: "Découvrez la majestueuse Chute-Montmorency, joyau naturel du Québec",
    hashtags: ["chutes", "nature", "voyage", "montmorency", "quebec"],
    reactions: 950,
  },
  {
    caption: "🎸 Ambiance de feu au Festival d'été de Québec! 🎶 On lâche pas! #FEQ",
    content: "Le Festival d'été de Québec bat son plein avec des milliers de festivaliers",
    hashtags: ["festival", "musique", "ete", "feq", "quebec"],
    reactions: 2100,
  },
  {
    caption: "⛸️ Patiner sur le lac gelé à Mont-Tremblant. ❄️ Le vrai hiver québécois!",
    content: "Une journée parfaite de patinage sur glace au coeur des Laurentides",
    hashtags: ["patin", "hiver", "tremblant", "laurentides", "quebec"],
    reactions: 840,
  },
  {
    caption: "🏙️ Montréal vue du Mont-Royal au coucher du soleil. 😍 Ma ville, ma fierté!",
    content: "Le panorama inégalable de Montréal depuis le sommet du Mont-Royal",
    hashtags: ["montreal", "ville", "vue", "montroyal", "quebec"],
    reactions: 3200,
  },
  {
    caption: "🥞 Brunch au Plateau, rien de mieux qu'un dimanche matin relax! ☕",
    content: "Les meilleurs restaurants brunch du Plateau-Mont-Royal à Montréal",
    hashtags: ["brunch", "montreal", "cafe", "plateau", "foodie"],
    reactions: 670,
  },
  {
    caption: "🎭 Cirque du Soleil — quand Montréal illumine le monde entier! ✨",
    content: "Le Cirque du Soleil, fierté québécoise reconnue sur tous les continents",
    hashtags: ["cirque", "montreal", "arts", "culture", "spectacle"],
    reactions: 1800,
  },
  {
    caption: "🌲 Randonnée dans le Parc National de la Mauricie — la nature sauvage! 🐻",
    content: "Les sentiers spectaculaires du Parc National de la Mauricie en automne",
    hashtags: ["randonnee", "nature", "mauricie", "parc", "foret"],
    reactions: 1100,
  },
  {
    caption: "🦆 Les oies bernaches arrivent dans le fleuve! Signal du printemps 🌿",
    content: "La migration des bernaches du Canada, spectacle naturel québécois",
    hashtags: ["bernaches", "oies", "migration", "nature", "fleuve"],
    reactions: 560,
  },
  {
    caption: "🍺 Microbrasseries du Québec — on goûte la bière artisanale! 🍻 Santé!",
    content: "Le Québec compte plus de 250 microbrasseries, un véritable eldorado brassicole",
    hashtags: ["biere", "microbrasserie", "craft", "quebec", "sante"],
    reactions: 1450,
  },
  {
    caption: "🚗 Roadtrip sur la route 132 en Gaspésie, paysages à couper le souffle! 🌊",
    content: "Une voiture roule sur une route côtière pittoresque de la Gaspésie, avec la mer et des falaises au coucher du soleil",
    hashtags: ["gaspesie", "roadtrip", "voyage", "quebec", "route132"],
    reactions: 1050,
  },
  {
    caption: "🧀 Une bonne poutine bien chaude de chez nous! 😍",
    content: "Une délicieuse poutine québécoise fumante, fromage en grains frais, frites croustillantes, sauce brune",
    hashtags: ["poutine", "food", "quebec", "fromage"],
    reactions: 2300,
  },
  {
    caption: "🦌 Un orignal aperçu dans la brume matinale... Wow! 🌲",
    content: "Un majestueux orignal avec d'immenses bois se tient dans une forêt brumeuse au lever du soleil",
    hashtags: ["orignal", "nature", "faune", "quebec", "forêt"],
    reactions: 4500,
  },
  {
    caption: "🎆 L'International des Feux Loto-Québec illumine le pont Jacques-Cartier! 🎇",
    content: "Spectacle pyrotechnique éclatant au-dessus du fleuve Saint-Laurent et du pont Jacques-Cartier la nuit",
    hashtags: ["feux", "montreal", "spectacle", "nuit", "lotoquebec"],
    reactions: 3200,
  }
];

function randomCreatedAt(): string {
  const now = Date.now();
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
  return new Date(fourteenDaysAgo + Math.random() * (now - fourteenDaysAgo)).toISOString();
}

async function populateFeed() {
  console.log("⚜️  Starting Quebec feed population...\n");

  // Step 1: Find a user
  console.log("👤 Step 1: Finding a valid user...");
  const { data: adminUser } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .single();

  let userId = adminUser?.id;
  if (!userId) {
    const { data: anyUser } = await supabase
      .from("user_profiles")
      .select("id")
      .limit(1)
      .single();
    userId = anyUser?.id;
  }

  if (!userId) {
    console.error("❌ No users found. Register a user in the app first, then re-run.");
    process.exit(1);
  }
  console.log(`✅ Using user: ${userId}\n`);

  const falKey = process.env.FAL_API_KEY || process.env.FAL_KEY;
  let imageGeneratorBee: any = null;
  let generateVideo: any = null;

  if (falKey) {
    console.log("🤖 FAL_KEY detected — AI video generation is ENABLED.");
    const imgBeeModule = await import("../backend/ai/bees/image-generator.js");
    imageGeneratorBee = new imgBeeModule.ImageGeneratorBee();
    const vidEngineModule = await import("../backend/ai/media/video-engine.js");
    generateVideo = vidEngineModule.generateVideo;
  } else {
    console.log("ℹ️  No FAL_KEY found — using Google CDN & Pexels fallback videos.\n");
  }

  // Step 3: Check existing posts
  const { data: existingPosts } = await supabase
    .from("publications")
    .select("caption")
    .eq("hive_id", "quebec")
    .not("caption", "is", null);

  const existingCaptions = new Set((existingPosts || []).map((p) => p.caption));
  console.log(`📊 Found ${existingCaptions.size} existing Quebec posts in DB.\n`);

  // Step 4: Insert posts
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < QUEBEC_POSTS.length; i++) {
    const post = QUEBEC_POSTS[i];

    if (existingCaptions.has(post.caption)) {
      console.log(`  ⏭️  Skipping existing: ${post.caption.slice(0, 50)}...`);
      skipped++;
      continue;
    }

    let videoUrl = GOOGLE_CDN_VIDEOS[i % GOOGLE_CDN_VIDEOS.length];
    let thumbnailUrl = SAMPLE_THUMBNAILS[i % SAMPLE_THUMBNAILS.length];
    let aiGenerated = false;

    if (falKey && imageGeneratorBee && generateVideo) {
      console.log(`  🤖 Generating AI video for: ${post.caption.slice(0, 30)}...`);
      try {
        const imageResult = await imageGeneratorBee.generate({
          prompt: post.content,
          size: "portrait",
          enhancePrompt: true,
        });

        if (imageResult.success && imageResult.imageUrl) {
          const videoResult = await generateVideo({
            prompt: post.content,
            imageUrl: imageResult.imageUrl,
            duration: 5,
          });

          if (videoResult && videoResult.url && videoResult.model !== "placeholder") {
            videoUrl = videoResult.url;
            thumbnailUrl = imageResult.imageUrl;
            aiGenerated = true;
            console.log(`  ✅ AI Video generated successfully!`);
          } else {
            console.log(`  ⚠️ AI Video generation returned placeholder. Using fallback.`);
          }
        }
      } catch (err: any) {
        console.log(`  ❌ AI Generation failed: ${err.message}. Using fallback.`);
      }
    }

    const { error } = await supabase.from("publications").insert([{
      id: randomUUID(),
      user_id: userId,
      type: "video",                     // ✅ Required for check-videos.ts & type filters
      media_url: videoUrl,
      original_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      content: post.content,
      caption: post.caption,
      hashtags: post.hashtags,
      hive_id: "quebec",
      visibility: "public",              // ✅ Required for feed filters
      est_masque: false,                 // ✅ Required for feed filters
      moderation_approved: true,         // ✅ Required for moderation checks
      processing_status: "completed",    // ✅ Required for feed to show it
      ai_generated: aiGenerated,
      reactions_count: post.reactions,
      comments_count: Math.floor(post.reactions * 0.08),
      shares_count: Math.floor(post.reactions * 0.03),
      view_count: Math.floor(post.reactions * 12),
      viral_score: Math.floor(post.reactions / 100), // ✅ Used for feed ranking
      created_at: randomCreatedAt(),
    }]);

    if (error) {
      console.error(`  ❌ Failed to insert "${post.caption.slice(0, 40)}": ${error.message}`);
    } else {
      console.log(`  ✅ Inserted: ${post.caption.slice(0, 55)}...`);
      inserted++;
    }
  }

  console.log(`\n🎉 Done! Inserted ${inserted} new posts, skipped ${skipped} existing.`);

  // Step 5: Verify final count
  const { count } = await supabase
    .from("publications")
    .select("*", { count: "exact", head: true })
    .eq("hive_id", "quebec")
    .eq("type", "video")
    .eq("processing_status", "completed");

  console.log(`📊 Quebec feed now has ${count ?? 0} completed videos ready to display.`);
}

populateFeed().catch((err) => {
  console.error("💥 Fatal error:", err.message || err);
  process.exit(1);
});
