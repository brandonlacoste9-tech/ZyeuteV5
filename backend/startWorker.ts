// env vars are injected by Render at runtime — no dotenv needed in production
import {
  videoWorker,
  memoryWorker,
  privacyWorker,
  moderationWorker,
  hlsVideoWorker,
} from "./worker.js";

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
  // Don't exit, worker usually stays alive
});
