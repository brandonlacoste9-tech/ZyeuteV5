import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
// import * as schema from '../../../../shared/schema.js'; // TODO: Add schema
const schema: any = {}; // Stub for build
import "./env-loader.js";

if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠️ [Synapse] Warning: DATABASE_URL missing. The Hive Mind will be unable to remember.",
  );
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
