#!/usr/bin/env tsx
/**
 * 🎵 TikTok-Style Feed Population Script
 * Populates Zyeuté with a massive library of viral-style content
 * Fetches portrait videos from Pexels across 50 TikTok content categories
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || "https://vuanulvyqkfefmjcikfk.supabase.co";
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

// ═══════════════════════════════════════════════════════════════
// 🎯 50 TikTok-style content categories with viral captions
// ═══════════════════════════════════════════════════════════════
const TIKTOK_CATEGORIES = [
  // 💃 DANCE & MUSIC
  {
    term: "dance choreography hip hop",
    caption: "Hit that move! 💃🔥 POV: when the beat drops #Dance #Viral",
    hashtags: ["dance", "choreography", "viral", "fyp"],
  },
  {
    term: "dance party crowd concert",
    caption: "The energy was INSANE 🤯🎵 #Concert #Vibes #Lit",
    hashtags: ["concert", "party", "energy", "fyp"],
  },
  {
    term: "street dance breakdance",
    caption: "This guy is on another level 🤯💪 #StreetDance #Talent",
    hashtags: ["breakdance", "streetdance", "talent", "viral"],
  },
  {
    term: "girl dancing in sunset",
    caption: "Golden hour vibes ✨🌅 #GoldenHour #DanceVibes",
    hashtags: ["goldenhour", "sunset", "dance", "aesthetic"],
  },

  // 🐾 PETS & ANIMALS
  {
    term: "cute puppy playing",
    caption: "I can't handle the cuteness 🥺🐶 #Puppy #DogLover #Cute",
    hashtags: ["puppy", "dog", "cute", "fyp"],
  },
  {
    term: "funny cat compilation",
    caption: "Cats being cats 😂🐱 Why are they like this?! #CatTok",
    hashtags: ["cat", "funny", "cattok", "viral"],
  },
  {
    term: "golden retriever happy",
    caption: "Living my best life 🐕‍🦺💛 #GoldenRetriever #HappyDog",
    hashtags: ["goldenretriever", "dog", "happy", "fyp"],
  },
  {
    term: "baby duck swimming",
    caption: "Just keep swimming 🦆💕 This made my whole day",
    hashtags: ["duck", "cute", "animals", "wholesome"],
  },
  {
    term: "kitten playing with toy",
    caption: "The attack mode 😂🐱 #Kitten #TooMuchCute",
    hashtags: ["kitten", "cute", "funny", "fyp"],
  },

  // 🍳 FOOD & COOKING
  {
    term: "satisfying cooking food preparation",
    caption: "This is SO satisfying to watch 🤤🍳 #FoodTok #Cooking",
    hashtags: ["foodtok", "cooking", "satisfying", "recipe"],
  },
  {
    term: "street food night market",
    caption: "Street food hits different at night 🌙🍜 #StreetFood",
    hashtags: ["streetfood", "foodie", "nightmarket", "fyp"],
  },
  {
    term: "chocolate dessert melting",
    caption: "Wait for it... 🍫😍 Pure chocolate heaven #Dessert",
    hashtags: ["chocolate", "dessert", "satisfying", "foodporn"],
  },
  {
    term: "coffee art latte",
    caption: "Barista level 1000 ☕✨ #CoffeeTok #LatteArt",
    hashtags: ["coffee", "latteart", "barista", "fyp"],
  },
  {
    term: "pizza making oven",
    caption: "Perfect pizza every time 🍕🔥 #Pizza #Foodie",
    hashtags: ["pizza", "cooking", "food", "fyp"],
  },

  // 💪 FITNESS & WELLNESS
  {
    term: "workout gym fitness",
    caption: "No excuses! 💪🏋️ Day 365 of showing up #GymTok",
    hashtags: ["gym", "fitness", "workout", "motivation"],
  },
  {
    term: "yoga sunset meditation",
    caption: "Peace of mind 🧘‍♀️✨ Finding my zen #Yoga #Wellness",
    hashtags: ["yoga", "meditation", "wellness", "mindfulness"],
  },
  {
    term: "running marathon",
    caption: "Runner's high is REAL 🏃‍♂️⚡ #Running #Marathon",
    hashtags: ["running", "marathon", "fitness", "fyp"],
  },

  // ✈️ TRAVEL & ADVENTURE
  {
    term: "tropical beach paradise",
    caption: "Take me back 😭🏝️ This place is UNREAL #Travel",
    hashtags: ["travel", "beach", "paradise", "wanderlust"],
  },
  {
    term: "mountain hiking adventure",
    caption: "The view from the top was worth every step 🏔️⛰️ #Hiking",
    hashtags: ["hiking", "mountain", "adventure", "nature"],
  },
  {
    term: "city night lights timelapse",
    caption: "Cities that never sleep 🌃✨ #CityVibes #NightLife",
    hashtags: ["city", "nightlife", "timelapse", "aesthetic"],
  },
  {
    term: "airplane window clouds",
    caption: "Above the clouds ☁️✈️ Next destination: EVERYWHERE",
    hashtags: ["travel", "airplane", "clouds", "adventure"],
  },
  {
    term: "underwater ocean diving",
    caption: "A whole other world down here 🌊🐠 #Ocean #Diving",
    hashtags: ["ocean", "diving", "underwater", "nature"],
  },

  // 🎨 ART & CREATIVITY
  {
    term: "painting art canvas",
    caption: "Watch it come to life! 🎨🖌️ #ArtTok #Satisfying",
    hashtags: ["art", "painting", "arttok", "creative"],
  },
  {
    term: "pottery making wheel",
    caption: "The most satisfying thing you'll see today 🏺✨ #Pottery",
    hashtags: ["pottery", "satisfying", "handmade", "art"],
  },
  {
    term: "calligraphy writing",
    caption: "Handwriting goals 📝✨ #Calligraphy #Oddlysatisfying",
    hashtags: ["calligraphy", "writing", "satisfying", "fyp"],
  },

  // 😂 COMEDY & MEMES
  {
    term: "funny reaction surprise",
    caption: "His face 😂😂 I'm CRYING #Funny #Reaction #Comedy",
    hashtags: ["funny", "reaction", "comedy", "viral"],
  },
  {
    term: "prank video funny moment",
    caption: "She did NOT see that coming 😂🤣 #Prank #GotEm",
    hashtags: ["prank", "funny", "gotcha", "viral"],
  },
  {
    term: "baby laughing funny",
    caption: "This baby's laugh is contagious 😂👶 #BabyLaugh #Joy",
    hashtags: ["baby", "laughing", "funny", "cute"],
  },

  // 👗 FASHION & BEAUTY
  {
    term: "fashion outfit transition",
    caption: "Outfit check! ✨👗 Which one's your fav? #OOTD #Fashion",
    hashtags: ["fashion", "ootd", "outfit", "style"],
  },
  {
    term: "makeup transformation tutorial",
    caption: "The glow up is REAL 💅✨ #MakeupTok #GlowUp",
    hashtags: ["makeup", "glowup", "beauty", "tutorial"],
  },
  {
    term: "nails manicure art design",
    caption: "Nail art that hits different 💅🎨 #NailArt #Nails",
    hashtags: ["nails", "nailart", "manicure", "beauty"],
  },

  // 🌿 NATURE & ASMR
  {
    term: "waterfall nature forest",
    caption: "Turn your sound ON 🔊🌿 Nature's therapy #ASMR #Nature",
    hashtags: ["nature", "waterfall", "asmr", "peaceful"],
  },
  {
    term: "rain on window relaxing",
    caption: "Main character energy on a rainy day 🌧️✨ #Rain #Cozy",
    hashtags: ["rain", "cozy", "aesthetic", "relaxing"],
  },
  {
    term: "northern lights aurora",
    caption: "This is REAL. Not edited. 🤯🌌 #NorthernLights #Aurora",
    hashtags: ["aurora", "northernlights", "nature", "wow"],
  },
  {
    term: "flower blooming timelapse",
    caption: "Nature is the best artist 🌸⏰ #Timelapse #Flowers",
    hashtags: ["flowers", "timelapse", "nature", "beautiful"],
  },

  // 🎮 GAMING & TECH
  {
    term: "gaming setup desk lights",
    caption: "Rate my setup 1-10 🎮💡 #GamingSetup #Tech",
    hashtags: ["gaming", "setup", "tech", "rgb"],
  },
  {
    term: "drone aerial city view",
    caption: "POV: You're a bird 🦅✨ #Drone #AerialView #FPV",
    hashtags: ["drone", "aerial", "fpv", "cinematic"],
  },

  // 🏠 LIFESTYLE & DIY
  {
    term: "room transformation makeover",
    caption: "Before vs After 😱✨ Total room glow up! #RoomTour",
    hashtags: ["roomtour", "transformation", "diy", "decor"],
  },
  {
    term: "cleaning satisfying organized",
    caption: "Watch me clean 🧹✨ SO satisfying #CleanTok #Satisfying",
    hashtags: ["cleantok", "cleaning", "satisfying", "organize"],
  },
  {
    term: "plant growing timelapse",
    caption: "Growing my own food 🌱→🥬 Week 1 to 12 #PlantTok",
    hashtags: ["planttok", "garden", "growing", "timelapse"],
  },

  // 🏀 SPORTS
  {
    term: "basketball dunk incredible",
    caption: "HE FLEW 🏀😱 How is this even possible?! #Basketball",
    hashtags: ["basketball", "dunk", "sports", "viral"],
  },
  {
    term: "surfing ocean wave",
    caption: "Catching waves 🌊🏄 This is what freedom feels like",
    hashtags: ["surfing", "waves", "ocean", "sports"],
  },
  {
    term: "skateboard trick park",
    caption: "Nailed it! 🛹🔥 3rd try btw #Skateboard #Trick",
    hashtags: ["skateboard", "trick", "skills", "fyp"],
  },

  // 🌆 AESTHETIC & VIBES
  {
    term: "neon lights city aesthetic",
    caption: "Cyberpunk IRL 🌆💜 #Aesthetic #NeonVibes #CityNight",
    hashtags: ["aesthetic", "neon", "cyberpunk", "vibes"],
  },
  {
    term: "sunset clouds dramatic sky",
    caption: "The sky was PAINTING tonight 🌅🎨 #Sunset #SkyPorn",
    hashtags: ["sunset", "sky", "beautiful", "nature"],
  },
  {
    term: "cozy cabin winter fire",
    caption: "Main character cozy season 🏠🔥 #CozyVibes #Winter",
    hashtags: ["cozy", "winter", "cabin", "aesthetic"],
  },

  // 🎤 CULTURE & MOMENTS
  {
    term: "crowd cheering celebration",
    caption: "THAT energy when your team wins 🏆🎉 #Celebration",
    hashtags: ["celebration", "winner", "energy", "viral"],
  },
  {
    term: "couple dancing romantic",
    caption: "Relationship goals 🥺💕 #Couple #Love #Goals",
    hashtags: ["couple", "love", "dance", "goals"],
  },
  {
    term: "fireworks night celebration",
    caption: "HAPPY NEW YEAR 🎆🎉 This is everything #Fireworks",
    hashtags: ["fireworks", "celebration", "newyear", "wow"],
  },
];

// ═══════════════════════════════════════════════════════════════
// Types & Helpers
// ═══════════════════════════════════════════════════════════════

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
  user: { id: number; name: string; url: string };
  video_files: PexelsVideoFile[];
  video_pictures: { id: number; picture: string; nr: number }[];
}

function getBestVideo(videoFiles: PexelsVideoFile[]): {
  url: string;
  width: number;
  height: number;
} | null {
  // Prefer portrait MP4s
  const portraits = videoFiles
    .filter((f) => f.height > f.width && f.file_type === "video/mp4")
    .sort((a, b) => b.height - a.height);

  if (portraits.length > 0) {
    return {
      url: portraits[0].link,
      width: portraits[0].width,
      height: portraits[0].height,
    };
  }

  // Fallback: any HD mp4
  const hd = videoFiles.find(
    (f) => f.quality === "hd" && f.file_type === "video/mp4",
  );
  if (hd) return { url: hd.link, width: hd.width, height: hd.height };

  // Last resort: any mp4
  const any = videoFiles.find((f) => f.file_type === "video/mp4");
  return any ? { url: any.link, width: any.width, height: any.height } : null;
}

function pickAspectRatio(w: number, h: number): string {
  if (h > w) return "9:16";
  if (w > h) return "16:9";
  return "1:1";
}

function randomEngagement() {
  return {
    reactions: Math.floor(Math.random() * 8000) + 100,
    views: Math.floor(Math.random() * 50000) + 500,
    shares: Math.floor(Math.random() * 500),
    viralScore: Math.floor(Math.random() * 100),
  };
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  🎵 TikTok-Style Feed Population                ║");
  console.log("║  Injecting viral content across 50 categories   ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // Fetch available users for random assignment
  const { data: users } = await supabase
    .from("user_profiles")
    .select("id")
    .limit(20);

  const userIds = users?.map((u) => u.id) || [];
  const fallbackUserId = "27e6a0ec-4b73-45d7-b391-9e831a210524";

  if (userIds.length === 0) {
    console.log("⚠️  No users found, using fallback user ID\n");
    userIds.push(fallbackUserId);
  } else {
    console.log(`👥 Found ${userIds.length} users for random assignment\n`);
  }

  let totalInserted = 0;
  let totalErrors = 0;
  let totalSkipped = 0;
  const videosPerQuery = 3; // 3 videos per category × 50 categories = up to 150 videos

  for (let i = 0; i < TIKTOK_CATEGORIES.length; i++) {
    const item = TIKTOK_CATEGORIES[i];
    const progress = `[${i + 1}/${TIKTOK_CATEGORIES.length}]`;

    console.log(`\n${progress} 🔎 "${item.term}"`);

    try {
      const response = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(
          item.term,
        )}&per_page=${videosPerQuery}&orientation=portrait`,
        { headers: { Authorization: PEXELS_API_KEY! } },
      );

      if (!response.ok) {
        console.error(`   ❌ Pexels API: ${response.status}`);
        totalErrors++;
        continue;
      }

      const data: any = await response.json();
      const videos: PexelsVideo[] = data.videos || [];

      if (videos.length === 0) {
        console.log("   ⚠️  No videos found");
        totalSkipped++;
        continue;
      }

      for (const video of videos) {
        const best = getBestVideo(video.video_files);
        if (!best) {
          totalSkipped++;
          continue;
        }

        // Check for duplicates by media_url
        const { data: existing } = await supabase
          .from("publications")
          .select("id")
          .eq("media_url", best.url)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log("   ⏭️  Duplicate, skipping");
          totalSkipped++;
          continue;
        }

        const engagement = randomEngagement();
        const userId = userIds[Math.floor(Math.random() * userIds.length)];
        const thumbnail =
          video.video_pictures?.[0]?.picture || video.image || "";

        const newPost = {
          caption: item.caption,
          content: item.caption,
          media_url: best.url,
          thumbnail_url: thumbnail,
          type: "video",
          hive_id: "quebec",
          user_id: userId,
          hashtags: item.hashtags,
          aspect_ratio: pickAspectRatio(best.width, best.height),
          duration: video.duration || 30,
          reactions_count: engagement.reactions,
          view_count: engagement.views,
          shares_count: engagement.shares,
          viral_score: engagement.viralScore,
          processing_status: "completed",
          ai_generated: false,
          created_at: new Date(
            Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000,
          ).toISOString(), // Random time in last 2 weeks
        };

        const { error } = await supabase.from("publications").insert([newPost]);

        if (error) {
          console.error(`   ❌ DB: ${error.message}`);
          totalErrors++;
        } else {
          console.log(
            `   ✅ #${item.hashtags[0]} → 🔥${engagement.reactions} 👁️${engagement.views}`,
          );
          totalInserted++;
        }
      }

      // Rate limiting: 200ms between queries (Pexels allows ~200 req/hr)
      await new Promise((r) => setTimeout(r, 350));
    } catch (error: any) {
      console.error(`   ❌ ${error.message}`);
      totalErrors++;
    }
  }

  // Print summary
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  📊 RESULTS                                     ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(
    `║  ✅ Videos inserted:  ${String(totalInserted).padStart(4)}                       ║`,
  );
  console.log(
    `║  ⏭️  Skipped:         ${String(totalSkipped).padStart(4)}                       ║`,
  );
  console.log(
    `║  ❌ Errors:           ${String(totalErrors).padStart(4)}                       ║`,
  );
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("\n🎵 Your feed is now STACKED with TikTok vibes!");
  console.log("   Open the app → La Zyeute → Swipe away! 🚀\n");
}

main().catch(console.error);
