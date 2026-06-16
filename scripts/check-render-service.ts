import axios from "axios";

const RENDER_API_KEY = "rnd_uxQBVfQyZ6fOmVDA6eMYEQZE6Pdz";
const SERVICE_ID = "srv-d6fm25sr85hc73e64mg0";

async function run() {
  try {
    const res = await axios.get(`https://api.render.com/v1/services/${SERVICE_ID}`, {
      headers: {
        Authorization: `Bearer ${RENDER_API_KEY}`,
        Accept: "application/json",
      },
    });
    console.log("Service Configuration:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error("Error fetching service config:", e.response?.data || e.message);
  }
}

run();
