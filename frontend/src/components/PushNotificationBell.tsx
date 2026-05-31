/**
 * PushNotificationBell
 * Bell icon that lets users enable/disable browser push notifications.
 * Drop this anywhere — header, settings page, etc.
 */

import React, { useState } from "react";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { toast } from "./Toast";

interface Props {
  className?: string;
  showLabel?: boolean;
}

export const PushNotificationBell: React.FC<Props> = ({
  className = "",
  showLabel = false,
}) => {
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();
  const [animating, setAnimating] = useState(false);

  if (permission === "unsupported") return null;

  const handleToggle = async () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);

    if (isSubscribed) {
      const ok = await unsubscribe();
      if (ok) toast.info("Notifications désactivées");
      else toast.error("Erreur lors de la désactivation");
    } else {
      if (permission === "denied") {
        toast.error(
          "Notifications bloquées. Active-les dans les paramètres de ton navigateur.",
        );
        return;
      }
      const ok = await subscribe();
      if (ok) toast.success("🔔 Notifications activées!");
      else if (permission !== "granted") toast.info("Permission refusée");
    }
  };

  const isActive = isSubscribed && permission === "granted";

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      title={
        isActive ? "Désactiver les notifications" : "Activer les notifications"
      }
      className={`relative inline-flex items-center gap-2 transition-all ${className}`}
    >
      {/* Bell icon */}
      <span
        className={`text-2xl transition-transform ${
          animating ? "animate-bounce" : ""
        } ${isActive ? "text-gold-400" : "text-white/50"}`}
      >
        {isLoading ? "⏳" : isActive ? "🔔" : "🔕"}
      </span>

      {/* Active dot */}
      {isActive && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-black" />
      )}

      {showLabel && (
        <span className="text-sm text-white/70">
          {isActive ? "Notifications activées" : "Activer les notifications"}
        </span>
      )}
    </button>
  );
};

export default PushNotificationBell;
