import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "../.env") });

async function check() {
  const url = `https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      searchQueries: ["#quebec"],
      resultsPerPage: 1,
      maxProfilesPerQuery: 1,
      shouldDownloadVideos: true,
    })
  });
  const items = await response.json();
  if (items && items.length > 0) {
    const item = items[0];
    console.log("Keys available:", Object.keys(item));
    console.log("Video Meta Keys:", Object.keys(item.videoMeta || {}));
    if (item.videoMeta) {
        console.log("videoMeta.downloadAddr:", item.videoMeta.downloadAddr);
        console.log("videoMeta.playAddr:", item.videoMeta.playAddr);
    }
    console.log("mediaUrls:", item.mediaUrls);
  }
}

check();
