/**
 * Quebecify Existing Content
 * Update video captions to authentic Quebec French
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://vuanulvyqkfefmjcikfk.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 🍁 AUTHENTIC QUEBEC CAPTIONS by category
const QUEBEC_CAPTIONS: Record<string, string[]> = {
  "montreal city": [
    "Montréal, la métropole du Québec! 🏙️⚜️ #Montreal #Quebec",
    "Les rues de Montréal! 🇨🇦❤️ #MTL #Quebec",
    "Ma belle ville de Montréal! 🍁✨ #Montreal",
  ],
  "nature": [
    "La nature québécoise! 🌲🍂 #Nature #Quebec",
    "Paysage du Québec! 🏔️⚜️ #Paysage #Nature",
    "La belle province! 🌲🦌 #Quebec #Nature",
  ],
  "urban": [
    "Ambiance urbaine à Montréal! 🌃✨ #Urban #MTL",
    "La vie de quartier! 🏘️❤️ #Montreal #Vie",
  ],
  "night": [
    "Montréal la nuit! 🌙✨ #Nightlife #Montreal",
    "Les lumières de la ville! 🌃⚜️ #Lumiere",
  ],
  "travel": [
    "Découvrir le Québec! 🗺️🍁 #Voyage #Quebec",
    "Roadtrip au Québec! 🚗💨 #Voyage",
  ],
  "dance": [
    "Danse et culture! 💃🎵 #Danse #Culture",
    "Expression libre! 🎭✨ #Art #Danse",
  ],
  "default": [
    "Contenu québécois! 🍁⚜️ #Quebec #Zyeute",
    "Made in Quebec! 🇨🇦❤️ #Quebec",
    "La belle province! 🍁✨ #Quebec",
    "Zyeuté! 👀⚜️ #Quebec #Content",
    "Vive le Québec! 🍁❤️ #Quebec",
    "Culture québécoise! ⚜️🎭 #Culture",
    "Moment québécois! ☕🍁 #Moment",
    "L'esprit du Québec! 🍁✨ #Esprit",
  ],
};

function getQuebecCaption(category: string): string {
  const captions = QUEBEC_CAPTIONS[category] || QUEBEC_CAPTIONS["default"];
  return captions[Math.floor(Math.random() * captions.length)];
}

function categorizeContent(caption: string): string {
  const lower = caption.toLowerCase();
  if (lower.includes("montreal") || lower.includes("city")) return "montreal city";
  if (lower.includes("nature") || lower.includes("forest")) return "nature";
  if (lower.includes("urban") || lower.includes("street")) return "urban";
  if (lower.includes("night") || lower.includes("light")) return "night";
  if (lower.includes("travel") || lower.includes("trip")) return "travel";
  if (lower.includes("dance")) return "dance";
  return "default";
}

async function quebecifyContent() {
  console.log("🍁 QUEBECIFYING EXISTING CONTENT!");
  console.log("=================================\n");

  // Get recent videos without Quebec hashtags
  const { data: posts, error } = await supabase
    .from("publications")
    .select("id, caption, content")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !posts) {
    console.error("❌ Error fetching posts:", error?.message);
    return;
  }

  console.log(`Found ${posts.length} posts to update\n`);

  let updated = 0;

  for (const post of posts) {
    const category = categorizeContent(post.caption || "");
    const newCaption = getQuebecCaption(category);

    const { error: updateError } = await supabase
      .from("publications")
      .update({
        caption: newCaption,
        content: newCaption,
      })
      .eq("id", post.id);

    if (updateError) {
      console.error(`❌ Failed to update ${post.id?.slice(0, 8)}:`, updateError.message);
    } else {
      console.log(`✅ ${post.id?.slice(0, 8)}... → "${newCaption.substring(0, 40)}..."`);
      updated++;
    }
  }

  console.log(`\n✨ DONE! Updated ${updated} posts with Quebec captions!`);
  console.log("🔄 Refresh your app to see the changes!");
}

quebecifyContent().catch(console.error);
