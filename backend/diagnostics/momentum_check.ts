import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runDiagnostics() {
  const client = await pool.connect();
  try {
    console.log("\n--- DIAGNOSTIC 1: THE EYE TEST (Ranking vs Reality) ---");
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
      WHERE is_hidden = false OR is_hidden IS NULL
      ORDER BY "Hive_Reality" DESC
      LIMIT 10;
    `;
    const res1 = await client.query(eyeTestQuery);
    console.table(
      res1.rows.map((r) => ({
        ...r,
        Soul_Lift: (parseFloat(r.Hive_Reality) - r.TiGuy_Opinion).toFixed(2),
        Hive_Reality: parseFloat(r.Hive_Reality).toFixed(2),
      })),
    );

    console.log(
      "\n--- DIAGNOSTIC 2: THE GRAVITY CHECK (Evergreens & Zombies) ---",
    );
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
    console.table(
      res2.rows.map((r) => ({
        ...r,
        Reality: parseFloat(r.Reality).toFixed(4),
      })),
    );
  } catch (err) {
    console.error("Diagnostic error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

runDiagnostics();
