import dotenv from "dotenv";
import fetch from "node-fetch";
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env.local") });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const PEXELS_API_KEY = process.env.PEXELS_API_KEY?.replace(/['"]/g, '');

const TIKTOK_CATEGORIES = [
  { term: "dance choreography", caption: "Hit that move! 💃🔥 POV: when the beat drops #Dance #Viral", hashtags: ["dance", "viral", "fyp"] },
  { term: "cute puppy playing", caption: "I can't handle the cuteness 🥺🐶 #Puppy #Cute", hashtags: ["puppy", "cute", "fyp"] },
  { term: "satisfying cooking", caption: "This is SO satisfying to watch 🤤🍳 #FoodTok", hashtags: ["foodtok", "satisfying", "recipe"] },
  { term: "workout gym fitness", caption: "No excuses! 💪🏋️ Day 365 #GymTok", hashtags: ["gym", "fitness", "motivation"] },
  { term: "funny reaction", caption: "His face 😂😂 I'm CRYING #Funny", hashtags: ["funny", "comedy", "viral"] },
];

function getBestVideo(videoFiles: any[]) {
  const portraits = videoFiles.filter((f) => f.height > f.width && f.file_type === "video/mp4").sort((a, b) => b.height - a.height);
  if (portraits.length > 0) return { url: portraits[0].link, width: portraits[0].width, height: portraits[0].height };
  const hd = videoFiles.find((f) => f.quality === "hd" && f.file_type === "video/mp4");
  if (hd) return { url: hd.link, width: hd.width, height: hd.height };
  const any = videoFiles.find((f) => f.file_type === "video/mp4");
  return any ? { url: any.link, width: any.width, height: any.height } : null;
}

function randomEngagement() {
  return {
    reactions_count: Math.floor(Math.random() * 8000) + 100,
    view_count: Math.floor(Math.random() * 50000) + 500,
    shares_count: Math.floor(Math.random() * 500),
    viral_score: Math.floor(Math.random() * 100),
  };
}

async function main() {
  const videos = [];
  const fallbackUserId = "27e6a0ec-4b73-45d7-b391-9e831a210524"; // System user

  for (const item of TIKTOK_CATEGORIES) {
    try {
      const response = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(item.term)}&per_page=2&orientation=portrait`,
        { headers: { Authorization: PEXELS_API_KEY! } }
      );
      if (!response.ok) {
        console.error(`Pexels API Error for ${item.term}: ${response.status} ${await response.text()}`);
        continue;
      }
      const data: any = await response.json();
      
      for (const video of data.videos || []) {
        const best = getBestVideo(video.video_files);
        if (!best) continue;

        videos.push({
          caption: item.caption,
          content: item.caption,
          media_url: best.url,
          original_url: best.url,
          thumbnail_url: video.video_pictures?.[0]?.picture || video.image || "",
          hive_id: "quebec",
          user_id: fallbackUserId,
          hashtags: JSON.stringify(item.hashtags),
          duration: video.duration || 30,
          ...randomEngagement()
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  fs.writeFileSync("tiktoks.json", JSON.stringify({ videos }, null, 2));
  console.log(`Saved ${videos.length} TikTok-style videos to tiktoks.json`);
}

main();
