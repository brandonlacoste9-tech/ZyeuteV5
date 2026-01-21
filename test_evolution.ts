import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import PromptEvolutionEngine from "./backend/scoring/evolution.js";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool);

async function testEvolution() {
  const engine = new PromptEvolutionEngine();
  try {
    console.log("--- RUNNING EVOLUTION DIAGNOSTIC ---");
    const diagnostic = await engine.diagnose(db);
    console.log("Quick Stats:", JSON.stringify(diagnostic.quickStats, null, 2));
    console.log("Anomaly Count:", diagnostic.anomalies.length);
    if (diagnostic.anomalies.length > 0) {
      console.log(
        "Top Anomaly:",
        diagnostic.anomalies[0].content.substring(0, 50),
      );
      console.log("Ratio:", diagnostic.anomalies[0].anomalyRatio);
    }
  } catch (err) {
    console.error("Evolution test failed:", err);
  } finally {
    await pool.end();
  }
}

testEvolution();
