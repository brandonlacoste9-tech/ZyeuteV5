import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  connectionString:
    "postgresql://postgres:kHDQJHWAPzxpUXQlXIsKwXPamtQPnwiU@trolley.proxy.rlwy.net:44815/railway",
  ssl: { rejectUnauthorized: false },
});

async function checkSchema() {
  const client = await pool.connect();
  try {
    console.log("Checking table 'publications'...");
    const res = await client.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'publications';
    `);
    console.log("Columns in 'publications':");
    res.rows.forEach((row) => {
      console.log(` - ${row.column_name}: ${row.data_type} (${row.udt_name})`);
    });

    const hasLocation = res.rows.some((r) => r.column_name === "location");
    if (!hasLocation) {
      console.log("\n❌ MISSING 'location' column!");
    } else {
      console.log("\n✅ 'location' column exists.");
    }

    const hasReactions = res.rows.some(
      (r) => r.column_name === "reactions_count",
    );
    if (!hasReactions) {
      console.log("❌ MISSING 'reactions_count' column!");
    }
  } catch (err) {
    console.error("Error checking schema:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
