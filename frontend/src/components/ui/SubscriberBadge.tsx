/**
 * SubscriberBadge — shows Bronze / Argent / Or badge inline beside a username.
 * Pass the tier string from the user's profile or subscription status.
 */

import React from "react";
import { cn } from "../../lib/utils";

export type BadgeTier = "bronze" | "argent" | "or" | "free" | null | undefined;

interface SubscriberBadgeProps {
  tier: BadgeTier;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const BADGE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; glow?: string }
> = {
  bronze: {
    label: "Bronze",
    bg: "bg-[#CD7F32]/20",
    text: "text-[#CD7F32]",
    border: "border-[#CD7F32]/50",
  },
  argent: {
    label: "Argent",
    bg: "bg-slate-400/20",
    text: "text-slate-300",
    border: "border-slate-400/50",
  },
  or: {
    label: "Or",
    bg: "bg-yellow-400/20",
    text: "text-yellow-300",
    border: "border-yellow-400/60",
    glow: "shadow-[0_0_8px_rgba(255,215,0,0.35)]",
  },
};

const SIZE_CLASSES = {
  xs: "text-[9px] px-1 py-0 leading-4",
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
};

export function SubscriberBadge({
  tier,
  size = "xs",
  className,
}: SubscriberBadgeProps) {
  if (!tier || tier === "free") return null;
  const cfg = BADGE_CONFIG[tier];
  if (!cfg) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-bold border tracking-wide uppercase",
        cfg.bg,
        cfg.text,
        cfg.border,
        cfg.glow,
        SIZE_CLASSES[size],
        className,
      )}
    >
      {cfg.label}
    </span>
  );
}

export default SubscriberBadge;
