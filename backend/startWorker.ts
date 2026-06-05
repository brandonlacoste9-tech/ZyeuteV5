// env vars are injected by Render at runtime — no dotenv needed in production
import { getBullMQConnection } from "./redis.js";

// ─── Pre-flight: bail early if Redis is not configured ──────────────────────
// Without Redis there are no BullMQ queues to process. Running the worker
// in this state just wastes Render compute minutes in a crash-loop because
// the process has nothing to keep it alive.
const connection = getBullMQConnection();
if (!connection) {
  console.warn(
    "⚠️ [Worker] REDIS_URL not configured — no queues to process. " +
      "Worker entering idle standby (heartbeat every 60s). " +
      "Set REDIS_URL to enable background job processing.",
  );

  // Keep the process alive with a heartbeat so Render doesn't restart it
  // in a tight crash-loop. This is cheaper than constant restarts.
  const heartbeat = setInterval(() => {
    console.log(
      `💤 [Worker] Standby — waiting for REDIS_URL (${new Date().toISOString()})`,
    );
  }, 60_000);

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, exiting standby worker.`);
    clearInterval(heartbeat);
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
} else {
  // ─── Normal path: Redis is available, start all workers ─────────────────
  const { videoWorker, memoryWorker, privacyWorker, moderationWorker, hlsVideoWorker } =
    await import("./worker.js");

  console.log(
    "🚀 Zyeute Worker Started (Video + HLS + Memory + Privacy + Moderation)",
  );
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Concurrency: ${process.env.WORKER_CONCURRENCY || 2}`);

  // Keep process running and handle signals
  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing worker...`);
    await videoWorker.close();
    await hlsVideoWorker.close();
    await memoryWorker.close();
    await privacyWorker.close();
    await moderationWorker.close();
    console.log("Worker closed");
    process.exit(0);
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  // Handle unhandled rejections
  process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
    // Don't exit, worker stays alive via BullMQ event loop
  });
}
