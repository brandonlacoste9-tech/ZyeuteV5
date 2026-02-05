import { Router } from "express";
import pool from "../database-pool.js";

const debugRouter = Router();

debugRouter.get("/momentum", async (_req, res) => {
  const client = await pool.connect();
  try {
    const eyeTestQuery = `
      SELECT 
          LEFT(content, 40) as "Title",
          quebec_score as "TiGuy_Opinion", 
          (
            ((quebec_score + 1) * (LN(COALESCE(reactions_count, 0) * 1 + COALESCE(shares_count, 0) * 3 + COALESCE(piasse_count, 0) * 5 + 1) + 1))
            / 
            POWER(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 + 2, 1.8)
          ) as "Hive_Reality",
          reactions_count as "Fires",
          shares_count as "Shares",
          piasse_count as "Piasse",
          ROUND(CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS NUMERIC), 1) as "Age_Hours"
      FROM publications
      WHERE (est_masque = false OR est_masque IS NULL)
      ORDER BY "Hive_Reality" DESC
      LIMIT 10;
    `;
    const res1 = await client.query(eyeTestQuery);

    const gravityQuery = `
      SELECT 
          LEFT(content, 40) as "Title",
          (
            ((quebec_score + 1) * (LN(COALESCE(reactions_count, 0) * 1 + COALESCE(shares_count, 0) * 3 + COALESCE(piasse_count, 0) * 5 + 1) + 1))
            / 
            POWER(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 + 2, 1.8)
          ) as "Reality",
          COALESCE(reactions_count, 0) + (COALESCE(shares_count, 0) * 3) + (COALESCE(piasse_count, 0) * 5) as "Total_Engagement",
          ROUND(CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS NUMERIC), 1) as "Age_Hours"
      FROM publications
      WHERE created_at < NOW() - INTERVAL '24 hours'
      ORDER BY "Age_Hours" DESC
      LIMIT 10;
    `;
    const res2 = await client.query(gravityQuery);

    res.json({
      success: true,
      eyeTest: res1.rows,
      gravityCheck: res2.rows,
    });
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// GET /api/debug/feed-db – run explore query and return success or the raw DB error (for fixing "nothing coming through")
debugRouter.get("/feed-db", async (_req, res) => {
  try {
    const { storage } = await import("../storage.js");
    const posts = await storage.getExplorePosts(0, 1, "quebec");
    res.json({
      ok: true,
      count: posts?.length ?? 0,
      hint: "If count is 0, DB is empty; run seed or use Pexels. If you got an error before, the table might be missing – run migrations.",
    });
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; detail?: string; table?: string };
    res.json({
      ok: false,
      error: e.message || "Unknown error",
      code: e.code,
      detail: e.detail,
      table: e.table,
      hint: 'If table is "publications", run migrations. If your DB has "posts" instead, you may need to rename or add a view.',
    });
  }
});

export default debugRouter;
