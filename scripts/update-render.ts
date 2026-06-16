

import axios from "axios";
import { config } from "dotenv";

config(); // Load .env
config({ path: ".env.local", override: true });

const RENDER_API_KEY = process.env.RENDER_API_KEY;
if (!RENDER_API_KEY) {
  console.error("RENDER_API_KEY is not set in environment variables");
  process.exit(1);
}
const SERVICE_NAME = "zyeutev5-1";

async function run() {
  try {
    console.log("Fetching services...");
    const servicesRes = await axios.get("https://api.render.com/v1/services?limit=20", {
      headers: {
        Authorization: `Bearer ${RENDER_API_KEY}`,
        Accept: "application/json",
      },
    });

    const services = servicesRes.data;
    console.log("Available services:", services.map((s: any) => s.service.name));
    
    // Find the EXACT service name (ZyeuteV5-1)
    const service = services.find((s: any) => s.service.name.toLowerCase() === "zyeutev5-1");

    if (!service) {
      console.error(`Service ${SERVICE_NAME} not found!`);
      return;
    }

    const serviceId = service.service.id;
    console.log(`Found service: ${serviceId}`);

    console.log("Fetching existing env vars...");
    const envVarsRes = await axios.get(`https://api.render.com/v1/services/${serviceId}/env-vars`, {
      headers: {
        Authorization: `Bearer ${RENDER_API_KEY}`,
        Accept: "application/json",
      },
    });

    const existingVars = envVarsRes.data;
    const newVarsList = existingVars.map((v: any) => ({
      key: v.envVar.key,
      value: v.envVar.value,
    }));

    const dbVar = newVarsList.find((v: any) => v.key === "DATABASE_URL");
    if (dbVar) {
      console.log("PRODUCTION DATABASE_URL:", dbVar.value);
    }

    // Add new ones or update if exists
    const toSet = [
      { key: "TIKTOK_FEED_JOB_ENABLED", value: process.env.TIKTOK_FEED_JOB_ENABLED || "true" },
      { key: "TIKTOK_FEED_JOB_INTERVAL_MS", value: process.env.TIKTOK_FEED_JOB_INTERVAL_MS || "21600000" },
      { key: "TIKTOK_FEED_JOB_MAX_PER_RUN", value: process.env.TIKTOK_FEED_JOB_MAX_PER_RUN || "15" },
      { key: "TIKAPI_KEY", value: process.env.TIKAPI_KEY || "" },
      { key: "SUPABASE_URL", value: process.env.SUPABASE_URL || "" },
      { key: "VITE_SUPABASE_URL", value: process.env.VITE_SUPABASE_URL || "" },
      { key: "SUPABASE_SERVICE_ROLE_KEY", value: process.env.SUPABASE_SERVICE_ROLE_KEY || "" },
      { key: "SUPABASE_ANON_KEY", value: process.env.SUPABASE_ANON_KEY || "" },
      { key: "VITE_SUPABASE_ANON_KEY", value: process.env.VITE_SUPABASE_ANON_KEY || "" },
      { key: "STRIPE_SECRET_KEY", value: process.env.STRIPE_SECRET_KEY || "" },
      { key: "STRIPE_PUBLISHABLE_KEY", value: process.env.STRIPE_PUBLISHABLE_KEY || "" },
      { key: "JWT_SECRET_KET", value: process.env.JWT_SECRET_KET || "" },
      { key: "SESSION_SECRET", value: process.env.SESSION_SECRET || "" },
      { key: "GEMINI_API_KEY", value: process.env.GEMINI_API_KEY || "" },
    ];

    for (const add of toSet) {
      const idx = newVarsList.findIndex((v: any) => v.key === add.key);
      if (idx >= 0) {
        newVarsList[idx].value = add.value;
      } else {
        newVarsList.push(add);
      }
    }

    console.log("Updating env vars...");
    await axios.put(`https://api.render.com/v1/services/${serviceId}/env-vars`, newVarsList, {
      headers: {
        Authorization: `Bearer ${RENDER_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("Triggering deploy...");
    await axios.post(`https://api.render.com/v1/services/${serviceId}/deploys`, {}, {
      headers: {
        Authorization: `Bearer ${RENDER_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("Successfully updated variables and triggered a deploy!");

  } catch (e: any) {
    console.error("Render API error:", e.response?.data || e.message);
  }
}

run();
