import React, { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface ArcadeShellProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  backTo?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  maxWidth?: "md" | "lg" | "6xl";
}

export function ArcadeShell({
  title,
  subtitle,
  icon,
  backTo = "/arcade",
  headerRight,
  children,
  maxWidth = "md",
}: ArcadeShellProps) {
  const navigate = useNavigate();
  const widthClass =
    maxWidth === "6xl"
      ? "max-w-6xl"
      : maxWidth === "lg"
        ? "max-w-lg"
        : "max-w-md";

  return (
    <div className="min-h-screen bg-black leather-overlay text-white pb-24">
      <header className="sticky top-0 z-30 border-b border-gold-500/20 bg-black/85 backdrop-blur-md">
        <div
          className={`${widthClass} mx-auto px-4 py-3 flex items-center gap-3`}
        >
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="p-2.5 min-w-[44px] min-h-[44px] rounded-xl border border-leather-700 text-gold-400 hover:border-gold-500/50 hover:bg-gold-500/5 transition-colors duration-200 cursor-pointer"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-lg text-gold-400 flex items-center gap-2 truncate">
              {icon}
              <span className="truncate">{title}</span>
            </h1>
            {subtitle && (
              <p className="text-xs text-leather-300 truncate">{subtitle}</p>
            )}
          </div>
          {headerRight}
        </div>
      </header>
      <main className={`${widthClass} mx-auto px-4 pt-6`}>{children}</main>
    </div>
  );
}
