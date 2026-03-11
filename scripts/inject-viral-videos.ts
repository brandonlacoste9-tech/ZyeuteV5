/**
 * Inject Funny Viral Videos for Zyeuté
 * Viral content, comedy, pets, dance, celebration
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://vuanulvyqkfefmjcikfk.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

if (!PEXELS_API_KEY) {
  console.error("❌ PEXELS_API_KEY missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 😂 FUNNY VIRAL SEARCH TERMS
const VIRAL_QUERIES = [
  {
    term: "funny dog playing",
    caption: "This dog is living his best life! 😂🐕 #Funny #Dog #Viral",
    hashtags: ["funny", "dog", "pet", "viral"]
  },
  {
    term: "cute cat funny",
    caption: "When Monday hits different 😂🐱 #Cat #Funny #Mood",
    hashtags: ["cat", "funny", "cute", "viral"]
  },
  {
    term: "baby laughing funny",
    caption: "This made my day! 😂👶 #Baby #Happy #Joy",
    hashtags: ["baby", "funny", "smile", "viral"]
  },
  {
    term: "dance party celebration",
    caption: "When the beat drops 🔥💃 #Dance #Party #Vibes",
    hashtags: ["dance", "party", "celebration", "viral"]
  },
  {
    term: "friends laughing together",
    caption: "Best friends = best memories 😂🎉 #Friends #Fun #Viral",
    hashtags: ["friends", "funny", "party", "viral"]
  },
  {
    term: "funny squirrel",
    caption: "Nature's funniest creature 🐿️😂 #Squirrel #Funny #Wildlife",
    hashtags: ["squirrel", "funny", "nature", "viral"]
  },
  {
    term: "skateboard fail funny",
    caption: "POV: You're the friend recording 😂🛹 #Skateboard #Fail #Funny",
    hashtags: ["skateboard", "fail", "funny", "viral"]
  },
  {
    term: "prank video funny",
    caption: "Best prank ever! 😂🎬 #Pranks #Funny #Viral",
    hashtags: ["prank", "funny", "comedy", "viral"]
  },
  {
    term: "dance challenge viral",
    caption: "Joining the challenge! 💃🔥 #DanceChallenge #Viral #Trending",
    hashtags: ["dance", "challenge", "viral", "trending"]
  },
  {
    term: "funny bird dancing",
    caption: "This bird has more rhythm than me 🐦💃 #Bird #Funny #Dance",
    hashtags: ["bird", "funny", "dance", "viral"]
  },
  {
    term: "baby dance cute",
    caption: "Baby's first dance moves! 👶💃 #Baby #Cute #Adorable",
    hashtags: ["baby", "dance", "cute", "viral"]
  },
  {
    term: "party confetti celebration",
    caption: "Let's celebrate! 🎊🥳 #Party #Celebration #Fun",
    hashtags: ["party", "confetti", "celebration", "viral"]
  },
  {
    term: "funny hamster",
    caption: "The daily dose of cuteness 🐹😂 #Hamster #Cute #Funny",
    hashtags: ["hamster", "funny", "cute", "viral"]
  },
  {
    term: "slow motion fun",
    caption: "In slow motion everything is funnier 😂🎬 #SlowMo #Funny #Viral",
    hashtags: ["slowmo", "funny", "creative", "viral"]
  },
  {
    term: "water splash funny",
    caption: "Splash! 😂💦 #Summer #Fun #Viral",
    hashtags: ["water", "splash", "summer", "viral"]
  },
  {
    term: "cute puppy playing",
    caption: "Puppy energy = best energy 🐶💪 #Puppy #Cute #Viral",
    hashtags: ["puppy", "cute", "playful", "viral"]
  },
  {
    term: "group dance friends",
    caption: "Squad goals! 💃🕺 #GroupDance #Friends #Viral",
    hashtags: ["dance", "friends", "group", "viral"]
  },
  {
    term: "funny reaction",
    caption: "When they see it 😂📸 #Reaction #Funny #Viral",
    hashtags: ["reaction", "funny", "viral", "trending"]
  },
  {
    term: "celebration fireworks",
    caption: "Big energy! 🎆🎉 #Fireworks #Celebration #Viral",
    hashtags: ["fireworks", "celebration", "viral", "trending"]
  },
  {
    term: "funny monkey",
    caption: "The boss of the jungle 🐒😂 #Monkey #Funny #Wildlife",
    hashtags: ["monkey", "funny", "wildlife", "viral"]
  },
];

interface PexelsVideoFile {
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: PexelsVideoFile[];
}

function getBestPortraitVideo(videoFiles: PexelsVideoFile[]): string | null {
  const portraitVideos = videoFiles.filter(
    (f) => f.height > f.width && f.file_type === "video/mp4"
  );

  if (portraitVideos.length === 0) {
    const hdVideo = videoFiles.find(
      (f) => f.quality === "hd" && f.file_type === "video/mp4"
    );
    return hdVideo?.link || null;
  }

  portraitVideos.sort((a, b) => b.height - a.height);
  return portraitVideos[0].link;
}

async function createViralPost(videoUrl: string, item: typeof VIRAL_QUERIES[0]) {
  try {
    // Get a random user
    const { data: users } = await supabase
      .from("user_profiles")
      .select("id")
      .limit(10);

    const userId = users?.length
      ? users[Math.floor(Math.random() * users.length)].id
      : "27e6a0ec-4b73-45d7-b391-9e831a210524";

    const newPost = {
      caption: item.caption,
      media_url: videoUrl,
      type: "video",
      hive_id: "quebec",
      user_id: userId,
      content: item.caption,
      hashtags: item.hashtags,
    };

    const { data, error } = await supabase
      .from("publications")
      .insert([newPost])
      .select()
      .single();

    if (error) {
      console.error(`❌ DB Error: ${error.message}`);
      return null;
    }

    return data;
  } catch (error: any) {
    console.error("❌ Error creating post:", error.message);
    return null;
  }
}

async function injectViralVideos() {
  console.log("😂 INJECTING FUNNY VIRAL CONTENT!");
  console.log("=================================\n");

  let totalInserted = 0;

  for (const item of VIRAL_QUERIES) {
    console.log(`🔎 Searching: "${item.term}"`);

    try {
      const response = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(
          item.term
        )}&per_page=2&orientation=portrait`,
        {
          headers: { Authorization: PEXELS_API_KEY },
        }
      );

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status}`);
        continue;
      }

      const data: any = await response.json();

      for (const video of data.videos || []) {
        const videoUrl = getBestPortraitVideo(video.video_files);

        if (!videoUrl) continue;

        const result = await createViralPost(videoUrl, item);

        if (result) {
          console.log(`✅ ${item.hashtags[0]} → ${result.id?.slice(0, 8)}...`);
          totalInserted++;
        }
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 500));

    } catch (error: any) {
      console.error(`❌ Error:`, error.message);
    }
  }

  console.log("\n✨ DONE!");
  console.log(`😂 Viral videos added: ${totalInserted}`);
  console.log("\n🔥 Your feed just got way more fun!");
}

injectViralVideos().catch(console.error);
