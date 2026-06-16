import { db } from "../storage.js";
import { posts, users } from "../../shared/schema.js";
import { eq, desc, isNull, and, sql } from "drizzle-orm";

// Initialize Ayrshare API Key
const ayrshareApiKey = process.env.AYRSHARE_API_KEY;
const xaiApiKey = process.env.XAI_API_KEY;

if (ayrshareApiKey) {
  console.log("🌐 [Social Bot] Initialized successfully with Ayrshare API key.");
} else {
  console.warn("⚠️ [Social Bot] Missing AYRSHARE_API_KEY in environment. Bot is disabled.");
}

/**
 * Fetches the top-performing untweeted post from the database.
 * Prioritizes posts with a high viral score or fire count.
 */
async function fetchTopUntweetedPost() {
  const result = await db
    .select({
      id: posts.id,
      caption: posts.caption,
      username: users.username,
      viralScore: posts.viralScore,
      fireCount: posts.fireCount,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(
      and(
        isNull(posts.tweetedAt),
        eq(posts.visibility, "public"),
        eq(posts.processingStatus, "completed")
      )
    )
    .orderBy(desc(posts.viralScore), desc(posts.fireCount))
    .limit(1);

  return result[0];
}

/**
 * Uses Grok (xAI) to generate an unhinged Joual promotional tweet.
 * Falls back to standard templates if the API key is missing or fails.
 */
async function generateTweetContent(topic: string, url: string, fallbackText: string): Promise<string> {
  if (!xaiApiKey) {
    return `${fallbackText}\n\n👉 ${url} #Zyeute`;
  }

  try {
    const prompt = `You are a wild, slightly unhinged, and extremely hyped Québécois hype-man. Write a single short tweet (under 200 characters) in authentic Joual slang promoting the following link: ${topic}. Do not include hashtags. Just give the text of the tweet, followed by the link: ${url}`;
    
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

    if (!response.ok) {
      throw new Error(`xAI API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Remove wrapping quotes if Grok added them
    return content.replace(/^["']|["']$/g, '');
  } catch (err) {
    console.error("🐦 [Twitter Bot] Error calling Grok API, falling back:", err);
    return `${fallbackText}\n\n👉 ${url} #Zyeute`;
  }
}

/**
 * The main worker function that finds a post (or arcade game), posts it, and updates the database.
 */
export async function runSocialBotJob() {
  console.log("🌐 [Social Bot] Running scheduled post job...");

  if (!ayrshareApiKey) {
    console.log("🌐 [Social Bot] Skipped (No Ayrshare API key configured).");
    return;
  }

  try {
    // 20% chance to tweet about an Arcade game instead of a viral video
    if (Math.random() < 0.20) {
      const arcadeGames = [
        { name: "Grid Rush", url: "https://www.zyeute.com/arcade/grid-rush", desc: "Prêt pour Grid Rush ? Viens tester tes réflexes sur l'Arcade Zyeuté ! 🕹️⚡" },
        { name: "Hive Tap", url: "https://www.zyeute.com/arcade/hive-tap", desc: "Tape au rythme du Hive ! 🐝🎵 Viens jouer à Hive Tap sur l'Arcade Zyeuté !" },
        { name: "Poutine Stack", url: "https://www.zyeute.com/arcade/poutine", desc: "Empile ta poutine comme un pro ! 🍟🧀 Viens jouer sur l'Arcade Zyeuté !" },
        { name: "Arcade Hub", url: "https://www.zyeute.com/arcade", desc: "Découvre tous nos jeux rétro dans le Hub Arcade Zyeuté ! 👾🎮 Viens battre les high scores !" },
        { name: "HellYeah Games", url: "https://www.hellyeah-games.com", desc: "Plonge dans l'action avec HellYeah Games ! 🤘🎮 Les meilleurs jeux d'arcade sont ici." },
        { name: "Gamer Gurls", url: "https://www.gamergurls.com", desc: "Découvre la communauté ultime sur Gamer Gurls ! 🕹️✨ Le gaming à son meilleur." },
        { name: "IronClaw", url: "https://ironclaw-i1f8.vercel.app/", desc: "Attrape la victoire sur IronClaw ! 🦅🎮 Des jeux intenses pour de vrais joueurs." },
        { name: "KryptoTrac", url: "https://www.kryptotrac.com", desc: "La nouvelle ère du jeu est sur KryptoTrac ! 🚀👾 Joue et découvre de nouvelles dimensions." },
        { name: "Cyborg Gamers", url: "https://www.cyborggamers.com", desc: "Rejoins l'élite sur Cyborg Gamers ! 🤖🎮 Prépare-toi pour des sessions intenses." },
        { name: "Digital Newspaper", url: "https://digital-newspaper-gamma.vercel.app/", desc: "Reste informé avec notre Digital Newspaper ! 📰✨ L'actualité qui compte pour toi." },
        { name: "Floguru", url: "https://www.floguru.com", desc: "Trouve ton rythme sur Floguru ! 🌊🕹️ Laisse-toi emporter par le flow du jeu." }
      ];
      const game = arcadeGames[Math.floor(Math.random() * arcadeGames.length)];
      const postText = await generateTweetContent(`our awesome game site ${game.name}`, game.url, game.desc);

      // TODO: Replace with a real promotional image URL if you want to support Instagram/TikTok!
      const fallbackImageUrl = "https://www.zyeute.com/images/default-promo.png"; 

      console.log(`🌐 [Social Bot] Attempting to post Arcade promo: ${game.name}`);
      
      const ayrshareResponse = await fetch("https://app.ayrshare.com/api/post", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ayrshareApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          post: postText,
          // Add "instagram" and "tiktok" here once you confirm fallbackImageUrl is a real image/video!
          platforms: ["twitter"], 
          // mediaUrls: [fallbackImageUrl] 
        })
      });

      const result = await ayrshareResponse.json();
      if (result.status === "error") {
        console.error("🌐 [Social Bot] Ayrshare API returned errors:", result.message);
        return;
      }
      console.log(`🌐 [Social Bot] Arcade promo published successfully via Ayrshare! ID: ${result.id}`);
      return;
    }

    const post = await fetchTopUntweetedPost();

    if (!post) {
      console.log("🌐 [Social Bot] No suitable untweeted posts found. Will try again later.");
      return;
    }

    const postUrl = `https://www.zyeute.com/post/${post.id}`;
    const fallbackText = `🔥 Le buzz du moment sur Zyeuté ! Check out this viral moment by @${post.username}:\n\n"${post.caption || 'Incroyable!'}"`;
    const postText = await generateTweetContent(`a viral video on Zyeuté by @${post.username} titled "${post.caption || 'Incroyable!'}"`, postUrl, fallbackText);

    console.log(`🌐 [Social Bot] Attempting to post for Zyeute Post ID: ${post.id}`);
    
    // Send to Ayrshare
    const ayrshareResponse = await fetch("https://app.ayrshare.com/api/post", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ayrshareApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        post: postText,
        // Since we don't have the raw MP4 from Mux easily available yet, 
        // we restrict user posts to platforms that don't strictly require media (Twitter)
        platforms: ["twitter"]
      })
    });
    
    const result = await ayrshareResponse.json();
    if (result.status === "error") {
      console.error("🌐 [Social Bot] Ayrshare API returned errors:", result.message);
      return;
    }

    console.log(`🌐 [Social Bot] Post published successfully! Ayrshare ID: ${result.id}`);

    // Mark as tweeted in our database so we don't tweet it again
    await db
      .update(posts)
      .set({ tweetedAt: new Date() })
      .where(eq(posts.id, post.id));

    console.log(`🌐 [Social Bot] Marked post ${post.id} as posted.`);
  } catch (error) {
    console.error("🌐 [Social Bot] Error running post job:", error);
  }
}

/**
 * Starts the automated Social bot on a scheduled interval.
 * Default: Every 4 hours.
 */
export function startSocialBot() {
  if (!ayrshareApiKey) {
    console.warn("⚠️ [Social Bot] Background service disabled due to missing credentials.");
    return;
  }

  // Run the job every 4 hours (14,400,000 ms)
  const INTERVAL_MS = 4 * 60 * 60 * 1000;
  
  // Do a first run 5 minutes after startup to allow systems to stabilize
  setTimeout(() => {
    runSocialBotJob();
    setInterval(runSocialBotJob, INTERVAL_MS);
  }, 5 * 60 * 1000);
  
  console.log(`🌐 [Social Bot] Background service scheduled to run every 4 hours.`);
}
