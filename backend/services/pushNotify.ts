/**
 * Push Notification Helper
 * Sends web push notifications to users for key events
 */
import webpush from "web-push";
import { supabaseAdmin } from "../supabase-auth.js";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:zyeutequebec@gmail.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!supabaseAdmin || !VAPID_PUBLIC_KEY) return;

  try {
    const { data: subscriptions } = await supabaseAdmin
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId);

    if (!subscriptions || subscriptions.length === 0) return;

    const notification = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      url: payload.url || "/feed",
      tag: payload.tag || "zyeute-notification",
    });

    await Promise.allSettled(
      subscriptions.map(({ subscription }) =>
        webpush
          .sendNotification(subscription, notification)
          .catch((err: any) => {
            // Remove expired/invalid subscriptions
            if (err.statusCode === 410 || err.statusCode === 404) {
              supabaseAdmin!
                .from("push_subscriptions")
                .delete()
                .eq("user_id", userId)
                .then(() => {});
            }
          }),
      ),
    );
  } catch (err: any) {
    console.error("[PushNotify] Error:", err.message);
  }
}

export async function notifyNewFollower(
  followedUserId: string,
  followerUsername: string,
): Promise<void> {
  await sendPushToUser(followedUserId, {
    title: "Nouveau abonné! 🎉",
    body: `@${followerUsername} te suit maintenant sur Zyeute`,
    url: `/profile/${followerUsername}`,
    tag: "new-follower",
  });
}

export async function notifyNewComment(
  postAuthorId: string,
  commenterUsername: string,
  postId: string,
): Promise<void> {
  await sendPushToUser(postAuthorId, {
    title: "Nouveau commentaire 💬",
    body: `@${commenterUsername} a commenté sur ta vidéo`,
    url: `/p/${postId}`,
    tag: "new-comment",
  });
}

export async function notifyNewGift(
  recipientId: string,
  senderUsername: string,
  giftName: string,
  amount: number,
): Promise<void> {
  await sendPushToUser(recipientId, {
    title: `Cadeau reçu! 🎁`,
    body: `@${senderUsername} t'a envoyé ${amount} cenné (${giftName})`,
    url: "/wallet",
    tag: "new-gift",
  });
}

export async function notifyNewLike(
  postAuthorId: string,
  likerUsername: string,
  postId: string,
): Promise<void> {
  await sendPushToUser(postAuthorId, {
    title: "Nouvelle réaction ❤️",
    body: `@${likerUsername} a aimé ta vidéo`,
    url: `/p/${postId}`,
    tag: "new-like",
  });
}
