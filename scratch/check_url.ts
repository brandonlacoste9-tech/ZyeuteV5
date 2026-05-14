import { fetch } from "undici";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "../.env") });

async function checkUrl() {
  const url = `https://api.apify.com/v2/key-value-stores/Q17dnRHnfl2nro2ck/records/video-quebecsoli-20260513133825-7639370279625821460.mp4?token=${process.env.APIFY_API_KEY}`;
  console.log(`Fetching ${url}...`);
  try {
    const resp = await fetch(url, { method: "HEAD" });
    console.log(`Status: ${resp.status}`);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

checkUrl();
