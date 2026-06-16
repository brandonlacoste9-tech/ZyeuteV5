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
        limit: 100,
      },
    });
    console.log("Logs response:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error("Error fetching logs:", e.response?.data || e.message);
  }
}

run();
