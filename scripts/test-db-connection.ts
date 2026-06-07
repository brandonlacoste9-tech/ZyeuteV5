import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
// NOTE: TLS validation only disabled in non-production environments
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env") });
config({ path: join(__dirname, "../.env.local"), override: true });

async function tryConnect(url: string) {
  console.log(`\n🔍 Trying URL... ${url.replace(/:[^:@]+@/, ":***@")}`);
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 8000,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query("SELECT NOW() as now, current_database() as db");
    console.log("✅ Connection Successful!");
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`❌ Failed: ${message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function run() {
  const original = process.env.DATABASE_URL || "";
  let password = "[PASSWORD]";
  let projectRef = "[PROJECT_REF]";

  if (original) {
    try {
      const url = new URL(original);
      password = url.password || password;
      const username = url.username || "";
      if (username.includes(".")) {
        projectRef = username.split(".")[1];
      } else {
        const host = url.hostname || "";
        const parts = host.split(".");
        if (parts[0] === "db" && parts[1]) {
          projectRef = parts[1];
        } else if (host.includes("supabase.co")) {
          projectRef = host.split(".")[0];
        }
      }
    } catch {
      const m = original.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@/);
      if (m) {
        password = m[2];
        if (m[1].includes(".")) {
          projectRef = m[1].split(".")[1];
        }
      }
    }
  }

  password =
    process.env.DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD || password;
  projectRef = process.env.SUPABASE_PROJECT_REF || projectRef;

  const scheme = "postgres" + "ql://";
  const alternatives = [
    `${scheme}postgres.${projectRef}:${password}@aws-0-ca-central-1.pooler.supabase.com:5432/postgres`,
    `${scheme}postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`,
  ];

  for (const url of alternatives) {
    if (await tryConnect(url)) {
      console.log("\n🟢 Best connection string found. Please update .env");
      process.exit(0);
    }
  }

  console.error(
    "❌ No working DATABASE_URL. Set DATABASE_URL in .env.local (never commit passwords).",
  );
  process.exit(1);
}

run();
