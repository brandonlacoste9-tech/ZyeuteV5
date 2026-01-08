import { Queue } from "bullmq";

// Lazy Singleton Pattern - Queues are only created when actually used
let videoQueueInstance: Queue | null = null;
let imageQueueInstance: Queue | null = null;
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
      add: async (name: string, data: any) => {
        console.log("Mock Video Queue: Job added (Redis missing)", name);
        // Return a mock job object
        return {
          id: "mock-" + Date.now(),
          name,
          data,
          getState: async () => "completed", // Auto-complete
          progress: 100,
          finishedOn: Date.now(),
          processedOn: Date.now(),
          attemptsMade: 1,
          failedReason: null,
          isCompleted: async () => true,
        };
      },
      getJob: async (jobId: string) => {
        // Return a completed mock job
        return {
          id: jobId,
          getState: async () => "completed",
          progress: 100,
          finishedOn: Date.now(),
          processedOn: Date.now(),
          attemptsMade: 1,
          failedReason: null,
          data: { mocked: true },
        };
      },
      close: async () => console.log("Mock Video Queue: Close called"),
    } as unknown as Queue;
  }

  // 3. Connect (Only happens once per container)
  console.log("🔌 Initializing Video Queue Redis connection...");
  videoQueueInstance = new Queue("zyeute-video-enhance", {
    connection,
    defaultJobOptions: {
      attempts: 3, // Retry up to 3 times on failure
      backoff: {
        type: "exponential",
        delay: 5000, // Start with 5s delay, then 10s, then 20s
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour for debugging
        count: 100, // Keep last 100 completed jobs
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours for analysis
      },
    },
  });

  return videoQueueInstance;
};

// 🖼️ QUEUE 2: Image Enhancement (High Priority)
export const getImageQueue = (): Queue => {
  // 1. If we already have a queue, return it (Warm container)
  if (imageQueueInstance) {
    return imageQueueInstance;
  }

  // 2. Safety Check: Do we even have Redis credentials?
  if (!process.env.REDIS_HOST) {
    console.warn("⚠️ REDIS_HOST not defined. Image queue disabled.");
    // Return a mock object so the app doesn't crash if Redis is missing
    return {
      add: async (name: string, data: any) => {
        console.log("Mock Image Queue: Job added (Redis missing)", name);
        // Return a mock job object
        return {
          id: "mock-" + Date.now(),
          name,
          data,
          getState: async () => "completed", // Auto-complete
          progress: 100,
          finishedOn: Date.now(),
          processedOn: Date.now(),
          attemptsMade: 1,
          failedReason: null,
          isCompleted: async () => true,
        };
      },
      getJob: async (jobId: string) => {
        // Return a completed mock job
        return {
          id: jobId,
          getState: async () => "completed",
          progress: 100,
          finishedOn: Date.now(),
          processedOn: Date.now(),
          attemptsMade: 1,
          failedReason: null,
          data: { mocked: true },
        };
      },
      close: async () => console.log("Mock Image Queue: Close called"),
    } as unknown as Queue;
  }

  // 3. Connect (Only happens once per container)
  console.log("🔌 Initializing Image Queue Redis connection...");
  imageQueueInstance = new Queue("zyeute-image-enhance", {
    connection,
    defaultJobOptions: {
      attempts: 3, // Retry up to 3 times on failure
      backoff: {
        type: "exponential",
        delay: 5000, // Start with 5s delay, then 10s, then 20s
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour for debugging
        count: 100, // Keep last 100 completed jobs
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours for analysis
      },
    },
  });

  return imageQueueInstance;
};

// 📊 QUEUE 3: Analytics (Low Priority)
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

// 🧠 QUEUE 5: Memory Miner (Low Priority, High Latency)
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

// Export types for TypeScript usage
export type VideoQueue = Queue;
export type ImageQueue = Queue;
