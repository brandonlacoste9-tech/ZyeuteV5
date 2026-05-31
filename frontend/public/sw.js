/**
 * Zyeuté Service Worker
 * Handles background push notifications
 */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ─── Push event ───────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Zyeuté", body: event.data.text() };
  }

  const { title = "Zyeuté", body = "", icon, badge, url = "/" } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || "/zyeute_app_icon.png",
      badge: badge || "/zyeute_app_icon.png",
      data: { url },
      vibrate: [100, 50, 100],
      requireInteraction: false,
    }),
  );
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus existing tab if open
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
