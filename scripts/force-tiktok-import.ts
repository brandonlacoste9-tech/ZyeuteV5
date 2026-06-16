import { config } from "dotenv";
import axios from "axios";
config();

const RENDER_API_KEY = "rnd_uxQBVfQyZ6fOmVDA6eMYEQZE6Pdz";
const WEB_SERVICE_NAME = "zyeutev5-1";

async function main() {
  const servicesRes = await axios.get(`https://api.render.com/v1/services?limit=20`, {
    headers: { Authorization: `Bearer ${RENDER_API_KEY}` },
  });
  const webService = servicesRes.data.find((s: any) => s.service.name.toLowerCase() === WEB_SERVICE_NAME);
  if (!webService) throw new Error("Web service not found");

  const webVarsRes = await axios.get(`https://api.render.com/v1/services/${webService.service.id}/env-vars`, {
    headers: { Authorization: `Bearer ${RENDER_API_KEY}` },
  });
  
  const dbUrlVar = webVarsRes.data.find((v: any) => v.envVar.key === "DATABASE_URL");
  const muxTokenVar = webVarsRes.data.find((v: any) => v.envVar.key === "MUX_TOKEN_ID");
  const muxSecretVar = webVarsRes.data.find((v: any) => v.envVar.key === "MUX_TOKEN_SECRET");

  process.env.DATABASE_URL = dbUrlVar.envVar.value
    .replace("aws-0-us-east-1.pooler.supabase.com", "db.vuanulvyqkfefmjcikfk.supabase.co")
    .replace("6543", "5432")
    .replace("postgres.vuanulvyqkfefmjcikfk", "postgres");
  process.env.MUX_TOKEN_ID = muxTokenVar?.envVar.value;
  process.env.MUX_TOKEN_SECRET = muxSecretVar?.envVar.value;
  process.env.TIKAPI_KEY = "lHEExX2WHHuDg5UuUavbDpOVEkCa5twyQUtEfbUuvw7pzNn3";
  process.env.TIKTOK_FEED_JOB_ENABLED = "true";

  // Dynamic import AFTER env is set
  const { runTikTokFeedPopulatorOnce } = await import("../backend/services/tiktok-feed-populator-job.js");
  console.log("Running population...");
  const stats = await runTikTokFeedPopulatorOnce();
  console.log("Stats:", stats);
}

main().catch(console.error);
