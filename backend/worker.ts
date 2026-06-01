import { Worker, Job } from "bullmq";
import { VideoProcessingJob } from "./services/videoProcessor.js";
import { VideoOrchestrator } from "./services/videoOrchestrator.js";
import { hlsVideoWorker } from "./workers/hlsVideoProcessor.js";
import { MemoryMinerBee } from "./ai/bees/memory-miner.js";
import { PrivacyAuditorBee } from "./ai/bees/privacy-auditor.js";
import { HiveTask } from "./ai/types.js";
import { getBullMQConnection } from "./redis.js";
import {
  moderateText,
  moderateVideoFrame,
  saveModerationLog,
  autoRemoveContent,
} from "./services/contentModeration.js";

const QUOTA_MSG = "max requests limit exceeded";

/** Shut down a BullMQ worker cleanly when Upstash quota is exceeded */
function makeQuotaHandler(
  workerRef: { instance: Worker | null },
  name: string,
) {
  return (err: Error) => {
    if (err.message.includes(QUOTA_MSG)) {
      console.warn(
        `[${name}] 🚫 Redis quota exceeded — shutting down worker permanently`,
      );
      const w = workerRef.instance;
      if (w) {
        workerRef.instance = null;
        w.close().catch(() => {
          /* ignore */
        });
      }
      return;
    }
    console.error(`[${name}] Redis connection error:`, err.message);
  };
}

const connection = getBullMQConnection();

const videoWorkerRef: { instance: Worker<VideoProcessingJob> | null } = {
  instance: null,
};
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
  videoWorkerRef.instance = videoWorker;

  videoWorker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed!`);
  });

  videoWorker.on("failed", (job, err) => {
    console.log(`[Worker] Job ${job?.id} failed with ${err.message}`);
  });

  videoWorker.on(
    "error",
    makeQuotaHandler(videoWorkerRef as any, "VideoWorker"),
  );
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
const memoryWorkerRef: { instance: Worker | null } = { instance: null };
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
  memoryWorkerRef.instance = memoryWorker;

  memoryWorker.on("completed", (job) => {
    console.log(`[MemoryWorker] Job ${job.id} completed!`);
  });

  memoryWorker.on("failed", (job, err) => {
    console.log(`[MemoryWorker] Job ${job?.id} failed with ${err.message}`);
  });

  memoryWorker.on(
    "error",
    makeQuotaHandler(memoryWorkerRef as any, "MemoryWorker"),
  );
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
const privacyWorkerRef: { instance: Worker | null } = { instance: null };
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
  privacyWorkerRef.instance = privacyWorker;

  privacyWorker.on(
    "error",
    makeQuotaHandler(privacyWorkerRef as any, "PrivacyWorker"),
  );
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

// --- CONTENT MODERATION WORKER ---

export interface ModerationJob {
  contentType: "post" | "comment" | "message" | "bio";
  contentId: string;
  userId: string;
  text?: string;
  mediaUrl?: string;
  reporterId?: string;
  reportReason?: string;
}

const moderationWorkerRef: { instance: Worker<ModerationJob> | null } = {
  instance: null,
};
let moderationWorker: Worker<ModerationJob>;
try {
  if (!connection) {
    throw new Error("Redis connection not configured");
  }
  moderationWorker = new Worker<ModerationJob>(
    "zyeute-content-moderation",
    async (job) => {
      const {
        contentType,
        contentId,
        userId,
        text,
        mediaUrl,
        reporterId,
        reportReason,
      } = job.data;
      console.log(`[ModerationWorker] 🛡️ Checking ${contentType} ${contentId}`);

      // Run text and image moderation in parallel
      const [textResult, frameResult] = await Promise.all([
        text ? moderateText(text) : Promise.resolve(null),
        mediaUrl ? moderateVideoFrame(mediaUrl) : Promise.resolve(null),
      ]);

      // Combine results — take worst severity
      const severityOrder = [
        "safe",
        "low",
        "medium",
        "high",
        "critical",
      ] as const;
      const textSev = textResult?.severity || "safe";
      const frameSev = frameResult?.severity || "safe";
      const finalSeverity =
        severityOrder.indexOf(textSev) >= severityOrder.indexOf(frameSev)
          ? textResult!
          : frameResult || textResult!;

      // Skip saving if everything is safe and not a user report
      if (finalSeverity.severity === "safe" && !reporterId) {
        console.log(
          `[ModerationWorker] ✅ ${contentType} ${contentId} is safe`,
        );
        return { safe: true };
      }

      const logId = await saveModerationLog({
        contentType,
        contentId,
        userId,
        reporterId,
        result: finalSeverity,
        contentText: text?.substring(0, 500),
        reportReason,
      });

      // Auto-remove critical content immediately
      if (finalSeverity.action === "auto_remove") {
        await autoRemoveContent(
          contentType as "post" | "comment" | "message",
          contentId,
        );
        console.log(
          `[ModerationWorker] 🚨 Auto-removed ${contentType} ${contentId} (${finalSeverity.severity})`,
        );
      }

      return {
        safe: finalSeverity.severity === "safe",
        logId,
        severity: finalSeverity.severity,
      };
    },
    {
      connection,
      concurrency: 5,
      limiter: { max: 30, duration: 60000 },
    },
  );

  moderationWorkerRef.instance = moderationWorker;

  moderationWorker.on("completed", (job) => {
    console.log(`[ModerationWorker] ✅ Job ${job.id} done`);
  });
  moderationWorker.on("failed", (job, err) => {
    console.error(
      `[ModerationWorker] ❌ Job ${job?.id} failed: ${err.message}`,
    );
  });
  moderationWorker.on(
    "error",
    makeQuotaHandler(moderationWorkerRef as any, "ModerationWorker"),
  );
} catch (e: any) {
  if (e.message !== "Redis connection not configured") {
    console.error("Failed to initialize Moderation Worker:", e.message);
  } else {
    console.log("⚠️ [ModerationWorker] Disabled (no Redis)");
  }
  moderationWorker = {
    close: async () => {},
    on: () => {},
  } as unknown as Worker<ModerationJob>;
}

export { moderationWorker };
