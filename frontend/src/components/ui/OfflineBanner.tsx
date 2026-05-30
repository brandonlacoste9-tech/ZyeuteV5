/**
 * OfflineBanner - Shows when user is offline
 * Zyeuté V5 - Network resilience
 */

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    // Try to reload the page or fetch new data
    window.location.reload();
  };

  if (isOnline) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100]",
        "bg-amber-500/95 backdrop-blur-sm",
        "border-b border-amber-400",
        "px-4 py-3",
        "flex items-center justify-between",
        "animate-in slide-in-from-top"
      )}
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-5 h-5 text-black" />
        <span className="text-black font-medium text-sm">
          Hors ligne - Certaines vidéos peuvent ne pas charger
        </span>
      </div>
      <button
        onClick={handleRetry}
        disabled={isRetrying}
        className={cn(
          "flex items-center gap-1.5",
          "px-3 py-1.5",
          "bg-black/20 hover:bg-black/30",
          "rounded-full",
          "text-black text-xs font-semibold",
          "transition-colors",
          "disabled:opacity-50"
        )}
      >
        <RefreshCw className={cn("w-3.5 h-3.5", isRetrying && "animate-spin")} />
        {isRetrying ? "Reconnexion..." : "Réessayer"}
      </button>
    </div>
  );
};

export default OfflineBanner;
