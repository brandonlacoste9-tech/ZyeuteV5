import React, { useEffect, useState } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export const OfflineIndicator: React.FC = () => {
  const isOnline = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  // Show "Reconnected" briefly when coming back online
  useEffect(() => {
    if (isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline && !showReconnected) return null;

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none"
        >
          <div className="bg-neutral-900/90 backdrop-blur-md border border-red-500/50 text-white text-xs font-medium px-4 py-2 mt-safe rounded-full shadow-lg flex items-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Mode hors ligne</span>
          </div>
        </motion.div>
      )}

      {isOnline && showReconnected && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none"
        >
          <div className="bg-neutral-900/90 backdrop-blur-md border border-green-500/50 text-white text-xs font-medium px-4 py-2 mt-safe rounded-full shadow-lg flex items-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Connexion rétablie</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
