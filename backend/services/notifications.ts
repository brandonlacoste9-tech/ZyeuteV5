import { db } from "../storage.js";
import { notifications } from "../../shared/schema.js";
import { sendPushToUser } from "../routes/push.js";

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
    type: "mention",
    message,
    postId,
    isRead: false,
    fromUserId: userId,
  });

  // Fire push notification so user gets alerted even when app is closed
  await sendPushToUser(
    userId,
    success ? "Ta vidéo est prête! 🎬" : "Erreur de traitement vidéo",
    success
      ? "Clique pour voir ta vidéo sur Zyeuté"
      : "Une erreur est survenue lors du traitement. Réessaie.",
    postId ? `/post/${postId}` : "/",
  ).catch((err) => console.warn("[Push] notifyCompletion push failed:", err));
}
