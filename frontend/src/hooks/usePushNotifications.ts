/**
 * usePushNotifications
 * Handles browser push notification subscription lifecycle
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiCall } from "../services/api";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check current state on mount
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermission);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, []);

  // Register service worker once on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("[Push] SW registration failed:", err));
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user || !("serviceWorker" in navigator)) return false;

    setIsLoading(true);
    try {
      // Get VAPID public key from backend
      const { data: vapidData } = await apiCall<{ publicKey: string }>(
        "/push/vapid-public-key",
      );
      if (!vapidData?.publicKey) {
        console.warn("[Push] No VAPID key from backend");
        return false;
      }

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== "granted") return false;

      // Subscribe via PushManager
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });

      const subJson = sub.toJSON();

      // Save to backend
      const { error } = await apiCall("/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      if (!error) {
        setIsSubscribed(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error("[Push] Subscribe error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return true;

      await apiCall("/push/subscribe", {
        method: "DELETE",
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });

      await sub.unsubscribe();
      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error("[Push] Unsubscribe error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default usePushNotifications;
