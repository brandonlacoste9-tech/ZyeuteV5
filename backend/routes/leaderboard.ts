import { Router } from "express";
import { db } from "../storage.js";
import { gifts, users } from "../../shared/schema.js";
import { eq, gte, sql, desc } from "drizzle-orm";

const router = Router();

// In-memory cache for leaderboard
interface CacheEntry {
  data: any[];
  timestamp: number;
}
let leaderboardCache: CacheEntry | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getStartOfWeekEST(): Date {
  const now = new Date();
  // Get current day (0=Sun, 1=Mon, ..., 6=Sat)
  const dayOfWeek = now.getDay();
  // Calculate days to subtract to get to Monday (if Sunday, subtract 6, else subtract day - 1)
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysToSubtract);
  startOfWeek.setHours(0, 0, 0, 0); // Local midnight, close enough for EST if server is EST or close
  
  return startOfWeek;
}

router.get("/weekly-tippers", async (req, res) => {
  try {
    const nowMs = Date.now();
    if (leaderboardCache && nowMs - leaderboardCache.timestamp < CACHE_TTL_MS) {
      return res.json(leaderboardCache.data);
    }

    const startOfWeek = getStartOfWeekEST();

    // Query to sum amounts sent by each user this week
    const topSenders = await db
      .select({
        userId: gifts.senderId,
        totalCennes: sql<number>`sum(${gifts.amount})::int`,
      })
      .from(gifts)
      .where(gte(gifts.createdAt, startOfWeek))
      .groupBy(gifts.senderId)
      .orderBy(desc(sql`sum(${gifts.amount})`))
      .limit(10);

    // If nobody gifted this week, return empty
    if (topSenders.length === 0) {
      leaderboardCache = { data: [], timestamp: nowMs };
      return res.json([]);
    }

    // Fetch user profiles for the top senders
    const userIds = topSenders.map(s => s.userId).filter(Boolean) as string[];
    
    // We can fetch all matching users in one query using inArray if needed, but since it's top 10, a loop or inArray is fine.
    // For simplicity, we just query them one by one or join. Let's do a quick loop since it's cached anyway.
    const enrichedSenders = await Promise.all(
      topSenders.map(async (sender, index) => {
        const [user] = await db.select().from(users).where(eq(users.id, sender.userId!)).limit(1);
        return {
          rank: index + 1,
          userId: sender.userId,
          username: user?.username || "Anonyme",
          displayName: user?.displayName || user?.username || "Anonyme",
          avatarUrl: user?.avatarUrl || null,
          isPremium: user?.isPremium || false,
          totalCennes: sender.totalCennes || 0,
        };
      })
    );

    leaderboardCache = { data: enrichedSenders, timestamp: nowMs };
    return res.json(enrichedSenders);

  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
