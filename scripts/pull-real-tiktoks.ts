import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import TikAPI from "tikapi";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env.local") });

function extractMetadataFromDesc(desc: string) {
  const hashtags = Array.from(desc.matchAll(/#([\w\u00C0-\u017F_]+)/g)).map(m => m[1].toLowerCase());
  
  const d = desc.toLowerCase();
  let city: string | null = null;
  let regionId: string | null = null;
  let region: string | null = null;

  if (d.includes("montreal") || d.includes("mtl") || d.includes("514")) {
    city = "Montréal"; region = "Montréal"; regionId = "montreal";
  } else if (d.includes("quebec city") || d.includes("ville de quebec") || d.includes("vieuxquebec")) {
    city = "Québec"; region = "Capitale-Nationale"; regionId = "quebec";
  } else if (d.includes("laval") || d.includes("450")) {
    city = "Laval"; region = "Laval"; regionId = "laval";
  } else if (d.includes("gatineau") || d.includes("819")) {
    city = "Gatineau"; region = "Outaouais"; regionId = "gatineau";
  } else if (d.includes("sherbrooke")) {
    city = "Sherbrooke"; region = "Estrie"; regionId = "sherbrooke";
  }

  return { hashtags, city, region, regionId };
}

async function pullRealTikToks() {
  console.log("Pulling real TikToks using TikAPI...");
  const api = TikAPI("lHEExX2WHHuDg5UuUavbDpOVEkCa5twyQUtEfbUuvw7pzNn3");

  const queries = [
    "montreal street interview",
    "laval food",
    "quebec city vlog",
    "sherbrooke campus",
    "gatineau nature",
    "quebec viral"
  ];

  let allFormattedVideos: any[] = [];

  for (const query of queries) {
    try {
      const res = await (api as any).public.search({
        category: "videos",
        query: query
      });

      const items = res?.json?.item_list || [];
      console.log(`Found ${items.length} videos from TikAPI for query "${query}"!`);

      const formattedVideos = items.slice(0, 5).map((item: any) => {
        const handle = item.author?.uniqueId || item.author?.unique_id || "unknown";
        const desc = item.desc || "";
        const { hashtags, city, region, regionId } = extractMetadataFromDesc(desc);

        return {
          id: randomUUID(),
          user_id: "27e6a0ec-4b73-45d7-b391-9e831a210524", // Fallback user ID
          caption: desc,
          content: desc,
          content_fr: desc,
          hashtags,
          city,
          region,
          region_id: regionId || "quebec",
          media_url: item.video?.playAddr || item.video?.play_addr?.url_list?.[0] || "",
          original_url: `https://www.tiktok.com/@${handle}/video/${item.id || item.aweme_id}`,
          thumbnail_url: item.video?.cover || item.video?.cover?.url_list?.[0] || "",
          type: "video",
          hive_id: "quebec",
          visibility: "public",
          est_masque: false,
          processing_status: "completed",
          reactions_count: item.stats?.diggCount || item.statistics?.digg_count || 0,
          view_count: item.stats?.playCount || item.statistics?.play_count || 0,
          shares_count: item.stats?.shareCount || item.statistics?.share_count || 0,
          comments_count: item.stats?.commentCount || item.statistics?.comment_count || 0,
          moderation_approved: true,
          video_source: "tiktok"
        };
      }).filter((v: any) => v.media_url);

      allFormattedVideos = allFormattedVideos.concat(formattedVideos);
    } catch(e: any) {
      console.error(`TikAPI Error for query "${query}":`, e.message);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  fs.writeFileSync("real-tiktoks.json", JSON.stringify({ videos: allFormattedVideos }, null, 2));
  console.log(`Saved ${allFormattedVideos.length} formatted TikToks to real-tiktoks.json`);
}

pullRealTikToks();
