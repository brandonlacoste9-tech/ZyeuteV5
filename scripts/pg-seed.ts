import pg from "pg";
import { randomUUID } from "crypto";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env.local") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No DATABASE_URL found!");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

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
];

async function run() {
  const client = await pool.connect();
  try {
    console.log("Connected to DB directly!");

    // 1. Get or create system user
    let res = await client.query(`SELECT id FROM user_profiles WHERE username = 'zyeute_ai' LIMIT 1`);
    let userId;
    
    if (res.rows.length === 0) {
      const newId = randomUUID();
      await client.query(`
        INSERT INTO user_profiles (id, username, email, display_name, role, hive_id)
        VALUES ($1, 'zyeute_ai', 'ai@zyeute.com', 'Zyeuté AI 🤖', 'admin', 'quebec')
      `, [newId]);
      userId = newId;
      console.log("Created zyeute_ai user:", userId);
    } else {
      userId = res.rows[0].id;
      console.log("Found existing user:", userId);
    }

    // 2. Insert posts
    let inserted = 0;
    for (let i = 0; i < QUEBEC_POSTS.length; i++) {
      const post = QUEBEC_POSTS[i];
      const existRes = await client.query(`SELECT id FROM publications WHERE caption = $1 LIMIT 1`, [post.caption]);
      
      if (existRes.rows.length > 0) {
        console.log(`Skipping: ${post.caption.slice(0, 30)}...`);
        continue;
      }

      const videoUrl = GOOGLE_CDN_VIDEOS[i % GOOGLE_CDN_VIDEOS.length];
      const thumbnailUrl = SAMPLE_THUMBNAILS[i % SAMPLE_THUMBNAILS.length];

      await client.query(`
        INSERT INTO publications (
          id, user_id, type, media_url, original_url, thumbnail_url,
          content, caption, hashtags, hive_id, visibility, est_masque,
          moderation_approved, processing_status, ai_generated,
          reactions_count, view_count, viral_score
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
      `, [
        randomUUID(), userId, 'video', videoUrl, videoUrl, thumbnailUrl,
        post.content, post.caption, JSON.stringify(post.hashtags), 'quebec', 'public', false,
        true, 'completed', false,
        post.reactions, post.reactions * 12, post.reactions / 100
      ]);
      inserted++;
      console.log(`Inserted: ${post.caption.slice(0, 40)}...`);
    }

    console.log(`Successfully seeded ${inserted} posts directly to DB!`);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
