import { Queue } from "bullmq";
import { getBullMQConnection } from "./redis.js";

/**
 * BullMQ Queue Management with centralized Redis connection
 * Uses lazy singleton pattern - queues are only created when needed
 */

// Lazy Singleton Pattern - Queues are only created when actually used
let videoQueueInstance: Queue | null = null;
let hlsVideoQueueInstance: Queue | null = null;
let analyticsQueueInstance: Queue | null = null;
let blockchainQueueInstance: Queue | null = null;
let memoryQueueInstance: Queue | null = null;
let privacyQueueInstance: Queue | null = null;

// Use centralized Redis configuration
const connection = getBullMQConnection();

import { VideoOrchestrator } from "./services/videoOrchestrator.js";

// 🚨 QUEUE 1: Video Enhancement (High Priority)
export const getVideoQueue = (): Queue => {
  // 1. If we already have a queue, return it (Warm container)
  if (videoQueueInstance) {
    return videoQueueInstance;
  }

  // 2. Safety Check: Do we even have Redis credentials?
  if (!connection) {
    console.warn(
      "⚠️ Redis connection config missing. Using Direct Mode for Video.",
    );
    return {
      add: async (name: string, data: any) => {
        console.log(
          "⚠️ [Direct Mode] Starting video processing in background...",
        );
        // Run immediately in background (fire & forget)
        VideoOrchestrator.process(data).catch((e) =>
          console.error("Direct Processing Failed:", e),
        );
        return { id: "direct-" + Date.now() };
      },
      close: async () => {},
    } as unknown as Queue;
  }

  // 3. Connect (Only happens once per container)
  console.log("🔌 Initializing Video Queue Redis connection...");
  try {
    videoQueueInstance = new Queue("zyeute-video-enhance", {
      connection: {
        ...connection,
        // Fail fast if local
        enableOfflineQueue: false,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
      },
    });

    // Error listener to prevent unhandled crashes
    videoQueueInstance.on("error", (err) => {
      console.error("❌ Video Queue Redis Connection Error:", err.message);
    });
  } catch (e) {
    console.error(
      "❌ Failed to initialize video queue (Redis missing). Using Direct Mode.",
    );
    return {
      add: async (name: string, data: any) => {
        console.log(
          "⚠️ [Direct Mode] Starting video processing in background (Fallback)...",
        );
        VideoOrchestrator.process(data).catch((err) =>
          console.error("Direct Processing Failed:", err),
        );
        return { id: "direct-" + Date.now() };
      },
      close: async () => {},
    } as unknown as Queue;
  }

  return videoQueueInstance;
};

// 🎬 HLS Video Processing Queue (adaptive bitrate)
export const getHLSVideoQueue = (): Queue | null => {
  if (hlsVideoQueueInstance) return hlsVideoQueueInstance;
  if (!connection) return null;
  try {
    hlsVideoQueueInstance = new Queue("video-hls-processing", {
      connection: { ...connection, enableOfflineQueue: false },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: true,
      },
    });
    return hlsVideoQueueInstance;
  } catch {
    return null;
  }
};

// 📊 QUEUE 2: Analytics (Low Priority)
export const getAnalyticsQueue = (): Queue => {
  if (analyticsQueueInstance) {
    return analyticsQueueInstance;
  }

  if (!connection) {
    console.warn(
      "⚠️ Redis connection config missing. Analytics queue disabled.",
    );
    return {
      add: async () =>
        console.log("Mock Analytics Queue: Job added (Redis missing)"),
      close: async () => console.log("Mock Analytics Queue: Close called"),
    } as unknown as Queue;
  }

  console.log("🔌 Initializing Analytics Queue Redis connection...");
  analyticsQueueInstance = new Queue("colony-analytics", { connection });
  return analyticsQueueInstance;
};

// 🔗 QUEUE 3: Blockchain Sync (KryptoTrac - Future)
export const getBlockchainQueue = (): Queue => {
  if (blockchainQueueInstance) {
    return blockchainQueueInstance;
  }

  if (!connection) {
    console.warn(
      "⚠️ Redis connection config missing. Blockchain queue disabled.",
    );
    return {
      add: async () =>
        console.log("Mock Blockchain Queue: Job added (Redis missing)"),
      close: async () => console.log("Mock Blockchain Queue: Close called"),
    } as unknown as Queue;
  }

  console.log("🔌 Initializing Blockchain Queue Redis connection...");
  blockchainQueueInstance = new Queue("colony-blockchain", { connection });
  return blockchainQueueInstance;
};

// 🧠 QUEUE 4: Memory Miner (Low Priority, High Latency)
export const getMemoryQueue = (): Queue => {
  if (memoryQueueInstance) {
    return memoryQueueInstance;
  }

  if (!connection) {
    console.warn("⚠️ Redis connection config missing. Memory queue disabled.");
    return {
      add: async () =>
        console.log("Mock Memory Queue: Job added (Redis missing)"),
      close: async () => console.log("Mock Memory Queue: Close called"),
    } as unknown as Queue;
  }

  console.log("🔌 Initializing Memory Queue Redis connection...");
  memoryQueueInstance = new Queue("zyeute-memory-miner", { connection });
  return memoryQueueInstance;
};

// 🔒 QUEUE 5: Loi 25 Compliance (Privacy Auditor)
export const getPrivacyQueue = (): Queue => {
  if (privacyQueueInstance) {
    return privacyQueueInstance;
  }

  if (!connection) {
    console.warn("⚠️ Redis connection config missing. Privacy queue disabled.");
    return {
      add: async () => console.log("Mock Privacy Queue: Job added"),
      close: async () => console.log("Mock Privacy Queue: Close called"),
    } as unknown as Queue;
  }

  console.log("🔌 Initializing Privacy Queue Redis connection...");
  privacyQueueInstance = new Queue("zyeute-privacy-auditor", { connection });
  return privacyQueueInstance;
};

// Export type for TypeScript usage
export type VideoQueue = Queue;
