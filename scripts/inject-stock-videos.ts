import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL || "https://vuanulvyqkfefmjcikfk.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const STOCK_VIDEOS = [
  {
    caption:
      "The journey of a thousand miles begins with a single step. ✈️ #Travel #Voyageur",
    media_url:
      "https://player.vimeo.com/external/475150821.hd.mp4?s=d0f0d2cceca32c86fed4d4a86b97f0775d7e63b1&profile_id=175",
    type: "video",
    reactions_count: 999999, // Pin this one!
    hive_id: "quebec",
    user_id: "27e6a0ec-4b73-45d7-b391-9e831a210524",
    content:
      "The journey of a thousand miles begins with a single step. ✈️ #Travel #Voyageur",
  },
  {
    caption: "Chasing sunsets and new horizons. 🌅 #Nature #Explore",
    media_url:
      "https://player.vimeo.com/external/370331493.hd.mp4?s=3301384061a995e80650961a86b99616e729a997&profile_id=175",
    type: "video",
    reactions_count: 850,
    hive_id: "quebec",
    user_id: "27e6a0ec-4b73-45d7-b391-9e831a210524",
    content: "Chasing sunsets and new horizons. 🌅 #Nature #Explore",
  },
  {
    caption: "Urban vibes and neon nights. 🏙️ #CityLife #Zyeute",
    media_url:
      "https://player.vimeo.com/external/511598444.hd.mp4?s=7b0d8a4e3b3d1664fb9e7986fb87868846c2f0f5&profile_id=175",
    type: "video",
    reactions_count: 720,
    hive_id: "quebec",
    user_id: "27e6a0ec-4b73-45d7-b391-9e831a210524",
    content: "Urban vibes and neon nights. 🏙️ #CityLife #Zyeute",
  },
];

async function seedStock() {
  console.log("🚀 Injecting professional stock videos...");

  for (const video of STOCK_VIDEOS) {
    const { data, error } = await supabase
      .from("publications")
      .insert([video])
      .select();

    if (error) {
      console.error(`❌ Error inserting video: ${error.message}`);
    } else {
      console.log(`✅ Inserted professional video: ${data[0].id}`);
    }
  }

  console.log("\n✨ Stock video injection complete!");
}

seedStock();
