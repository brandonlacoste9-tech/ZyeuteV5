import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "../.env") });
config({ path: join(__dirname, "../.env.local"), override: true });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const QUEBEC_POSTS = [
  "🌅 Le soleil se couche sur le Fleuve Saint-Laurent. Magnifique Québec! ⚜️",
  "❄️ Premier matin de neige à Montréal — la ville devient magique 🏙️",
  "🍁 Le temps des sucres est arrivé! Petit déjeuner à la cabane! 🧇 #Quebec #Erable",
  "⚜️ La Chute-Montmorency est plus haute que le Niagara! 🌊 #VoyageQuebec",
  "🎸 Ambiance de feu au Festival d'été de Québec! 🎶 On lâche pas! #FEQ",
  "⛸️ Patiner sur le lac gelé à Mont-Tremblant. ❄️ Le vrai hiver québécois!",
  "🏙️ Montréal vue du Mont-Royal au coucher du soleil. 😍 Ma ville, ma fierté!",
  "🥞 Brunch au Plateau, rien de mieux qu'un dimanche matin relax! ☕",
  "🎭 Cirque du Soleil — quand Montréal illumine le monde entier! ✨",
  "🌲 Randonnée dans le Parc National de la Mauricie — la nature sauvage! 🐻",
  "🦆 Les oies bernaches arrivent dans le fleuve! Signal du printemps 🌿",
  "🍺 Microbrasseries du Québec — on goûte la bière artisanale! 🍻 Santé!",
  "🚗 Roadtrip sur la route 132 en Gaspésie, paysages à couper le souffle! 🌊",
  "🧀 Une bonne poutine bien chaude de chez nous! 😍",
  "🦌 Un orignal aperçu dans la brume matinale... Wow! 🌲",
  "🎆 L'International des Feux Loto-Québec illumine le pont Jacques-Cartier! 🎇"
];

async function run() {
  const { data, error } = await supabase
    .from("publications")
    .delete()
    .in("caption", QUEBEC_POSTS);

  if (error) {
    console.error("Error deleting:", error);
  } else {
    console.log("Deleted old posts successfully.");
  }
}

run();
