import axios from "axios";

const RENDER_API_KEY = "rnd_uxQBVfQyZ6fOmVDA6eMYEQZE6Pdz";
const SERVICE_ID = "srv-d6fm25sr85hc73e64mg0";
const OWNER_ID = "tea-d389jr3uibrs739kv960";

async function run() {
  try {
    const res = await axios.get("https://api.render.com/v1/logs", {
      headers: {
        Authorization: `Bearer ${RENDER_API_KEY}`,
        Accept: "application/json",
      },
      params: {
        ownerId: OWNER_ID,
        resource: SERVICE_ID,
        limit: 250,
      },
    });
    
    // Render returns logs inside an array directly or inside res.data.
    const logs = Array.isArray(res.data) ? res.data : (res.data.logs || []);
    console.log(`Fetched ${logs.length} logs.`);
    
    const instances: Record<string, any[]> = {};
    logs.forEach((log: any) => {
      const instLabel = log.labels.find((l: any) => l.name === "instance");
      const instId = instLabel ? instLabel.value : "unknown";
      if (!instances[instId]) {
        instances[instId] = [];
      }
      instances[instId].push(log);
    });

    console.log("\nDetected instances in logs:", Object.keys(instances));

    for (const [instId, instLogs] of Object.entries(instances)) {
      console.log(`\n=== Logs for Instance ${instId} (${instLogs.length} lines) ===`);
      // Print first 5 and last 15 lines
      const sorted = instLogs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      if (sorted.length <= 20) {
        sorted.forEach(l => console.log(`[${l.timestamp}] ${l.message}`));
      } else {
        console.log("... First 5 lines ...");
        sorted.slice(0, 5).forEach(l => console.log(`[${l.timestamp}] ${l.message}`));
        console.log("... Last 15 lines ...");
        sorted.slice(-15).forEach(l => console.log(`[${l.timestamp}] ${l.message}`));
      }
    }
  } catch (e: any) {
    console.error("Error fetching logs:", e.response?.data || e.message);
  }
}

run();
