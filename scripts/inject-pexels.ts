
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://vuanulvyqkfefmjcikfk.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEXELS_API_KEY =
  process.env.PEXELS_API_KEY ||
  "2iANaoqJBF6j0AKJU6Kr67F7xujOMNvFVBeZNK4CaoXQiEezLaxdOpNV";

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Search terms for Zyeute aesthetic
const SEARCH_QUERIES = [
  "cyberpunk city",
  "neon portrait",
  "futuristic fashion",
  "montreal night",
  "urban exploration",
];

async function seedPexels() {
  console.log("🎨 Fetching High-Quality Pexels Images...");

  try {
    for (const query of SEARCH_QUERIES) {
      console.log(`🔎 Searching Pexels for: ${query}`);
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=portrait`,
        {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        },
      );

      if (!response.ok) {
        console.error(`❌ Pexels API Error: ${response.statusText}`);
        continue;
      }

      const data: any = await response.json();

      if (!data.photos || data.photos.length === 0) {
        console.log(`⚠️ No photos found for: ${query}`);
        continue;
      }

      for (const photo of data.photos) {
        const newPost = {
          caption: `${photo.alt || query} 📸 #Pexels #${query.replace(" ", "")}`,
          media_url: photo.src.large2x, // High quality for feed
          type: "photo", // Fixed: 'image' -> 'photo' to match DB constraint
          hive_id: "quebec",
          user_id: "27e6a0ec-4b73-45d7-b391-9e831a210524", // Guest user
          content: `${photo.alt || query} 📸 #Pexels #${query.replace(" ", "")}`,
        };

        const { data: inserted, error } = await supabase
          .from("publications")
          .insert([newPost])
          .select();

        if (error) {
          console.error(`❌ DB Error: ${error.message}`);
        } else {
          console.log(`✅ Inserted Pexels photo: ${inserted[0].id}`);
        }
      }
    }

    console.log("\n✨ Pexels injection complete! Check your feed.");
  } catch (err) {
    console.error("❌ Script failed:", err);
  }
}

seedPexels();
