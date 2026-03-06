import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env") });

async function tryConnect(url: string) {
  console.log(`\n🔍 Trying URL... ${url.replace(/:[^:@]+@/, ":***@")}`);
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res = await pool.query(
      "SELECT NOW() as now, current_database() as db",
    );
    console.log("✅ Connection Successful!");
    return true;
  } catch (err: any) {
    console.log(`❌ Failed: ${err.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function run() {
  const original = process.env.DATABASE_URL || "";

  const alternatives = [
    original,
    original
      .replace(":6543", ":5432")
      .replace("postgres.vuanulvyqkfefmjcikfk", "postgres"),
    original.replace("postgres.vuanulvyqkfefmjcikfk", "postgres"),
    original.replace(":6543", ":5432"),
  ];

  for (const url of alternatives) {
    if (await tryConnect(url)) {
      console.log(`\n🟢 Best connection string found. Please update .env`);
      process.exit(0);
    }
  }

  console.log("\n🔴 Could not find a working connection string.");
  process.exit(1);
}

run();
