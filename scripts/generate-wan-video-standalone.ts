/**
 * Generate WAN Video (Standalone - No DB)
 */
import { config } from "dotenv";
import { join } from "path";
config({ path: join(process.cwd(), ".env") });

import { generateVideo } from "../backend/ai/media/video-engine";

async function main() {
  const prompt = process.argv[2] || "A cyberpunk neon Montreal street at night with rain, cinematic drone shot, high quality";
  
  console.log("🚀 Starting standalone WAN video generation...");
  console.log("Prompt:", prompt);
  
  try {
    const result = await generateVideo({
      prompt,
      modelHint: "wan",
      duration: 5
    });
    
    console.log("\n✅ Video Generated Successfully!");
    console.log("Model:", result.model);
    console.log("Video URL:", result.url);
    console.log("Cost:", result.cost);
    
    console.log("\nNote: This script did NOT save to the database.");
  } catch (error: any) {
    console.error("\n❌ Generation failed:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

main();
