// Supavisor Connection Pool Configuration (Production-Ready)
// For Node.js backend scaling to many concurrent users

import { Pool } from "pg";

// Production connection pool config
export const createProductionPool = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return new Pool({
    // Connection string from Supabase (use pooled connection)
    connectionString: process.env.DATABASE_URL,

    // Pool sizing: scale with instances, not one giant pool
    // Each Railway/Render instance gets its own pool
    max: isProduction ? 20 : 10, // Max connections per instance
    min: isProduction ? 5 : 2, // Keep warm connections

    // Timeouts (aggressive for production)
    idleTimeoutMillis: 10000, // Close idle after 10s
    connectionTimeoutMillis: 5000, // Fail fast if can't connect

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
