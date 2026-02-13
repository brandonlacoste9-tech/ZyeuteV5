import { Worker, Job } from "bullmq";
import { VideoProcessingJob } from "./services/videoProcessor.js";
import { VideoOrchestrator } from "./services/videoOrchestrator.js";
import { hlsVideoWorker } from "./workers/hlsVideoProcessor.js";
import { MemoryMinerBee } from "./ai/bees/memory-miner.js";
import { PrivacyAuditorBee } from "./ai/bees/privacy-auditor.js";
import { HiveTask } from "./ai/types.js";
import { getBullMQConnection } from "./redis.js";

const connection = getBullMQConnection();

let videoWorker: Worker<VideoProcessingJob>;

try {
  if (!connection) {
    throw new Error("Redis connection not configured");
  }
  videoWorker = new Worker<VideoProcessingJob>(
    "zyeute-video-enhance",
    async (job) => {
      console.log(`[Worker] Received job for post ${job.data.postId}`);
      return await VideoOrchestrator.process(job.data);
    },
    {
      connection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || "2"),
      limiter: {
        max: 10,
        duration: 1000,
      },
    },
  );

  videoWorker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed!`);
  });

  videoWorker.on("failed", (job, err) => {
    console.log(`[Worker] Job ${job?.id} failed with ${err.message}`);
  });

  videoWorker.on("error", (err) => {
    // Don't crash on connection lost, just log
    console.error("[Worker] Redis connection error:", err.message);
  });
} catch (e: any) {
  if (e.message !== "Redis connection not configured") {
    console.error("Failed to initialize Video Worker:", e.message);
  } else {
    console.log("⚠️ [Worker] Video Worker disabled (Direct Mode active)");
  }
  // Create a dummy worker object to prevent exports validation failure
  videoWorker = {
    close: async () => {},
    on: () => {},
  } as unknown as Worker<VideoProcessingJob>;
}

export { videoWorker, hlsVideoWorker };

// --- MEMORY MINER WORKER ---
let memoryWorker: Worker;
try {
  if (!connection) {
    throw new Error("Redis connection not configured");
  }
  memoryWorker = new Worker(
    "zyeute-memory-miner",
    async (job) => {
      const { userId } = job.data;
      const taskId = job.id || `mininator-${Date.now()}`;

      console.log(
        `[MemoryWorker] ⛏️ Starting mining for user ${userId} (Task: ${taskId})`,
      );

      try {
        const miner = new MemoryMinerBee();

        // Construct a HiveTask payload for the Bee
        const task: HiveTask = {
          id: taskId,
          type: "text_chat",
          payload: {
            userId,
            systemInstruction: "MINE_MEMORY",
          },
          userId, // HiveTask has dedicated userId field
          createdAt: new Date(),
        };

        const result = await miner.run(task);
        console.log(`[MemoryWorker] ✅ Mining complete for ${userId}:`, result);
        return result;
      } catch (error: any) {
        console.error(`[MemoryWorker] 🚨 Mining failed for ${userId}:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 1, // Keep concurrency low to save tokens/rate limits
      limiter: {
        max: 5,
        duration: 60000, // Max 5 mining jobs per minute per worker
      },
    },
  );

  memoryWorker.on("completed", (job) => {
    console.log(`[MemoryWorker] Job ${job.id} completed!`);
  });

  memoryWorker.on("failed", (job, err) => {
    console.log(`[MemoryWorker] Job ${job?.id} failed with ${err.message}`);
  });

  memoryWorker.on("error", (err) => {
    console.error("[MemoryWorker] Redis connection error:", err.message);
  });
} catch (e: any) {
  if (e.message !== "Redis connection not configured") {
    console.error("Failed to initialize Memory Worker:", e.message);
  }
  memoryWorker = {
    close: async () => {},
    on: () => {},
  } as unknown as Worker;
}

export { memoryWorker };

// --- PRIVACY AUDITOR WORKER ---
let privacyWorker: Worker;
try {
  if (!connection) {
    throw new Error("Redis connection not configured");
  }
  privacyWorker = new Worker(
    "zyeute-privacy-auditor",
    async (job) => {
      console.log(`[PrivacyWorker] 🔒 Starting Privacy Audit...`);
      try {
        const auditor = new PrivacyAuditorBee();
        const result = await auditor.run({ limit: 50, force: true });
        console.log(`[PrivacyWorker] ✅ Compliance Check Complete:`, result);
        return result;
      } catch (error) {
        console.error(`[PrivacyWorker] 🚨 Audit failed:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 1,
    },
  );

  privacyWorker.on("error", (err) => {
    console.error("[PrivacyWorker] Redis connection error:", err.message);
  });
} catch (e: any) {
  if (e.message !== "Redis connection not configured") {
    console.error("Failed to initialize Privacy Worker:", e.message);
  }
  privacyWorker = {
    close: async () => {},
    on: () => {},
  } as unknown as Worker;
}

export { privacyWorker };
