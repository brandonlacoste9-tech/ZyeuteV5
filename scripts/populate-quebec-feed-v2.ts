import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing required environment variables (Supabase)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const QUEBEC_VIDEOS = [
  {
    caption:
      "🍁 Le temps des sucres est arrivé! 🧇 Petit déjeuner à la cabane! #Quebec #Erable",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=720",
    tags: ["erable", "printemps", "tradition"],
    reactions: 1200,
  },
  {
    caption:
      "⚜️ Le parc de la Chute-Montmorency est plus haut que le Niagara! 🌊 Impressive! #VoyageQuebec",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=720",
    tags: ["chutes", "nature", "voyage"],
    reactions: 950,
  },
  {
    caption:
      "🎸 Ambiance de feu au Festival d'été de Québec! 🎶 On lâche pas! #FEQ #Musique",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=720",
    tags: ["festival", "musique", "ete"],
    reactions: 2100,
  },
  {
    caption:
      "⛸️ Patiner sur le lac gelé à Mont-Tremblant. ❄️ Le vrai hiver québécois! #Hiver #Patin",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1516961642265-531546e84af2?w=720",
    tags: ["patin", "hiver", "tremblant"],
    reactions: 840,
  },
  {
    caption:
      "🏙️ Montréal vue du Mont-Royal au coucher du soleil. 😍 Ma ville, ma fierté! #Montreal #Skyline",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1519177746063-c07a0b24130d?w=720",
    tags: ["montreal", "ville", "vue"],
    reactions: 3200,
  },
  {
    caption:
      "🥞 Brunch au Plateau, rien de mieux qu'un dimanche matin relax! ☕ #Plateau #Brunch",
    mediaUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1533089860892-a7c6f081396a?w=720",
    tags: ["brunch", "montreal", "cafe"],
    reactions: 670,
  },
];

async function populateFeedV2() {
  console.log("⚜️ Populating Zyeuté with Quebec Videos (API Mode)...");

  // 1. Get or create system user
  console.log("👤 Checking system user...");
  const { data: users, error: userError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", "zyeute_ai")
    .limit(1);

  let systemUserId: string;

  if (userError || !users || users.length === 0) {
    console.log("➕ Creating new system user 'zyeute_ai'...");
    const { data: newUser, error: createError } = await supabase
      .from("user_profiles")
      .insert({
        id: randomUUID(),
        username: "zyeute_ai",
        email: "ai@zyeute.com",
        display_name: "Zyeuté AI 🤖",
        role: "citoyen",
        avatar_url:
          "https://vuanulvyqkfefmjcikfk.supabase.co/storage/v1/object/public/avatars/zyeute_ai.png",
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Failed to create system user:", createError.message);
      // Fallback: search for any existing user to use as author
      const { data: anyUsers } = await supabase
        .from("user_profiles")
        .select("id")
        .limit(1);
      if (!anyUsers || anyUsers.length === 0) {
        console.error(
          "❌ No users found in database. Please register a user first.",
        );
        return;
      }
      systemUserId = anyUsers[0].id;
    } else {
      systemUserId = newUser.id;
    }
  } else {
    systemUserId = users[0].id;
    console.log(`✅ Using existing system user: ${systemUserId}`);
  }

  // 2. Add videos
  console.log(`📊 Adding ${QUEBEC_VIDEOS.length} Quebec videos...`);

  let added = 0;
  for (const video of QUEBEC_VIDEOS) {
    const { data: existing } = await supabase
      .from("publications")
      .select("id")
      .eq("caption", video.caption)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⏭️ Skipping existing: ${video.caption.substring(0, 40)}...`);
      continue;
    }

    const { error: postError } = await supabase.from("publications").insert({
      user_id: systemUserId,
      media_url: video.mediaUrl,
      thumbnail_url: video.thumbnailUrl,
      type: "video",
      caption: video.caption,
      content: video.caption,
      visibility: "public",
      hive_id: "quebec",
      processing_status: "completed",
      ai_generated: false,
      aspect_ratio: "16:9",
      duration: 30,
      reactions_count: video.reactions,
      created_at: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });

    if (postError) {
      console.error(`❌ Error adding video: ${postError.message}`);
    } else {
      console.log(`✅ Added: ${video.caption.substring(0, 40)}...`);
      added++;
    }
  }

  console.log(`\n🎉 Success! Added ${added} videos to the Quebec feed.`);
}

populateFeedV2();
