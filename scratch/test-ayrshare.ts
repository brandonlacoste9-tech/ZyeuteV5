import { fetch } from "undici";
import "dotenv/config";

async function run() {
  const apiKey = process.env.AYRSHARE_API_KEY;
  console.log("Testing Ayrshare with API Key:", apiKey ? "Present" : "Missing");

  const ayrshareResponse = await fetch("https://app.ayrshare.com/api/post", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      post: "Ceci est un test automatisé depuis le backend de Zyeuté! 🔥 #Zyeute",
      platforms: ["twitter"]
    })
  });
  
  const result = await ayrshareResponse.json();
  console.log("Ayrshare Response:", result);
}
run();
