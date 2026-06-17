/**
 * FeedStateView — polished empty, error, and fallback states for the video feed.
 */

import React from "react";
import { Link } from "react-router-dom";
import { RefreshCw, WifiOff, Users, Upload, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedPostSkeleton } from "@/components/ui/Skeleton";

export type FeedStateVariant =
  | "loading"
  | "empty"
  | "error"
  | "offline"
  | "abonnements-empty"
  | "abonnements-fallback";

interface FeedStateViewProps {
  variant: FeedStateVariant;
  className?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

const COPY: Record<
  Exclude<FeedStateVariant, "loading">,
  { title: string; body: string; emoji: string }
> = {
  empty: {
    emoji: "⚜️",
    title: "Le fil t'attend",
    body: "Aucune vidéo pour l'instant. Reviens bientôt ou sois le premier à partager un moment québécois.",
  },
  error: {
    emoji: "📡",
    title: "Impossible de charger le fil",
    body: "On n'a pas réussi à joindre le serveur. Vérifie ta connexion et réessaie.",
  },
  offline: {
    emoji: "📴",
    title: "Tu es hors ligne",
    body: "Reconnecte-toi pour découvrir les dernières vidéos du Québec.",
  },
  "abonnements-empty": {
    emoji: "👥",
    title: "Aucun abonnement encore",
    body: "Suis des créateurs pour voir leurs vidéos ici. En attendant, explore la découverte.",
  },
  "abonnements-fallback": {
    emoji: "✨",
    title: "Suggestions pour toi",
    body: "Tu ne suis personne encore — voici des vidéos populaires en attendant.",
  },
};

export const FeedStateView: React.FC<FeedStateViewProps> = ({
  variant,
  className,
  onRetry,
  isRetrying = false,
}) => {
  if (variant === "loading") {
    return (
      <div className={cn("w-full h-full bg-black", className)}>
        <FeedPostSkeleton />
        <p className="absolute bottom-8 left-0 right-0 text-center text-xs text-white/40 animate-pulse">
          Chargement du fil...
        </p>
      </div>
    );
  }

  const copy = COPY[variant];

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-8 text-center relative overflow-hidden",
        className,
      )}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.15) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-sm mx-auto">
        <div className="text-5xl mb-5">{copy.emoji}</div>
        <h2
          className="text-xl font-bold mb-2"
          style={{
            background:
              "linear-gradient(135deg, #FFD700 0%, #C9A227 50%, #FFE566 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {copy.title}
        </h2>
        <p className="text-white/55 text-sm mb-8 leading-relaxed">
          {copy.body}
        </p>

        <div className="flex flex-col gap-3 items-center">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#D4AF37] text-black font-bold rounded-full hover:bg-[#C5A028] transition-all active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.35)] disabled:opacity-60"
            >
              <RefreshCw
                className={cn("w-4 h-4", isRetrying && "animate-spin")}
              />
              {isRetrying ? "Chargement..." : "Réessayer"}
            </button>
          )}

          {variant === "error" && (
            <p className="text-xs text-white/30 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Erreur réseau ou serveur indisponible
            </p>
          )}

          {variant === "offline" && (
            <p className="text-xs text-amber-500/80 flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5" />
              Tes actions seront synchronisées à la reconnexion
            </p>
          )}

          {(variant === "empty" || variant === "abonnements-empty") && (
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#D4AF37]/40 text-[#D4AF37] text-sm font-semibold hover:bg-[#D4AF37]/10 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Publier une vidéo
            </Link>
          )}

          {variant === "abonnements-empty" && (
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <Users className="w-4 h-4" />
              Découvrir des créateurs
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

/** Slim banner when Abonnements falls back to explore suggestions. */
export const FeedFallbackBanner: React.FC<{ onDismiss?: () => void }> = ({
  onDismiss,
}) => (
  <div className="absolute top-0 left-0 right-0 z-40 px-4 pt-3 pointer-events-auto">
    <div className="mx-auto max-w-md flex items-center justify-between gap-3 rounded-xl bg-black/80 backdrop-blur-md border border-[#D4AF37]/25 px-4 py-2.5 shadow-lg">
      <p className="text-xs text-white/80 text-left leading-snug">
        <span className="text-[#D4AF37] font-semibold">Suggestions</span> — suis
        des créateurs pour remplir ton fil d&apos;abonnements.
      </p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-white/40 hover:text-white/70 text-lg leading-none px-1"
          aria-label="Fermer"
        >
          ×
        </button>
      )}
    </div>
  </div>
);
