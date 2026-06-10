import React, { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ArcadeBackdrop } from "./ArcadeBackdrop";
import { arcadeBackBtn, arcadeTextCyan, arcadeTextMuted } from "./arcade-ui";

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
    <ArcadeBackdrop className="pb-24">
      <header className="sticky top-0 z-30 border-b-2 border-[rgba(0,243,255,0.25)] bg-[rgba(7,6,15,0.92)] backdrop-blur-sm">
        <div
          className={`${widthClass} mx-auto px-4 py-3 flex items-center gap-3`}
        >
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className={arcadeBackBtn}
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1
              className={`font-bold text-sm sm:text-base ${arcadeTextCyan} flex items-center gap-2 truncate uppercase tracking-wider`}
            >
              {icon}
              <span className="truncate">{title}</span>
            </h1>
            {subtitle && (
              <p className={`text-xs ${arcadeTextMuted} truncate`}>
                {subtitle}
              </p>
            )}
          </div>
          {headerRight}
        </div>
      </header>
      <main className={`${widthClass} mx-auto px-4 pt-6`}>{children}</main>
    </ArcadeBackdrop>
  );
}
