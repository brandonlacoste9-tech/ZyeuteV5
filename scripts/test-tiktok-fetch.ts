import axios from "axios";
import { runTikTokFeedPopulatorOnce } from "../backend/services/tiktok-feed-populator-job.js";
import { config } from "dotenv";

config(); // load .env

const RENDER_API_KEY = process.env.RENDER_API_KEY;
if (!RENDER_API_KEY) {
  console.error("RENDER_API_KEY is not set in environment variables");
  process.exit(1);
}
const WEB_SERVICE_NAME = "zyeutev5-1";

async function run() {
  try {
    const servicesRes = await axios.get("https://api.render.com/v1/services?limit=20", {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` },
    });

    const webService = servicesRes.data.find((s: any) => s.service.name.toLowerCase() === WEB_SERVICE_NAME);

    if (!webService) {
      console.error("Could not find web service!");
      return;
    }

    const webVarsRes = await axios.get(`https://api.render.com/v1/services/${webService.service.id}/env-vars`, {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` },
    });
    
    const dbUrlVar = webVarsRes.data.find((v: any) => v.envVar.key === "DATABASE_URL");
    if (!dbUrlVar) {
      console.error("DATABASE_URL not found on Render!");
      return;
    }

    // Inject into process.env
    process.env.DATABASE_URL = dbUrlVar.envVar.value;
    // TIKAPI_KEY is loaded from .env
    process.env.TIKTOK_FEED_JOB_ENABLED = "true";
    // SUPABASE URLs and keys are loaded from .env

    console.log("Starting TikTok manual fetch test...");
    const stats = await runTikTokFeedPopulatorOnce();
    console.log("Stats:", stats);

  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

run();
