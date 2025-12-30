import { Queue } from "bullmq";

// Lazy Singleton Pattern - Queues are only created when actually used
let videoQueueInstance: Queue | null = null;
let analyticsQueueInstance: Queue | null = null;
let blockchainQueueInstance: Queue | null = null;
let memoryQueueInstance: Queue | null = null;
let privacyQueueInstance: Queue | null = null;

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
  tls: process.env.REDIS_TLS === "true" ? {} : undefined, // Essential for managed Redis (Upstash/Railway)
};

// 🚨 QUEUE 1: Video Enhancement (High Priority)
export const getVideoQueue = (): Queue => {
  // 1. If we already have a queue, return it (Warm container)
  if (videoQueueInstance) {
    return videoQueueInstance;
  }

  // 2. Safety Check: Do we even have Redis credentials?
  if (!process.env.REDIS_HOST) {
    console.warn("⚠️ REDIS_HOST not defined. Video queue disabled.");
    // Return a mock object so the app doesn't crash if Redis is missing
    return {
      add: async () =>
        console.log("Mock Video Queue: Job added (Redis missing)"),
      close: async () => console.log("Mock Video Queue: Close called"),
    } as unknown as Queue;
  }

  // 3. Connect (Only happens once per container)
  console.log("🔌 Initializing Video Queue Redis connection...");
  videoQueueInstance = new Queue("zyeute-video-enhance", {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
    },
  });

  return videoQueueInstance;
};

// 📊 QUEUE 2: Analytics (Low Priority)
export const getAnalyticsQueue = (): Queue => {
  if (analyticsQueueInstance) {
    return analyticsQueueInstance;
  }

  if (!process.env.REDIS_HOST) {
    console.warn("⚠️ REDIS_HOST not defined. Analytics queue disabled.");
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

  if (!process.env.REDIS_HOST) {
    console.warn("⚠️ REDIS_HOST not defined. Blockchain queue disabled.");
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

  if (!process.env.REDIS_HOST) {
    console.warn("⚠️ REDIS_HOST not defined. Memory queue disabled.");
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

  if (!process.env.REDIS_HOST) {
    console.warn("⚠️ REDIS_HOST not defined. Privacy queue disabled.");
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
