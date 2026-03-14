import { config } from "dotenv";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

config({ path: join(process.cwd(), ".env") });

async function main() {
  const prompt = process.argv[2] || "Cinematic 4k video of a futuristic cyberpunk Montreal at night, neon lights in red and black, hyper-realistic, WanVideo style.";
  
  console.log("Zyeuté Wan AI Video Generator (REST Mode)");
  console.log("=========================================");
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
  const falKey = process.env.FAL_API_KEY || process.env.FAL_KEY!;
  
  if (!falKey) {
    console.error("FAL_KEY is missing in .env");
    process.exit(1);
  }

  // Dynamic import of fal client to avoid issues
  const { fal } = await import("@fal-ai/client");
  fal.config({ credentials: falKey });

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("Step 1: Generating video with Wan (FAL)...");
    
    const model = "fal-ai/wan/v2.2-a14b/text-to-video";
    const result = await fal.subscribe(model, {
      input: {
        prompt: prompt,
        aspect_ratio: "9:16",
      },
      logs: true,
    });

    const videoUrl = (result.data as any)?.video?.url;
    if (!videoUrl) {
      throw new Error("Video generation failed - no URL in result");
    }
    console.log(`✅ Video Generated: ${videoUrl}`);

    console.log("Step 2: Getting any existing user...");
    const { data: users, error: userFetchError } = await supabase.from('user_profiles').select('id, username').limit(1);
    
    if (userFetchError || !users || users.length === 0) {
      throw new Error("No users found in database to attribute the post to.");
    }
    
    const userId = users[0].id;
    console.log(`Using User: ${users[0].username} (${userId})`);

    console.log("Step 3: Posting to feed via REST...");
    const { data: post, error: postError } = await supabase.from('publications').insert([{
      user_id: userId,
      media_url: videoUrl,
      type: "video",
      content: prompt,
      caption: `Généré par Wan AI: ${prompt} #Zyeute #WanVideo #AI`,
      visibility: "public",
      hive_id: "quebec",
      processing_status: "completed",
      ai_generated: true,
      aspect_ratio: "9:16",
      duration: 5
    }]).select();

    if (postError) throw postError;

    console.log(`\n🚀 Success! Posted to feed: ${post![0].id}`);
    console.log(`View it in the app!`);

  } catch (error: any) {
    console.error(`\n❌ Failed: ${error.message}`);
    process.exit(1);
  }
}

main();
