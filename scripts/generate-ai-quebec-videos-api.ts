import { fal } from "@fal-ai/client";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const falKey = process.env.FAL_API_KEY || process.env.FAL_KEY;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!falKey || !supabaseUrl || !supabaseKey) {
  console.error("❌ Missing required environment variables (FAL or Supabase)");
  process.exit(1);
}

fal.config({ credentials: falKey });

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateQuebecAIVideo() {
  console.log("🤖 Starting AI Quebec Video Generation...");

  const prompt =
    "Un magnifique coucher de soleil sur le fleuve Saint-Laurent à Québec, style cinématique, 4k, drone shot, hyper-réaliste";

  try {
    // 1. Generate Video
    console.log(`🎬 Triggering Kling V2 for: "${prompt}"`);
    const result = await fal.subscribe(
      "fal-ai/kling-video/v2/master/text-to-video",
      {
        input: {
          prompt,
          duration: "5",
          aspect_ratio: "9:16",
        },
        logs: true,
      },
    );

    const videoUrl = (result.data as any)?.video?.url;
    if (!videoUrl) {
      throw new Error("No video URL returned from FAL");
    }

    console.log(`✅ Video generated: ${videoUrl}`);

    // 2. Get system user
    const { data: users } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("username", "ti_guy_bot")
      .limit(1);

    const systemUserId =
      users?.[0]?.id || "9175f19b-5d49-4aa5-afba-c5dfa53e086d";

    // 3. Save to Supabase
    console.log("💾 Saving to Zyeuté publications...");
    const { error: postError } = await supabase.from("publications").insert({
      user_id: systemUserId,
      media_url: videoUrl,
      type: "video",
      caption:
        "🌇 Coucher de soleil majestueux sur le Saint-Laurent. Généré par Ti-Guy IA 🤖⚜️ #Quebec #AI #Kling",
      content: prompt,
      visibility: "public",
      hive_id: "quebec",
      processing_status: "completed",
      ai_generated: true,
      aspect_ratio: "9:16",
      duration: 5,
      created_at: new Date().toISOString(),
    });

    if (postError) {
      throw new Error(`Failed to save post: ${postError.message}`);
    }

    console.log("🚀 AI Generation and Ingestion successful!");
  } catch (err: any) {
    console.error("❌ AI Generation failed:", err.message);
  }
}

generateQuebecAIVideo();
