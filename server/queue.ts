import { Queue } from 'bullmq';

// Connection to Redis (Railway/Upstash)
const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

// 🎥 QUEUE 1: Video Enhancement (High Priority)
// This queue handles the AI Upscaling (Real-ESRGAN)
export const videoQueue = new Queue('zyeute-video-enhance', {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry 3 times if AI fails
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5s, then 10s, then 20s
    },
    removeOnComplete: true, // Keep DB clean
  },
});

// 📉 QUEUE 2: Analytics (Low Priority)
export const analyticsQueue = new Queue('colony-analytics', { connection });

// 🔗 QUEUE 3: Blockchain Sync (KryptoTrac - Future)
export const blockchainQueue = new Queue('colony-blockchain', { connection });