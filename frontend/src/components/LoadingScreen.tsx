/**
 * LoadingScreen — same look as the feed boot splash:
 * leather-dark + gold star dust + AG ring spinner.
 */

import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Chargement...",
  className,
}) => {
  const [showFailsafe, setShowFailsafe] = useState(false);

  const stars = React.useMemo(() => {
    return [...Array(28)].map((_, i) => ({
      key: i,
      left: `${(i * 17 + 11) % 100}%`,
      top: `${(i * 23 + 5) % 100}%`,
      size: i % 4 === 0 ? 2.5 : 1.5,
      delay: `${(i * 0.14) % 3}s`,
      duration: `${2 + (i % 3)}s`,
      opacity: 0.12 + (i % 5) * 0.06,
    }));
  }, []);

  useEffect(() => {
    const failsafe = setTimeout(() => setShowFailsafe(true), 8000);
    return () => clearTimeout(failsafe);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] leather-dark flex flex-col overflow-hidden items-center justify-center",
        className,
      )}
    >
      {/* Gold star dust */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        {stars.map((s) => (
          <div
            key={s.key}
            className="absolute rounded-full bg-gold-400 animate-pulse"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animationDelay: s.delay,
              animationDuration: s.duration,
              boxShadow: "0 0 4px rgba(212,175,55,0.55)",
            }}
          />
        ))}
      </div>

      <div
        className="absolute w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.03) 40%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10">
        <div className="absolute inset-0 -m-6 rounded-full bg-gold-500/10 blur-2xl animate-pulse" />

        <div className="relative text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-gold-900/40 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-gold-500 rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
            <div
              className="absolute inset-4 border-2 border-transparent border-b-gold-200/50 rounded-full rotate-45"
              style={{ animation: "spin 2.8s linear infinite" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gold-400 font-black text-xl tracking-tighter drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]">
                AG
              </span>
            </div>
          </div>

          <h2 className="text-gold-400 font-black text-2xl tracking-tight mb-2 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            Zyeute
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold-300 animate-bounce" />
          </div>
          <p className="mt-4 text-gold-200/60 text-[0.7rem] uppercase tracking-[0.3em] font-medium">
            {message}
          </p>

          {showFailsafe && (
            <button
              type="button"
              onClick={() => {
                window.location.href = "/feed?force=1";
              }}
              className="mt-12 px-6 py-2 rounded-full border border-gold-500/30 text-gold-500/80 text-[10px] uppercase tracking-widest hover:bg-gold-500/10 transition-all"
            >
              Accès Manuel Direct
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
