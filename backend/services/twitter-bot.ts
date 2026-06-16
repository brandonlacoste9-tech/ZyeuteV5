import { TwitterApi } from "twitter-api-v2";
import { db } from "../storage.js";
import { posts, users } from "../../shared/schema.js";
import { eq, desc, isNull, and, sql } from "drizzle-orm";

let twitterClient: TwitterApi | null = null;

// Initialize the Twitter client if credentials are provided
const apiKey = process.env.TWITTER_API_KEY;
const apiSecret = process.env.TWITTER_API_SECRET;
const accessToken = process.env.TWITTER_ACCESS_TOKEN;
const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

if (apiKey && apiSecret && accessToken && accessSecret) {
  twitterClient = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });
  console.log("🐦 [Twitter Bot] Initialized successfully with provided API keys.");
} else {
  console.warn("⚠️ [Twitter Bot] Missing Twitter API keys in environment. Bot is disabled.");
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
 * Generates the tweet content for a given post.
 */
function generateTweetContent(post: any): string {
  const postUrl = `https://www.zyeute.com/post/${post.id}`;
  
  const templates = [
    `🔥 Le buzz du moment sur Zyeuté ! Check out this viral moment by @${post.username}:\n\n"${post.caption || 'Incroyable!'}"\n\n👀 Watch it here: ${postUrl} #Zyeute #Quebec`,
    `Tu vas pas y croire! 😱 Regarde ce que @${post.username} vient de publier sur Zyeuté.\n\n👉 ${postUrl} #Zyeute #Viral`,
    `On fire! 🔥 @${post.username} casse l'internet québécois sur Zyeuté avec ce post.\n\n"${post.caption || 'C\'est fou!'}"\n\n👇 Voyez par vous-mêmes :\n${postUrl} #Zyeute`,
    `C'est le talk of the town! 🗣️ Découvrez le post le plus viral du jour par @${post.username} sur Zyeuté.\n\n🎥 ${postUrl} #ZyeuteQC`
  ];

  // Pick a random template
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  return randomTemplate;
}

/**
 * The main worker function that finds a post (or arcade game), tweets it, and updates the database.
 */
export async function runTwitterBotJob() {
  console.log("🐦 [Twitter Bot] Running scheduled tweet job...");

  if (!twitterClient) {
    console.log("🐦 [Twitter Bot] Skipped (No API keys configured).");
    return;
  }

  try {
    // 20% chance to tweet about an Arcade game instead of a viral video
    if (Math.random() < 0.20) {
      const arcadeGames = [
        { name: "Grid Rush", url: "https://www.zyeute.com/arcade/grid-rush", desc: "Prêt pour Grid Rush ? Viens tester tes réflexes sur l'Arcade Zyeuté ! 🕹️⚡" },
        { name: "Hive Tap", url: "https://www.zyeute.com/arcade/hive-tap", desc: "Tape au rythme du Hive ! 🐝🎵 Viens jouer à Hive Tap sur l'Arcade Zyeuté !" },
        { name: "Poutine Stack", url: "https://www.zyeute.com/arcade/poutine", desc: "Empile ta poutine comme un pro ! 🍟🧀 Viens jouer sur l'Arcade Zyeuté !" },
        { name: "Arcade Hub", url: "https://www.zyeute.com/arcade", desc: "Découvre tous nos jeux rétro dans le Hub Arcade Zyeuté ! 👾🎮 Viens battre les high scores !" }
      ];
      const game = arcadeGames[Math.floor(Math.random() * arcadeGames.length)];
      const tweetText = `${game.desc}\n\n👉 ${game.url} #Zyeute #RetroGaming #Quebec`;

      console.log(`🐦 [Twitter Bot] Attempting to post Arcade promo: ${game.name}`);
      const response = await twitterClient.v2.tweet(tweetText);
      if (response.errors && response.errors.length > 0) {
        console.error("🐦 [Twitter Bot] Twitter API returned errors:", response.errors);
        return;
      }
      console.log(`🐦 [Twitter Bot] Arcade promo published successfully! Tweet ID: ${response.data.id}`);
      return;
    }

    const post = await fetchTopUntweetedPost();

    if (!post) {
      console.log("🐦 [Twitter Bot] No suitable untweeted posts found. Will try again later.");
      return;
    }

    const tweetText = generateTweetContent(post);

    console.log(`🐦 [Twitter Bot] Attempting to post tweet for Zyeute Post ID: ${post.id}`);
    
    // Post the tweet
    const response = await twitterClient.v2.tweet(tweetText);
    
    if (response.errors && response.errors.length > 0) {
      console.error("🐦 [Twitter Bot] Twitter API returned errors:", response.errors);
      return;
    }

    console.log(`🐦 [Twitter Bot] Tweet published successfully! Tweet ID: ${response.data.id}`);

    // Mark as tweeted in our database so we don't tweet it again
    await db
      .update(posts)
      .set({ tweetedAt: new Date() })
      .where(eq(posts.id, post.id));

    console.log(`🐦 [Twitter Bot] Marked post ${post.id} as tweeted.`);
  } catch (error) {
    console.error("🐦 [Twitter Bot] Error running tweet job:", error);
  }
}

/**
 * Starts the automated Twitter bot on a scheduled interval.
 * Default: Every 4 hours.
 */
export function startTwitterBot() {
  if (!twitterClient) {
    console.warn("⚠️ [Twitter Bot] Background service disabled due to missing credentials.");
    return;
  }

  // Run the job every 4 hours (14,400,000 ms)
  const INTERVAL_MS = 4 * 60 * 60 * 1000;
  
  // Do a first run 5 minutes after startup to allow systems to stabilize
  setTimeout(() => {
    runTwitterBotJob();
    setInterval(runTwitterBotJob, INTERVAL_MS);
  }, 5 * 60 * 1000);
  
  console.log(`🐦 [Twitter Bot] Background service scheduled to run every 4 hours.`);
}
