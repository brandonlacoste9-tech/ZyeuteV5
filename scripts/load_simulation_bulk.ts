#!/usr/bin/env tsx
/**
 * Zyeuté Load Simulation Bulk Script
 * Uses pg directly with verified schema to populate the 'publications' table.
 */

import "dotenv/config";
import pg from "pg";
import { randomUUID } from "crypto";

const { Client } = pg;

const SAMPLE_VIDEOS = [
  "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-city-4006-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-height-of-a-bird-4434-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-waves-reaching-the-sandy-shore-of-the-beach-4428-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-white-light-on-a-black-background-4433-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-urban-traffic-at-night-4431-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-landscape-of-mountains-surrounded-by-clouds-4430-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-winter-forest-with-trees-covered-in-snow-4429-large.mp4",
];

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1517732359359-a557d402BBCC?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1514565131-4ce0824400af?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000",
];

const TI_GUY_INSIGHTS = [
  "C'est du prestige, ça. La vibe est impeccable. On sent l'intelligence du Swarm ici.",
  "Un peu chaotique, mais j'aime ça. Ça va buzzer fort dans le Hive de Montréal.",
  "Esthétique 10/10. Ti-Guy approuve ce look industriel.",
  "Voyez-vous la symétrie? C'est le genre de pattern que le Colony OS adore analyser.",
  "Une poutine de contenu : riche, chaud et un peu trop bon pour ton propre bien.",
  "Le mouvement ici suggère une croissance rapide du réseau. Restez branchés.",
  "Regarde ça, c'est ce qu'on appelle la Souveraineté Digitale en action.",
];

async function runSimulation() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("🚀 Initializing Load Simulation: Verified Schema Mode\n");
    await client.connect();

    // 1. Find a test user
    const userRes = await client.query("SELECT id FROM user_profiles LIMIT 1");
    let userId;

    if (userRes.rows.length === 0) {
      console.log("👤 No user found, creating test participant...");
      userId = randomUUID();
      await client.query(
        "INSERT INTO user_profiles (id, username, display_name, region) VALUES ($1, $2, $3, $4)",
        [userId, "swarmsim_alpha", "Swarm Simulator Alpha", "quebec"],
      );
    } else {
      userId = userRes.rows[0].id;
      console.log(`👤 Using existing participant: ${userId}`);
    }

    console.log(
      "📦 Injecting 50 high-quality mixed media publications (25 Videos / 25 Photos)...",
    );

    for (let i = 0; i < 50; i++) {
      const isVideo = i % 2 === 0;
      const mediaUrl = isVideo
        ? SAMPLE_VIDEOS[Math.floor(i / 2) % SAMPLE_VIDEOS.length]
        : SAMPLE_IMAGES[Math.floor(i / 2) % SAMPLE_IMAGES.length];

      const insight = TI_GUY_INSIGHTS[i % TI_GUY_INSIGHTS.length];
      const type = isVideo ? "video" : "photo";
      const caption = `[SIM] ${isVideo ? "Video" : "Photo"} #${i + 1}: Global Hive Expansion ${i % 5 === 0 ? "🚀" : "🔥"}`;

      await client.query(
        `INSERT INTO publications (
            id, user_id, media_url, content, caption, ai_description, 
            reactions_count, visibilite, est_masque, created_at, hive_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - interval '${i * 10} minutes', $10)`,
        [
          randomUUID(),
          userId,
          mediaUrl,
          caption,
          caption,
          insight,
          Math.floor(Math.random() * 5000),
          "public",
          false,
          "quebec",
        ],
      );

      if ((i + 1) % 10 === 0) {
        console.log(`   ✅ Progress: ${i + 1}/50 posts injected.`);
      }
    }

    console.log("\n🔥 LOAD SIMULATION COMPLETE!");
  } catch (error: any) {
    console.error("❌ Simulation CRASH:", error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

runSimulation();
