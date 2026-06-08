import { type ReactNode } from "react";
import { useHaptics } from "@/hooks/useHaptics";

export type SheetActionVariant = "neutral" | "report" | "danger" | "moderation";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: SheetActionVariant;
  icon?: ReactNode;
  /** Center the label (used for emphasised destructive/mod actions). */
  center?: boolean;
};

const VARIANT_CLASS: Record<SheetActionVariant, string> = {
  neutral:
    "bg-white/5 text-white border-white/10 hover:border-gold-500/40 hover:bg-white/[0.07]",
  report:
    "bg-white/5 text-white border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5",
  danger:
    "bg-red-950/50 text-red-200 border-red-500/30 font-semibold hover:border-red-500/60",
  moderation:
    "bg-orange-950/80 text-orange-200 border-orange-500/50 font-semibold hover:border-orange-400/70",
};

/**
 * Uniform Voyageur action row for bottom sheets — consistent height, radius,
 * press feedback and haptics with semantic accent borders per action type.
 */
export function SheetActionRow({
  children,
  onClick,
  disabled,
  variant = "neutral",
  icon,
  center,
}: Props) {
  const { impact } = useHaptics();

  const handleClick = () => {
    if (disabled) return;
    impact();
    onClick?.();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 active:scale-[0.98] disabled:opacity-50 ${
        center ? "justify-center text-center" : "text-left"
      } ${VARIANT_CLASS[variant]}`}
    >
      {icon ? <span className="flex-shrink-0">{icon}</span> : null}
      <span className={center ? "" : "flex-1"}>{children}</span>
    </button>
  );
}
