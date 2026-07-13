// Supavisor Connection Pool Configuration (Production-Ready)
// For Node.js backend scaling to many concurrent users

import { Pool } from "pg";

// Production connection pool config
export const createProductionPool = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return new Pool({
    // Connection string from Supabase (use pooled connection)
    connectionString: process.env.DATABASE_URL,

    // Pool sizing: Supabase pooler has limited slots per project.
    // Keep this tiny on free/starter hosts (matches storage.ts production max: 4).
    // Each Render/Railway instance opens its own pool — do NOT use min>0 on free tier.
    max: isProduction ? 4 : 10,
    min: 0,

    // Timeouts
    idleTimeoutMillis: 10000,
    // Session pooler (port 5432) can be slower to allocate under load
    connectionTimeoutMillis: isProduction ? 15000 : 5000,

    // Statement timeout (prevent long-running queries from locking DB)
    statement_timeout: 30000, // 30s max per query
    idle_in_transaction_session_timeout: 15000, // 15s max idle in transaction

    // Query timeout
    query_timeout: 30000,

    // SSL for Supabase
    ssl: {
      rejectUnauthorized: false, // Supabase uses self-signed certs
    },

    // Application name for monitoring in pg_stat_activity
    application_name: "zyeute-v5-api",
  });
};

// Graceful shutdown helper
export const shutdownPool = async (pool: Pool) => {
  console.log("🛑 Closing database pool...");
  await pool.end();
  console.log("✅ Database pool closed");
};

export default createProductionPool;
