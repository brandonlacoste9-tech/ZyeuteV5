// Supavisor Connection Pool Configuration (Production-Ready)
// For Node.js backend with 2M+ concurrent users

import { Pool } from 'pg';

// Production connection pool config
export const createProductionPool = () => {
    return new Pool({
        // Connection string from Supabase (use pooled connection)
        connectionString: process.env.DATABASE_URL,

        // Pool sizing for high concurrency
        max: 20,                    // Max connections per instance
        min: 5,                     // Keep warm connections

        // Timeouts (aggressive for production)
        idleTimeoutMillis: 10000,   // Close idle after 10s
        connectionTimeoutMillis: 5000, // Fail fast if can't connect

        // Statement timeout (prevent long-running queries)
        statement_timeout: 30000,   // 30s max per query
        idle_in_transaction_session_timeout: 15000, // 15s max idle in transaction

        // SSL for Supabase
        ssl: {
            rejectUnauthorized: false, // Supabase uses self-signed certs
        },

        // Query timeout
        query_timeout: 30000,

        // Application name for monitoring
        application_name: 'zyeute-v3-api',
    });
};

// Example usage in Express
import express from 'express';

const app = express();
const pool = createProductionPool();

// Health check with pool stats
app.get('/api/health', async (req, res) => {
    try {
        const { totalCount, idleCount, waitingCount } = pool;
        res.json({
            status: 'healthy',
            pool: {
                total: totalCount,
                idle: idleCount,
                waiting: waitingCount,
                active: totalCount - idleCount,
            },
        });
    } catch (error: any) {
        res.status(500).json({ status: 'unhealthy', error: error.message || String(error) });
    }
});

// Example query with proper error handling
app.get('/api/feed', async (req, res) => {
    const client = await pool.connect();
    try {
        // Use prepared statements for security
        const result = await client.query(
            `SELECT * FROM public.publications_moderee 
       WHERE deleted_at IS NULL 
       ORDER BY created_at DESC 
       LIMIT $1`,
            [20]
        );
        res.json({ posts: result.rows });
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        client.release(); // Always release the connection
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing pool...');
    await pool.end();
    process.exit(0);
});

export default pool;
