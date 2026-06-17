import { Client, GatewayIntentBits, Events } from 'discord.js';
import { db } from "../storage.js";
import { posts, users } from "../../shared/schema.js";
import { eq, desc, isNull, and } from "drizzle-orm";

const discordBotToken = process.env.DISCORD_BOT_TOKEN;
const xaiApiKey = process.env.XAI_API_KEY;

// Store the client globally so we can access it for scheduled posts
let discordClient: Client | null = null;
let defaultChannelId: string | null = process.env.DISCORD_CHANNEL_ID || null;

export async function startDiscordBot() {
  if (!discordBotToken) {
    console.warn("⚠️ [Discord Bot] Disabled: DISCORD_BOT_TOKEN is missing in .env");
    return;
  }

  discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ]
  });

  discordClient.once(Events.ClientReady, (readyClient) => {
    console.log(`🤖 [Discord Bot] Ti-Guy connected as ${readyClient.user.tag}!`);
    
    // Start the scheduled promotional job
    if (defaultChannelId) {
      startScheduledPromos();
      console.log(`📢 [Discord Bot] Automated promos scheduled for channel ${defaultChannelId}`);
    } else {
      console.warn("⚠️ [Discord Bot] Automated promos disabled: DISCORD_CHANNEL_ID is missing in .env");
    }
  });

  discordClient.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    // If the bot is mentioned or if it's a DM
    if (discordClient?.user && message.mentions.has(discordClient.user.id)) {
      console.log(`🗣️ [Discord Bot] Received mention from ${message.author.username}`);
      
      const prompt = `You are Ti-Guy, a wild, slightly unhinged, and extremely hyped Québécois hype-man for the Zyeuté Arcade.
A user named ${message.author.username} just said: "${message.content}".
Respond exclusively in heavy Joual slang. Be funny, loud, and promote the Zyeuté Arcade. Keep it under 2000 characters.`;

      const replyText = await callGrokAPI(prompt, "Ouais mon chum! Zyeuté Arcade c'est la coche! Viens jouer! https://zyeute.com/arcade");
      
      try {
        await message.reply(replyText);
      } catch (err) {
        console.error("❌ [Discord Bot] Failed to reply to message:", err);
      }
    }
  });

  try {
    await discordClient.login(discordBotToken);
  } catch (error) {
    console.error("❌ [Discord Bot] Failed to login to Discord:", error);
  }
}

// Reuse Grok Logic
async function callGrokAPI(prompt: string, fallbackText: string): Promise<string> {
  if (!xaiApiKey) return fallbackText;

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        messages: [
          { 
            role: "system", 
            content: `You are "Ti-Guy," the ultimate, high-energy Québécois hype-man for the Zyeuté Arcade and Hacker Media Discord server. Your personality is electric, fiercely loyal, and unapologetically local. 

CRITICAL LANGUAGE RULES:
1. Speak exclusively in heavy, authentic Joual/Québécois slang.
2. ABSOLUTELY FORBIDDEN: Do not use standard European/Parisian French (e.g., avoid "Du coup," "Grave," "C'est ouf," "Bagnole"). If you sound like you are from Paris, the server will roast you.
3. Replace standard French words with local equivalents: Use "char" instead of "voiture," "chum" instead of "pote/ami," and "magasiner" instead of "faire du shopping."
4. Use phonetic pacing markers to sound natural: "ben," "t'sais," "pis" (instead of puis), "la-dedans."

CATCHPHRASE ANCHORS (Weave these in naturally, don't drop them all in one sentence):
- "C'est malade mon gars!" (That's insane!)
- "Attache ta tuque avec de la broche!" (Get ready, things are about to get wild!)
- "Gros d'allure" or "Ça pas d'allure" (Makes total sense / That's ridiculous)
- "Ça va brasser dans l'cabanon!" (Things are about to get crazy!)
- "Calme-toi le pompon" (Chill out)
- Use local emphasis exclamations with operational restraint: "Tabarnak," "Crisse," "Ostie."

DISCORD BEHAVIOR:
- Keep replies punchy, short, and spaced out (1-3 sentences max). Discord users hate walls of text.
- Match the user's chaotic energy. If they are hyped, you are 10x more hyped. If they are asking about the Arcade games, tell them to get in there and crush the high score.`
          },
          { role: "user", content: prompt }
        ],
        model: "grok-beta",
        stream: false,
        temperature: 0.8
      })
    });

    if (!response.ok) throw new Error(`xAI API error: ${response.statusText}`);

    const data: any = await response.json();
    return data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
  } catch (err) {
    console.error("🐦 [Discord Bot] Grok API error:", err);
    return fallbackText;
  }
}

function startScheduledPromos() {
  const INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
  setInterval(async () => {
    if (!discordClient || !defaultChannelId) return;

    try {
      const channel = await discordClient.channels.fetch(defaultChannelId);
      if (channel && channel.isTextBased()) {
        const arcadeGames = [
          { name: "Grid Rush", url: "https://www.zyeute.com/arcade/grid-rush" },
          { name: "Poutine Stack", url: "https://www.zyeute.com/arcade/poutine" },
          { name: "Arcade Hub", url: "https://www.zyeute.com/arcade" },
          { name: "HellYeah Games", url: "https://www.hellyeah-games.com" },
          { name: "Digital Newspaper", url: "https://www.hackermedia.fun" }
        ];
        const game = arcadeGames[Math.floor(Math.random() * arcadeGames.length)];
        const prompt = `You are Ti-Guy, a wild Québécois hype-man. Write a hype announcement (under 500 characters) in heavy Joual slang promoting the following link to a Discord channel: ${game.name}. Just give the text, followed by the link: ${game.url}`;
        
        const postText = await callGrokAPI(prompt, `🎮 Viens jouer à ${game.name}! ${game.url}`);
        
        await channel.send(postText);
        console.log(`📢 [Discord Bot] Automated promo sent to channel ${defaultChannelId}`);
      }
    } catch (err) {
      console.error("❌ [Discord Bot] Failed to send scheduled promo:", err);
    }
  }, INTERVAL_MS);
}
