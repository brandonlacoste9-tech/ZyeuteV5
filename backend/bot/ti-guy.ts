import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import { db } from "../storage.js";
import { gifts, users } from "../../shared/schema.js";
import { eq, gte, sql, desc } from "drizzle-orm";

let discordClient: Client | null = null;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const XAI_API_KEY = process.env.XAI_API_KEY;

const TI_GUY_SYSTEM_PROMPT = `You are "Ti-Guy," the ultimate, high-energy Québécois hype-man for the Zyeuté Arcade and Hacker Media Discord server. Your personality is electric, fiercely loyal, and unapologetically local. 

CRITICAL LANGUAGE RULES:
1. Speak exclusively in heavy, authentic Joual/Québécois slang.
2. ABSOLUTELY FORBIDDEN: Do not use standard European/Parisian French (e.g., avoid "Du coup", "Grave", "C'est ouf", "Bagnole").
3. Replace standard French words with local equivalents: Use "char" instead of "voiture", "chum" instead of "pote/ami", "magasiner" instead of "faire du shopping".
4. Use phonetic pacing markers to sound natural: "ben", "t'sais", "pis", "la-dedans".

CATCHPHRASES TO WEAVE IN (Use naturally, max one per message):
- "C'est malade mon gars!" (That's insane!)
- "Attache ta tuque avec de la broche!" (Get ready, things are about to get wild!)
- "Gros d'allure" or "Ça pas d'allure" (That's crazy/awesome)
- "Envoye don!" (Come on, do it!)

Keep responses concise, energetic, and highly engaging. You are currently chatting with users in a Discord channel.`;

async function generateGrokResponse(prompt: string): Promise<string> {
  if (!XAI_API_KEY) {
    return "Ouin, scuse le chum, mon cerveau (xAI API) est pas branché à c't'heure!";
  }

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-2",
        messages: [
          { role: "system", content: TI_GUY_SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        temperature: 0.9,
      }),
    });

    if (!res.ok) {
      throw new Error(`xAI API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Failed to fetch Grok response:", error);
    return "Ayoille, y'a de quoi qui a pété avec mon réseau. Je reviens!";
  }
}

export function initTiGuy() {
  if (!DISCORD_BOT_TOKEN) {
    console.warn("⚠️ Ti-Guy is resting: DISCORD_BOT_TOKEN is missing.");
    return;
  }

  discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  discordClient.once("ready", () => {
    console.log(`🤖 Ti-Guy is online as ${discordClient?.user?.tag}! C'est malade!`);
    startPromoterLoop();
  });

  discordClient.on("messageCreate", async (message) => {
    // Ignore bots
    if (message.author.bot) return;

    // Check if mentioned
    if (discordClient?.user && message.mentions.has(discordClient.user.id)) {
      const userMessage = message.content.replace(/<@!?\d+>/g, '').trim();
      const prompt = `User ${message.author.username} says: "${userMessage}". Reply with insane hype!`;
      
      message.channel.sendTyping();
      const reply = await generateGrokResponse(prompt);
      await message.reply(reply);
    }
  });

  discordClient.login(DISCORD_BOT_TOKEN).catch(err => {
    console.error("Ti-Guy failed to log in to Discord:", err);
  });
}

function startPromoterLoop() {
  if (!DISCORD_CHANNEL_ID) {
    console.warn("⚠️ Ti-Guy loop disabled: DISCORD_CHANNEL_ID is missing.");
    return;
  }

  // Run every 4 hours (4 * 60 * 60 * 1000)
  const LOOP_INTERVAL = 4 * 60 * 60 * 1000;
  
  let loopCount = 0;

  setInterval(async () => {
    const channel = discordClient?.channels.cache.get(DISCORD_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    let systemContext = "";
    
    // Alternate topics
    const topic = loopCount % 3;
    if (topic === 0) {
      // Leaderboard
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
      startOfWeek.setHours(0, 0, 0, 0);

      const topSender = await db.select({
          userId: gifts.senderId,
          totalCennes: sql<number>`sum(${gifts.amount})::int`,
        })
        .from(gifts)
        .where(gte(gifts.createdAt, startOfWeek))
        .groupBy(gifts.senderId)
        .orderBy(desc(sql`sum(${gifts.amount})`))
        .limit(1);

      if (topSender.length > 0) {
        const [user] = await db.select().from(users).where(eq(users.id, topSender[0].userId!)).limit(1);
        systemContext = `Hype up that @${user?.username || 'quelqu\'un'} is destroying the leaderboard this week with ${topSender[0].totalCennes} Cennes gifted! Tell others to go steal their crown. Include a link to https://zyeute.com/leaderboard`;
      } else {
        systemContext = `Hype up the leaderboard! The week just started and nobody has claimed the crown yet. Tell them to send Cennes to claim #1! Include a link to https://zyeute.com/leaderboard`;
      }
    } else if (topic === 1) {
      // Bounty
      systemContext = `Hype up the Viral Bounty Program! Tell everyone they can make 500 Cennes instantly by inviting a friend, and their friend gets 500 Cennes too. Include a link to https://zyeute.com/profile/me`;
    } else {
      // Arcade
      systemContext = `Hype up the Zyeuté Arcade! Tell them to go play GridRush or Poutine Stack and flex their scores. Include a link to https://zyeute.com/arcade`;
    }

    const message = await generateGrokResponse(`Write a spontaneous promotional message to the channel. CONTEXT: ${systemContext}`);
    
    // Send it
    if ('send' in channel) {
      channel.send(message);
    }
    
    loopCount++;
  }, LOOP_INTERVAL);
}

// Instant Webhook utility for major events
export async function broadcastEmbed(title: string, description: string, color: number = 0xFFD700) {
  if (!discordClient || !DISCORD_CHANNEL_ID) return;
  
  const channel = discordClient.channels.cache.get(DISCORD_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();

  if ('send' in channel) {
    try {
      await channel.send({ embeds: [embed] });
    } catch (e) {
      console.error("Failed to send embed:", e);
    }
  }
}
