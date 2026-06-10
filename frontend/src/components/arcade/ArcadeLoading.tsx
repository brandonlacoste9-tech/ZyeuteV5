import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface ArcadeLoadingProps {
  icon: LucideIcon;
  label?: string;
}

export function ArcadeLoading({ icon: Icon, label }: ArcadeLoadingProps) {
  return (
    <div className="min-h-screen bg-black leather-overlay flex flex-col items-center justify-center gap-4 text-gold-400">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        className="w-14 h-14 rounded-2xl leather-card border border-gold-500/30 flex items-center justify-center gold-glow"
      >
        <Icon className="w-7 h-7" aria-hidden />
      </motion.div>
      {label && (
        <p className="text-sm text-leather-300 font-medium tracking-wide">
          {label}
        </p>
      )}
    </div>
  );
}
