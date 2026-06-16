import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });
import axios from "axios";

async function main() {
  try {
    const res = await axios.get("https://tiktok-scraper.omkar.cloud/tiktok/videos/search", {
      params: { search_query: "#Popular", market: "ca", max_results: 10, sort_by: "most_liked" },
      headers: { "API-Key": process.env.TIKTOK_SCRAPER_API_KEY }
    });
    console.log("Success:", Object.keys(res.data));
  } catch (err: any) {
    console.error("Error status:", err.response?.status);
    console.error("Error data:", err.response?.data);
  }
}
main();
