/**
 * Metrics Endpoint for Grafana/Prometheus
 * Exposes Guardian Bee health metrics
 */

import { Router } from "express";
import { db } from "../storage.js";
import { sql } from "drizzle-orm";
import { jackpotPools, beeTrades, transactions, beeListings } from "../../shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Prometheus metrics format
let recoveryCountTotal = 0;
let lastHealthCheck = Date.now();
let uptimeSeconds = process.uptime();

// Update uptime periodically
setInterval(() => {
  uptimeSeconds = process.uptime();
  lastHealthCheck = Date.now();
}, 1000);

/**
 * Increment recovery count (called by Guardian Bee)
 */
export function incrementRecoveryCount() {
  recoveryCountTotal++;
}

/**
 * GET /api/metrics
 * Prometheus-compatible metrics endpoint
 */
router.get("/metrics", async (req, res) => {
  try {
    const metrics: string[] = [];

    // Guardian Bee Metrics
    metrics.push(`# HELP recovery_count_total Total number of self-healing recovery events`);
    metrics.push(`# TYPE recovery_count_total counter`);
    metrics.push(`recovery_count_total ${recoveryCountTotal}`);

    metrics.push(`# HELP node_uptime_seconds Node uptime in seconds`);
    metrics.push(`# TYPE node_uptime_seconds gauge`);
    metrics.push(`node_uptime_seconds ${Math.floor(uptimeSeconds)}`);

    metrics.push(`# HELP node_health_check_timestamp Timestamp of last health check`);
    metrics.push(`# TYPE node_health_check_timestamp gauge`);
    metrics.push(`node_health_check_timestamp ${lastHealthCheck}`);

    // Economy Metrics
    try {
      const activeJackpots = await db
        .select({ count: sql<number>`count(*)` })
        .from(jackpotPools)
        .where(eq(jackpotPools.status, "active"));

      const jackpotCount = activeJackpots[0]?.count || 0;
      metrics.push(`# HELP jackpot_pools_active Number of active jackpot pools`);
      metrics.push(`# TYPE jackpot_pools_active gauge`);
      metrics.push(`jackpot_pools_active ${jackpotCount}`);

      // Get total jackpot value
      const jackpotValue = await db
        .select({
          total: sql<number>`sum(${jackpotPools.currentAmount})`,
        })
        .from(jackpotPools)
        .where(eq(jackpotPools.status, "active"));

      const totalValue = jackpotValue[0]?.total || 0;
      metrics.push(`# HELP jackpot_value_total_piasses Total value of active jackpots in Piasses`);
      metrics.push(`# TYPE jackpot_value_total_piasses gauge`);
      metrics.push(`jackpot_value_total_piasses ${totalValue}`);

      // Bee Trading Metrics (get trades from last 24h, not listings)
      const activeListings = await db
        .select({ count: sql<number>`count(*)` })
        .from(beeTrades)
        .where(
          sql`${beeTrades.createdAt} > NOW() - INTERVAL '24 hours'`
        );

      const trades24h = activeListings[0]?.count || 0;
      metrics.push(`# HELP bee_trades_24h Total bee trades in last 24 hours`);
      metrics.push(`# TYPE bee_trades_24h gauge`);
      metrics.push(`bee_trades_24h ${trades24h}`);

      // Transaction Volume
      const txVolume = await db
        .select({
          total: sql<number>`sum(${transactions.amount})`,
          count: sql<number>`count(*)`,
        })
        .from(transactions)
        .where(
          sql`${transactions.createdAt} > NOW() - INTERVAL '24 hours' AND ${transactions.status} = 'completed'`
        );

      const volume24h = txVolume[0]?.total || 0;
      const txCount24h = txVolume[0]?.count || 0;
      metrics.push(`# HELP transaction_volume_24h_piasses Total transaction volume in last 24 hours`);
      metrics.push(`# TYPE transaction_volume_24h_piasses gauge`);
      metrics.push(`transaction_volume_24h_piasses ${volume24h}`);

      metrics.push(`# HELP transaction_count_24h Total transactions in last 24 hours`);
      metrics.push(`# TYPE transaction_count_24h gauge`);
      metrics.push(`transaction_count_24h ${txCount24h}`);
    } catch (error) {
      // Metrics collection errors shouldn't break the endpoint
      console.error("[Metrics] Failed to collect economy metrics:", error);
    }

    // Node Health Status
    const healthStatus = 1; // 1 = healthy, 0 = unhealthy
    metrics.push(`# HELP node_health_status Node health status (1=healthy, 0=unhealthy)`);
    metrics.push(`# TYPE node_health_status gauge`);
    metrics.push(`node_health_status{job="zyeute"} ${healthStatus}`);

    res.setHeader("Content-Type", "text/plain; version=0.0.4");
    res.send(metrics.join("\n") + "\n");
  } catch (error: any) {
    console.error("[Metrics] Error generating metrics:", error);
    res.status(500).send(`# ERROR: ${error.message}\n`);
  }
});

/**
 * GET /api/metrics/health
 * Simple health check for Guardian Bee
 */
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptimeSeconds),
    recoveryCount: recoveryCountTotal,
  });
});

export default router;