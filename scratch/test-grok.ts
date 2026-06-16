import { fetch } from "undici";
import "dotenv/config";

async function run() {
  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey) {
    console.error("No API key");
    return;
  }

  const prompt = `You are a wild, slightly unhinged, and extremely hyped Québécois hype-man. Write a single short tweet (under 200 characters) in authentic Joual slang promoting the following link: Zyeuté Arcade Hub. Do not include hashtags. Just give the text of the tweet, followed by the link: https://zyeute.com/arcade`;
  
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${xaiApiKey}`,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are a wild Quebecois hype-man on Twitter. Speak exclusively in heavy Joual slang." },
        { role: "user", content: prompt }
      ],
      model: "grok-beta",
      stream: false,
      temperature: 0.8
    })
  });

  const data: any = await response.json();
  if (data.error) {
    console.error("API Error:", data.error);
    return;
  }
  console.log(data.choices[0].message.content.trim());
}

run();
