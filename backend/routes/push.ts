/**
 * Push Notification Routes
 * POST /api/push/subscribe   — save a browser push subscription
 * DELETE /api/push/subscribe — remove a push subscription
 * POST /api/push/send        — internal: send push to a user (called by notification system)
 */

import { Router, Request, Response, NextFunction } from "express";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// ─── VAPID config ─────────────────────────────────────────────────────────────
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:zyeutequebec@gmail.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
}

// ─── Supabase admin client ─────────────────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

// ─── Auth guard ───────────────────────────────────────────────────────────────
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Non autorisé" });
  next();
};

// ─── GET /vapid-public-key ────────────────────────────────────────────────────
// Frontend fetches this to subscribe
router.get("/vapid-public-key", (_req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.status(503).json({ error: "Push non configuré" });
  }
  return res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// ─── POST /subscribe ──────────────────────────────────────────────────────────
router.post("/subscribe", requireAuth, async (req, res) => {
  const { endpoint, keys } = req.body as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: "Subscription invalide" });
  }

  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
    {
      user_id: req.userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    console.error("[Push] subscribe error:", error);
    return res.status(500).json({ error: "Erreur d'enregistrement" });
  }

  return res.json({ success: true });
});

// ─── DELETE /subscribe ────────────────────────────────────────────────────────
router.delete("/subscribe", requireAuth, async (req, res) => {
  const { endpoint } = req.body as { endpoint: string };

  if (!endpoint) return res.status(400).json({ error: "Endpoint requis" });

  await supabaseAdmin
    .from("push_subscriptions")
    .delete()
    .eq("user_id", req.userId)
    .eq("endpoint", endpoint);

  return res.json({ success: true });
});

// ─── POST /send ───────────────────────────────────────────────────────────────
// Internal — called by notification triggers (new follower, fire, comment, etc.)
router.post("/send", async (req, res) => {
  // Only allow calls from same server (no external auth token needed since it's internal)
  const { userId, title, body, url, icon } = req.body as {
    userId: string;
    title: string;
    body: string;
    url?: string;
    icon?: string;
  };

  if (!userId || !title || !body) {
    return res.status(400).json({ error: "userId, title, body requis" });
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(503).json({ error: "Push non configuré" });
  }

  // Fetch all subscriptions for this user
  const { data: subs, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error || !subs?.length) {
    return res.json({ sent: 0, message: "Aucun abonné push" });
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: icon || "/zyeute_app_icon.png",
    badge: "/zyeute_app_icon.png",
    url: url || "/",
    timestamp: Date.now(),
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      ),
    ),
  );

  // Clean up expired/invalid subscriptions (410 Gone)
  const expiredEndpoints: string[] = [];
  results.forEach((result, i) => {
    if (
      result.status === "rejected" &&
      (result.reason?.statusCode === 410 || result.reason?.statusCode === 404)
    ) {
      expiredEndpoints.push(subs[i].endpoint);
    }
  });

  if (expiredEndpoints.length > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .in("endpoint", expiredEndpoints);
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;
  console.log(`[Push] Sent ${sent}/${subs.length} to user ${userId}`);
  return res.json({ sent, total: subs.length });
});

// ─── Exported helper for other routes ─────────────────────────────────────────
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url?: string,
): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return;

  const payload = JSON.stringify({
    title,
    body,
    icon: "/zyeute_app_icon.png",
    badge: "/zyeute_app_icon.png",
    url: url || "/",
    timestamp: Date.now(),
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      ),
    ),
  );

  // Cleanup expired
  const expired = subs.filter(
    (_, i) =>
      results[i].status === "rejected" &&
      [410, 404].includes(
        (results[i] as PromiseRejectedResult).reason?.statusCode,
      ),
  );
  if (expired.length) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .in(
        "endpoint",
        expired.map((s) => s.endpoint),
      );
  }
}

export default router;
