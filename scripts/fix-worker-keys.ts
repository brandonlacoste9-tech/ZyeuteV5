import axios from "axios";

const RENDER_API_KEY = "rnd_uxQBVfQyZ6fOmVDA6eMYEQZE6Pdz";
const WORKER_SERVICE_NAME = "zyeute-worker";
const WEB_SERVICE_NAME = "zyeutev5-1";

async function run() {
  try {
    const servicesRes = await axios.get("https://api.render.com/v1/services?limit=20", {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` },
    });

    const services = servicesRes.data;
    const workerService = services.find((s: any) => s.service.name.toLowerCase() === WORKER_SERVICE_NAME);
    const webService = services.find((s: any) => s.service.name.toLowerCase() === WEB_SERVICE_NAME);

    if (!workerService || !webService) {
      console.error("Could not find worker or web service!");
      return;
    }

    // Get Web Env Vars to steal DATABASE_URL
    const webVarsRes = await axios.get(`https://api.render.com/v1/services/${webService.service.id}/env-vars`, {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` },
    });
    
    const dbUrlVar = webVarsRes.data.find((v: any) => v.envVar.key === "DATABASE_URL");
    const muxTokenVar = webVarsRes.data.find((v: any) => v.envVar.key === "MUX_TOKEN_ID");
    const muxSecretVar = webVarsRes.data.find((v: any) => v.envVar.key === "MUX_TOKEN_SECRET");

    const varsToInject: { key: string, value: string }[] = [
      { key: "DATABASE_URL", value: dbUrlVar.envVar.value },
      { key: "TIKAPI_KEY", value: "lHEExX2WHHuDg5UuUavbDpOVEkCa5twyQUtEfbUuvw7pzNn3" },
      { key: "TIKTOK_FEED_JOB_ENABLED", value: "true" }
    ];

    if (muxTokenVar && muxSecretVar) {
      varsToInject.push({ key: "MUX_TOKEN_ID", value: muxTokenVar.envVar.value });
      varsToInject.push({ key: "MUX_TOKEN_SECRET", value: muxSecretVar.envVar.value });
    }

    // Get Worker Env Vars
    const workerVarsRes = await axios.get(`https://api.render.com/v1/services/${workerService.service.id}/env-vars`, {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` },
    });
    const newWorkerVars = workerVarsRes.data.map((v: any) => ({
      key: v.envVar.key,
      value: v.envVar.value,
    }));

    // Merge
    for (const {key, value} of varsToInject) {
      const idx = newWorkerVars.findIndex((v: any) => v.key === key);
      if (idx >= 0) {
        newWorkerVars[idx].value = value;
      } else {
        newWorkerVars.push({ key, value });
      }
    }

    console.log("Applying keys to zyeute-worker...");
    await axios.put(`https://api.render.com/v1/services/${workerService.service.id}/env-vars`, newWorkerVars, {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}`, "Content-Type": "application/json" },
    });

    console.log("Triggering worker deploy...");
    await axios.post(`https://api.render.com/v1/services/${workerService.service.id}/deploys`, {}, {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` },
    });

    console.log("Successfully fixed zyeute-worker with TikTok keys!");

  } catch (e: any) {
    console.error("Render API error:", e.response?.data || e.message);
  }
}

run();
