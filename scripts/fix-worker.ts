import axios from "axios";

const RENDER_API_KEY = "rnd_uxQBVfQyZ6fOmVDA6eMYEQZE6Pdz";
const MAIN_SERVICE_NAME = "zyeutev5-1";
const WORKER_SERVICE_NAME = "zyeute-worker";

async function run() {
  try {
    const servicesRes = await axios.get("https://api.render.com/v1/services?limit=20", {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` },
    });

    const services = servicesRes.data;
    const mainService = services.find((s: any) => s.service.name.toLowerCase() === MAIN_SERVICE_NAME);
    const workerService = services.find((s: any) => s.service.name.toLowerCase() === WORKER_SERVICE_NAME);

    if (!mainService || !workerService) {
      console.error("Could not find one or both services!");
      return;
    }

    // Get Main Env Vars
    const mainVarsRes = await axios.get(`https://api.render.com/v1/services/${mainService.service.id}/env-vars`, {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` },
    });
    const mainVars = mainVarsRes.data;
    console.log("Main vars keys:", mainVars.map((v: any) => v.envVar.key).join(", "));
    const dbVars = mainVars.filter((v: any) => 
      ["VITE_SUPABASE_URL", "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "DATABASE_URL"].includes(v.envVar.key)
    );
    console.log("Found DB vars to transfer:", dbVars.map((v: any) => v.envVar.key));

    // Get Worker Env Vars
    const workerVarsRes = await axios.get(`https://api.render.com/v1/services/${workerService.service.id}/env-vars`, {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` },
    });
    const newWorkerVars = workerVarsRes.data.map((v: any) => ({
      key: v.envVar.key,
      value: v.envVar.value,
    }));

    // Merge
    for (const add of dbVars) {
      const idx = newWorkerVars.findIndex((v: any) => v.key === add.envVar.key);
      if (idx >= 0) {
        newWorkerVars[idx].value = add.envVar.value;
      } else {
        newWorkerVars.push({ key: add.envVar.key, value: add.envVar.value });
      }
    }

    console.log("Applying Database variables to zyeute-worker...");
    await axios.put(`https://api.render.com/v1/services/${workerService.service.id}/env-vars`, newWorkerVars, {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}`, "Content-Type": "application/json" },
    });

    console.log("Triggering worker deploy to stop crash loop...");
    await axios.post(`https://api.render.com/v1/services/${workerService.service.id}/deploys`, {}, {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` },
    });

    console.log("Successfully fixed zyeute-worker!");

  } catch (e: any) {
    console.error("Render API error:", e.response?.data || e.message);
  }
}

run();
