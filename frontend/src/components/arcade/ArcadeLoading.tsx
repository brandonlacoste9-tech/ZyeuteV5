import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArcadeBackdrop } from "./ArcadeBackdrop";
import { arcadeTextMuted } from "./arcade-ui";

interface ArcadeLoadingProps {
  icon: LucideIcon;
  label?: string;
}

export function ArcadeLoading({ icon: Icon, label }: ArcadeLoadingProps) {
  return (
    <ArcadeBackdrop className="flex flex-col items-center justify-center gap-5 min-h-[60vh] py-16">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        className="arcade-icon-well arcade-text-cyan"
      >
        <Icon className="w-7 h-7" aria-hidden />
      </motion.div>
      {label && (
        <p
          className={`text-sm font-semibold tracking-widest uppercase ${arcadeTextMuted}`}
        >
          {label}
        </p>
      )}
      <p className="arcade-insert-coin">Loading…</p>
    </ArcadeBackdrop>
  );
}
