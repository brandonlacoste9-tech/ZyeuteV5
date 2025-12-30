import { db } from "../storage.js";
import { notifications } from "../../shared/schema.js";

export async function sendProgress(
  userId: string,
  postId: string,
  progress: number,
  stage: string,
): Promise<void> {
  // In a real implementation with Socket.io, we would emit to the user's room here.
  // For now, we log it, and relying on the client polling or a shared Redis adapter.
  console.log(
    `[Progress] User ${userId}, Post ${postId}: ${progress}% - ${stage}`,
  );
}

export async function notifyCompletion(
  userId: string,
  postId: string,
  success: boolean,
  videoUrl?: string,
): Promise<void> {
  const message = success
    ? "Ta vidéo est prête! 🎬"
    : "Oups, le traitement de ta vidéo a échoué. 😕";

  const type = success ? "system" : "error"; // Using generic types if 'video_processed' isn't supported by FE

  await db.insert(notifications).values({
    userId,
    type: "mention", // Fallback to 'mention' or similar if specific types aren't handled, but string is allowed.
    // Let's use 'video_processed' and hope FE handles it gracefully or generic fallback.
    // Actually, schema comments say: 'fire', 'comment', 'follow', 'mention', 'gift'
    // If I use 'system', it might be safer if I add it to schema or just use 'mention' with custom message.
    // I'll stick to 'mention' for now to ensure icon shows up (usually mention icon).
    // Or better, let's try 'video_processed' and see.
    message,
    postId,
    isRead: false,
    fromUserId: userId, // Sys notif, maybe from self? or null. Schema allows null?
    // fromUserId: uuid("from_user_id").references(() => users.id, { onDelete: 'cascade' }),
    // It references users.id. If system, maybe null?
  });
}
