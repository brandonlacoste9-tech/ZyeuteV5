
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://vuanulvyqkfefmjcikfk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Curated "Zyeute Aesthetic" Images (Cyberpunk, Urban, High-Contrast) for demoing "Image-to-Video"
const DEMO_IMAGES = [
  {
    caption: "Neon Rain 🌧️ #Cyberpunk #City",
    media_url: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2070&auto=format&fit=crop",
    type: "photo",
    hive_id: "quebec",
    user_id: '27e6a0ec-4b73-45d7-b391-9e831a210524', // Uses the same guest user as stock videos
    content: "Neon Rain 🌧️ #Cyberpunk #City",
    ai_labels: ["Neon", "Rain", "Night", "Urban"]
  },
  {
    caption: "The Observer 👁️ #Zyeute #Portrait",
    media_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop", // Future tech vibe
    type: "photo",
    hive_id: "quebec",
    user_id: '27e6a0ec-4b73-45d7-b391-9e831a210524',
    content: "The Observer 👁️ #Zyeute #Portrait"
  },
  {
    caption: "Montreal Underground 🚇 #Montreal #Metro",
    media_url: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1931&auto=format&fit=crop",
    type: "photo",
    hive_id: "quebec",
    user_id: '27e6a0ec-4b73-45d7-b391-9e831a210524',
    content: "Montreal Underground 🚇 #Montreal #Metro"
  },
  {
    caption: "Golden Hour Architecture 🏛️ #Design",
    media_url: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?q=80&w=2010&auto=format&fit=crop",
    type: "photo",
    hive_id: "quebec",
    user_id: '27e6a0ec-4b73-45d7-b391-9e831a210524',
    content: "Golden Hour Architecture 🏛️ #Design"
  }
];

async function seedImages() {
  console.log("🎨 Injecting High-Quality Demo Images...");
  
  for (const img of DEMO_IMAGES) {
    const { data, error } = await supabase
      .from('publications')
      .insert([img])
      .select();

    if (error) {
      console.error(`❌ Error inserting image: ${error.message}`);
    } else {
      console.log(`✅ Inserted image: ${data[0].id}`);
    }
  }

  console.log("\n✨ Demo Image injection complete! Ready for 'Image-to-Video' testing.");
}

seedImages();
