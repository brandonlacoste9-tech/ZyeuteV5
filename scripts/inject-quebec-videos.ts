/**
 * Inject Authentic Quebec Content for Zyeuté
 * French-Canadian culture, landscapes, and lifestyle
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

// 🍁 AUTHENTIC QUEBEC SEARCH TERMS
const QUEBEC_QUERIES = [
  { 
    term: "montreal city skyline",
    caption: "Montréal, ma belle ville! 🏙️⚜️ #Montreal #Quebec",
    hashtags: ["montreal", "quebec", "villes"]
  },
  { 
    term: "quebec city old town",
    caption: "Le Vieux-Québec, magnifique! 🏰⚜️ #QuebecCity #Patrimoine",
    hashtags: ["quebec", "vieuxquebec", "patrimoine"]
  },
  { 
    term: "canadian autumn maple leaves",
    caption: "L'automne québécois! 🍁🍂 #Automne #Quebec",
    hashtags: ["automne", "quebec", "erable"]
  },
  { 
    term: "canadian winter snow forest",
    caption: "L'hiver au Québec! ❄️🏔️ #Hiver #Quebec",
    hashtags: ["hiver", "quebec", "neige"]
  },
  { 
    term: "montreal street art",
    caption: "L'art de rue à Montréal! 🎨🖌️ #StreetArt #MTL",
    hashtags: ["streetart", "montreal", "art"]
  },
  { 
    term: "canadian cafe coffee shop",
    caption: "Pause café au Québec! ☕📚 #Cafe #Moment",
    hashtags: ["cafe", "quebec", "detente"]
  },
  { 
    term: "st lawrence river canada",
    caption: "Le fleuve Saint-Laurent! 🌊⚓ #Fleuve #Quebec",
    hashtags: ["fleuve", "saintlaurent", "quebec"]
  },
  { 
    term: "canadian hiking mountain trail",
    caption: "Randonnée au Québec! 🥾⛰️ #Randonnee #Nature",
    hashtags: ["randonnee", "nature", "quebec"]
  },
  { 
    term: "montreal metro underground",
    caption: "Le métro de Montréal! 🚇🎵 #Metro #STM",
    hashtags: ["metro", "montreal", "stm"]
  },
  { 
    term: "canadian cottage lake house",
    caption: "Au chalet! 🏠🌲 #Chalet #Lac",
    hashtags: ["chalet", "lac", "weekend"]
  },
  { 
    term: "montreal night lights",
    caption: "Montréal la nuit! 🌃✨ #Nightlife #MTL",
    hashtags: ["nuit", "montreal", "lumiere"]
  },
  { 
    term: "canada gatineau park nature",
    caption: "Parc de la Gatineau! 🌲🦌 #Nature #Outaouais",
    hashtags: ["gatineau", "nature", "quebec"]
  },
  { 
    term: "canadian snow skiing",
    caption: "Ski au Québec! ⛷️❄️ #Ski #Montagne",
    hashtags: ["ski", "hiver", "sport"]
  },
  { 
    term: "montreal food poutine",
    caption: "La poutine! 🍟🧀 #Poutine #Quebec",
    hashtags: ["poutine", "food", "quebec"]
  },
  { 
    term: "quebec festival celebration",
    caption: "Festival au Québec! 🎉🎭 #Festival #Joie",
    hashtags: ["festival", "quebec", "celebration"]
  },
  { 
    term: "canadian wildlife bear moose",
    caption: "Notre faune! 🦌🐻 #Animaux #Nature",
    hashtags: ["faune", "nature", "quebec"]
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

async function createQuebecPost(videoUrl: string, item: typeof QUEBEC_QUERIES[0]) {
  try {
    // Get a random user
    const { data: users, error: userError } = await supabase
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

async function injectQuebecVideos() {
  console.log("🍁 INJECTING AUTHENTIC QUEBEC CONTENT!");
  console.log("=====================================\n");
  
  let totalInserted = 0;

  for (const item of QUEBEC_QUERIES) {
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

        const result = await createQuebecPost(videoUrl, item);

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
  console.log(`🍁 Quebec videos added: ${totalInserted}`);
  console.log("\n🔄 Refresh your app to see authentic Quebec content!");
}

injectQuebecVideos().catch(console.error);
