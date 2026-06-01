import { MomentumBlender, type PostMetrics } from "./index.js";
import { sql } from "drizzle-orm";

let momentumEngine: MomentumBlender | null = null;

export async function initScoringEngine(): Promise<MomentumBlender> {
  if (!momentumEngine) {
    momentumEngine = new MomentumBlender();
    await momentumEngine.init();
    console.log("[Scoring] MomentumBlender initialized");
  }
  return momentumEngine;
}

export function getScoringEngine(): MomentumBlender {
  if (!momentumEngine) {
    throw new Error(
      "Scoring engine not initialized. Call initScoringEngine() first.",
    );
  }
  return momentumEngine;
}

export async function shutdownScoringEngine(): Promise<void> {
  if (momentumEngine) {
    await momentumEngine.shutdown();
    momentumEngine = null;
    console.log("[Scoring] MomentumBlender shutdown complete");
  }
}

export async function recordReactionWithMomentum(
  db: any,
  posts: any,
  postId: string,
): Promise<void> {
  await db
    .update(posts)
    .set({ fireCount: sql`${posts.fireCount} + 1` })
    .where(sql`id = ${postId}`);

  const engine = getScoringEngine();
  engine.recordFire(postId).catch((err) => {
    console.error("[Scoring] Failed to record fire:", err);
  });
}

export async function getSmartRecommendationsV3(
  db: any,
  hiveId: string = "quebec",
  limit: number = 20,
): Promise<any[]> {
  const result = await db.execute(sql`
    SELECT 
      p.*,
      u.username,
      u.display_name,
      u.avatar_url,
      u.region as creator_region,
      (
        ((p.quebec_score + 1) * (LN(COALESCE(p.reactions_count, 0) * 1 + COALESCE(p.shares_count, 0) * 3 + COALESCE(p.piasse_count, 0) * 5 + 1) + 1))
        / 
        POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 + 2, 1.8)
      ) as momentum_score,
      (
        COALESCE(p.reactions_count, 0) * 3 +
        COALESCE(p.comments_count, 0) * 5 +
        COALESCE(p.view_count, 0) * 1 +
        COALESCE(avg_watch.avg_pct, 0) * 2
      ) as engagement_score
    FROM publications p
    JOIN user_profiles u ON p.user_id = u.id
    LEFT JOIN (
      SELECT post_id, AVG(watch_pct) as avg_pct
      FROM watch_events
      GROUP BY post_id
    ) avg_watch ON avg_watch.post_id = p.id
    WHERE p.hive_id = ${hiveId}
      AND (p.is_moderated = false OR p.moderation_approved = true)
    ORDER BY (
      (
        COALESCE(p.reactions_count, 0) * 3 +
        COALESCE(p.comments_count, 0) * 5 +
        COALESCE(p.view_count, 0) * 1 +
        COALESCE(avg_watch.avg_pct, 0) * 2
      ) * 0.7 + EXTRACT(EPOCH FROM (NOW() - p.created_at)) / -86400.0 * 30
    ) DESC
    LIMIT ${limit}
  `);

  return result.rows;
}

export async function batchUpdateViralScores(db: any): Promise<number> {
  const result = await db.execute(sql`
    UPDATE publications
    SET viral_score = ROUND(
      ((quebec_score + 1) * (LN(COALESCE(reactions_count, 0) * 1 + COALESCE(shares_count, 0) * 3 + COALESCE(piasse_count, 0) * 5 + 1) + 1))
      / 
      POWER(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 + 2, 1.8) * 1000
    )
    WHERE created_at > NOW() - INTERVAL '7 days'
  `);

  return result.rowCount || 0;
}

export function createExploreRouteV2(app: any, db: any): void {
  app.get("/api/explore/v2", async (req: any, res: any) => {
    try {
      const hiveId = (req.query.hive as string) || "quebec";
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      const posts = await getSmartRecommendationsV3(db, hiveId, limit);

      res.json({
        success: true,
        data: posts,
        meta: {
          algorithm: "momentum-v1",
          hive: hiveId,
          count: posts.length,
        },
      });
    } catch (error) {
      console.error("[Explore V2] Error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch feed" });
    }
  });
}
