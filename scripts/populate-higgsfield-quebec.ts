#!/usr/bin/env tsx

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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
    content: "Le Cirque du Soleil, acrobates performant sur scene avec lumieres",
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
    content: "La migration des bernaches du Canada au vol au dessus de l'eau, spectacle naturel québécois",
    hashtags: ["bernaches", "oies", "migration", "nature", "fleuve"],
    reactions: 560,
  },
  {
    caption: "🍺 Microbrasseries du Québec — on goûte la bière artisanale! 🍻 Santé!",
    content: "Pinte de bière artisanale fraiche et petillante servie sur un comptoir en bois de microbrasserie",
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

async function generateHiggsfieldVideo(prompt: string): Promise<string | null> {
  try {
    const { stdout: createOut } = await execAsync(`higgsfield generate create kling3_0 --prompt "Photorealistic cinematic 8k video of: ${prompt}" --json`);
    const jobId = JSON.parse(createOut)[0];
    console.log(`[Job ${jobId}] Started for prompt: ${prompt.slice(0, 30)}...`);
    
    while (true) {
      await new Promise(r => setTimeout(r, 10000)); // Poll every 10s
      const { stdout: waitOut } = await execAsync(`higgsfield generate wait ${jobId} --json`);
      const result = JSON.parse(waitOut);
      if (result.status === "completed") {
        console.log(`[Job ${jobId}] Completed!`);
        return result.result_url;
      }
      if (result.status === "failed") {
        console.error(`[Job ${jobId}] Failed!`);
        return null;
      }
    }
  } catch (error: any) {
    console.error(`Failed Higgsfield generation: ${error.message}`);
    return null;
  }
}

async function populateFeed() {
  console.log("⚜️  Starting Higgsfield Quebec feed population...\n");

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

  console.log("🗑️  Cleaning up old Quebec posts...");
  const { error: deleteError } = await supabase.from("publications").delete().eq("hive_id", "quebec");
  if (deleteError) {
    console.error("❌ Failed to delete old posts", deleteError);
  } else {
    console.log("✅ Cleared old Quebec feed.");
  }

  let inserted = 0;

  console.log("🚀 Launching AI video generation jobs in parallel...");
  const promises = QUEBEC_POSTS.map(async (post, i) => {
    // Stagger starts slightly so we don't bombard the CLI instantly
    await new Promise(r => setTimeout(r, i * 1500));
    
    const videoUrl = await generateHiggsfieldVideo(post.content);
    if (!videoUrl) {
      console.log(`⚠️ Failed video generation for: ${post.caption.slice(0, 30)}...`);
      return;
    }

    const { error } = await supabase.from("publications").insert([{
      id: randomUUID(),
      user_id: userId,
      type: "video",
      media_url: videoUrl,
      original_url: videoUrl,
      thumbnail_url: "/demo/branding.png", // fallback thumbnail
      content: post.content,
      caption: post.caption,
      hashtags: post.hashtags,
      hive_id: "quebec",
      visibility: "public",
      est_masque: false,
      moderation_approved: true,
      processing_status: "completed",
      ai_generated: true,
      reactions_count: post.reactions,
      comments_count: Math.floor(post.reactions * 0.08),
      shares_count: Math.floor(post.reactions * 0.03),
      view_count: Math.floor(post.reactions * 12),
      viral_score: Math.floor(post.reactions / 100),
      created_at: randomCreatedAt(),
    }]);

    if (error) {
      console.error(`  ❌ Failed to insert "${post.caption.slice(0, 40)}": ${error.message}`);
    } else {
      console.log(`  ✅ Inserted: ${post.caption.slice(0, 55)}...`);
      inserted++;
    }
  });

  await Promise.all(promises);

  console.log(`\n🎉 Done! Inserted ${inserted} new high-end Higgsfield AI videos.`);
}

populateFeed().catch((err) => {
  console.error("💥 Fatal error:", err.message || err);
  process.exit(1);
});
