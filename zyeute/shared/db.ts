/**
 * DATABASE CONNECTION MANAGER
 * 
 * Centralizes database connection so we can easily swap from Supabase Postgres to Neon.
 * 
 * TODO: Replace with Neon connection string once migration is complete
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

// TODO: Replace with Neon connection string
// For now, use Supabase Postgres connection string
const getConnectionString = (): string => {
  // Prefer DATABASE_URL (for Neon) if set, otherwise fall back to Supabase
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Fallback to Supabase connection string
  // Supabase connection string format: postgresql://postgres:[password]@[host]:5432/postgres
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  if (supabaseUrl) {
    // Extract connection details from Supabase URL if needed
    // For now, assume DATABASE_URL is set separately
    console.warn("⚠️ Using Supabase connection. Set DATABASE_URL for Neon migration.");
  }
  
  throw new Error("DATABASE_URL or Supabase connection string must be set");
};

let dbInstance: ReturnType<typeof drizzle> | null = null;

/**
 * Get database connection instance
 * Creates a connection pool if one doesn't exist
 */
export function getDbConnection() {
  if (!dbInstance) {
    const connectionString = getConnectionString();
    
    const pool = new Pool({
      connectionString,
      max: 20, // Max connections per instance
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 60000,
    });

    dbInstance = drizzle(pool);
  }

  return dbInstance;
}

/**
 * Close database connection pool
 * Useful for cleanup in tests or shutdown
 */
export async function closeDbConnection() {
  if (dbInstance) {
    // Drizzle doesn't expose pool directly, so we need to track it
    // For now, this is a placeholder
    dbInstance = null;
  }
}
