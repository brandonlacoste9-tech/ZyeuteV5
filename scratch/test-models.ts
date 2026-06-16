import { fetch } from "undici";
import "dotenv/config";

async function run() {
  const xaiApiKey = process.env.XAI_API_KEY;
  const response = await fetch("https://api.x.ai/v1/models", {
    headers: { "Authorization": `Bearer ${xaiApiKey}` }
  });
  const data: any = await response.json();
  console.log(data);
}
run();
