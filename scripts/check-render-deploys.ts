import axios from "axios";

const RENDER_API_KEY = "rnd_uxQBVfQyZ6fOmVDA6eMYEQZE6Pdz";
const WEB_SERVICE_ID = "srv-d6fm25sr85hc73e64mg0";
const WORKER_SERVICE_ID = "srv-cvvptc5ds78s73ba64kg"; // we can fetch it or hardcode

async function checkDeploys(serviceId: string, name: string) {
  try {
    const res = await axios.get(`https://api.render.com/v1/services/${serviceId}/deploys?limit=3`, {
      headers: {
        Authorization: `Bearer ${RENDER_API_KEY}`,
        Accept: "application/json",
      },
    });
    console.log(`\nDeploys for ${name} (${serviceId}):`);
    res.data.forEach((d: any) => {
      console.log(`- ID: ${d.deploy.id} | Status: ${d.deploy.status} | Triggered: ${d.deploy.createdAt} | Commit: ${d.deploy.commit?.message || "N/A"}`);
    });
  } catch (e: any) {
    console.error(`Error checking ${name}:`, e.response?.data || e.message);
  }
}

async function run() {
  console.log("Fetching services list to confirm IDs...");
  try {
    const servicesRes = await axios.get("https://api.render.com/v1/services?limit=20", {
      headers: {
        Authorization: `Bearer ${RENDER_API_KEY}`,
        Accept: "application/json",
      },
    });
    const services = servicesRes.data;
    const web = services.find((s: any) => s.service.name.toLowerCase() === "zyeutev5-1");
    const worker = services.find((s: any) => s.service.name.toLowerCase() === "zyeute-worker");

    if (web) await checkDeploys(web.service.id, "zyeutev5-1 (Web)");
    if (worker) await checkDeploys(worker.service.id, "zyeute-worker (Worker)");
  } catch (e: any) {
    console.error("Render API error:", e.response?.data || e.message);
  }
}

run();
