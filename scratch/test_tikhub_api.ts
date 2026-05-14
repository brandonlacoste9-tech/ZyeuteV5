import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TIKHUB_API_KEY = process.env.TIKHUB_API_KEY;

async function discover() {
  if (!TIKHUB_API_KEY) {
    console.error("❌ TIKHUB_API_KEY missing");
    return;
  }

  console.log("🔍 Testing TikHub API...");
  
  try {
    const response = await axios.get("https://api.tikhub.io/api/v1/tiktok/web/fetch_search_video", {
      headers: {
        "Authorization": `Bearer ${TIKHUB_API_KEY}`
      },
      params: {
        keyword: "quebec",
        count: 5,
        offset: 0
      }
    });

    console.log("✅ Response received!");
    console.log(JSON.stringify(response.data, null, 2).substring(0, 2000));
    
    // Save to a file for later analysis
    const fs = await import("fs");
    fs.writeFileSync("tikhub_sample_response.json", JSON.stringify(response.data, null, 2));
    
  } catch (error: any) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

discover();
