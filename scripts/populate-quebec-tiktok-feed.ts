/**
 * Zyeuté V5 - Quebec TikTok Feed Populater
 *
 * Objective: Fetch real content from TikTok (via TikAPI) and Pexels
 * filtered for Quebec/Montreal culture and inject it into the Zyeuté feed.
 *
 * Usage: npx tsx scripts/populate-quebec-tiktok-feed.ts
 */

import "dotenv/config";
import pg from "pg";
import TikAPI from "tikapi";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const { Pool } = pg;

// 1. Configuration
const TIKAPI_KEY =
  process.env.TIKAPI_KEY || "VTeqFTRgu4MIQ4p1eKKVr7cQSmfiVET9GOt9ZvWGMLVFenIR";
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const DATABASE_URL =
  process.env.DATABASE_URL || process.env.DATABASE_URL_NON_POOLING;

if (!DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL missing.");
  process.exit(1);
}

// 2. Initialize Clients
const api = TikAPI(TIKAPI_KEY);
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Quebec-themed keywords for search
const QUEBEC_KEYWORDS = [
  "Quebec",
  "Montreal",
  "Ville de Québec",
  "Montréal",
  "Gaspésie",
  "Saguenay",
  "Laval",
  "Sherbrooke",
];

const QUEBEC_HASHTAGS = [
  "quebec",
  "montreal",
  "qc",
  "quebeccity",
  "mtl",
  "quebecoise",
  "quebecois",
];

async function getSystemUserId(client: any) {
  // Find an admin or system user to attribute these posts to
  const { rows } = await client.query(
    "SELECT id FROM users WHERE role = 'founder' OR role = 'moderator' LIMIT 1",
  );
  if (rows.length > 0) return rows[0].id;

  // Fallback: create or find any user
  const { rows: anyUser } = await client.query("SELECT id FROM users LIMIT 1");
  return anyUser[0]?.id;
}

async function populateFeed() {
  console.log("🚀 STARTING QUEBEC FEED POPULATION...");
  const client = await pool.connect();

  try {
    const systemUserId = await getSystemUserId(client);
    if (!systemUserId) {
      console.error(
        "❌ No user found to attribute posts to. Please create a user first.",
      );
      return;
    }

    // --- PHASE 1: TikAPI (Real TikToks) ---
    console.log("📱 Fetching from TikTok via TikAPI...");
    let tiktokItems: any[] = [];

    for (const tag of QUEBEC_HASHTAGS.slice(0, 3)) {
      try {
        console.log(`   🔍 Searching hashtag: #${tag}`);
        const response: any = await api.public.hashtag({
          name: tag,
          count: 10,
        });

        if (response?.item_list) {
          tiktokItems = [...tiktokItems, ...response.item_list];
        }
      } catch (e) {
        console.error(`   ⚠️ Failed to fetch #${tag}:`, e);
      }
    }

    // --- PHASE 2: Pexels Fallback ---
    console.log("🎥 Fetching fallback content from Pexels...");
    let pexelsItems: any[] = [];
    if (PEXELS_API_KEY) {
      try {
        const response = await axios.get(
          "https://api.pexels.com/videos/search",
          {
            headers: { Authorization: PEXELS_API_KEY },
            params: {
              query: "Quebec Montreal City",
              per_page: 20,
              orientation: "portrait",
            },
          },
        );
        pexelsItems = response.data.videos || [];
      } catch (e) {
        console.error("   ⚠️ Pexels fetch failed:", e);
      }
    }

    // --- PHASE 3: Injection ---
    let injectedCount = 0;

    // Inject TikToks
    for (const item of tiktokItems) {
      const videoUrl =
        item.video?.play_addr?.url_list?.[0] ||
        item.video?.download_addr?.url_list?.[0];
      const thumbUrl = item.video?.cover?.url_list?.[0];

      if (!videoUrl) continue;

      try {
        await client.query(
          `
          INSERT INTO publications (
            id, user_id, type, media_url, original_url, thumbnail_url,
            caption, hashtags, processing_status, hive_id, region, city,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `,
          [
            uuidv4(),
            systemUserId,
            "video",
            videoUrl,
            videoUrl,
            thumbUrl,
            item.desc || "Découvre le Québec! ⚜️",
            item.text_extra
              ?.map((e: any) => e.hashtag_name)
              .filter(Boolean) || ["quebec"],
            "completed",
            "quebec",
            "Quebec",
            item.author?.nickname || "TikTok",
          ],
        );
        injectedCount++;
      } catch (e) {
        // Skip errors for individual items
      }
    }

    // Inject Pexels
    for (const video of pexelsItems) {
      const file =
        video.video_files.find((f: any) => f.quality === "hd") ||
        video.video_files[0];
      if (!file) continue;

      try {
        await client.query(
          `
          INSERT INTO publications (
            id, user_id, type, media_url, original_url, thumbnail_url,
            caption, hashtags, processing_status, hive_id, region,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `,
          [
            uuidv4(),
            systemUserId,
            "video",
            file.link,
            file.link,
            video.image,
            "Vues magnifiques du Québec ⚜️ #Pexels",
            ["quebec", "nature"],
            "completed",
            "quebec",
            "Quebec",
          ],
        );
        injectedCount++;
      } catch (e) {
        // Skip
      }
    }

    console.log(
      `\n✅ SUCCESS: Injected ${injectedCount} new Quebec videos into the feed.`,
    );
  } catch (err) {
    console.error("❌ FATAL ERROR:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

populateFeed().catch(console.error);
