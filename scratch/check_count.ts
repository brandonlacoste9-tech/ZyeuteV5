
import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

async function checkCount() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const result = await pool.query("SELECT count(*) FROM publications");
    console.log("Total publications:", result.rows[0].count);
    
    const videoResult = await pool.query("SELECT count(*) FROM publications WHERE type = 'video'");
    console.log("Total videos:", videoResult.rows[0].count);

    const quebecResult = await pool.query("SELECT count(*) FROM publications WHERE hive_id = 'quebec'");
    console.log("Quebec hive publications:", quebecResult.rows[0].count);
  } catch (error) {
    console.error("Error checking count:", error);
  } finally {
    await pool.end();
  }
}

checkCount();
