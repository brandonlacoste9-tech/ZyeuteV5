import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Coins } from "lucide-react";
import { ArcadeBackdrop } from "@/components/arcade/ArcadeBackdrop";
import {
  arcadeBtnPrimary,
  arcadeTextCyan,
  arcadeTextYellow,
} from "@/components/arcade/arcade-ui";
import { useAuth } from "@/contexts/AuthContext";

export default function ArcadePlayer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [claimed, setClaimed] = useState(false);
  const [playtime, setPlaytime] = useState(() => {
    return parseInt(localStorage.getItem("zyeute_arcade_playtime") || "0", 10);
  });

  const isPremium = user && (user as any).subscription_tier && (user as any).subscription_tier !== "gratuit";
  const TRIAL_LIMIT = 3600; // 1 hour in seconds
  const isPaywalled = !isPremium && playtime >= TRIAL_LIMIT;

  React.useEffect(() => {
    if (isPaywalled || isPremium) return;

    const timer = setInterval(() => {
      setPlaytime((prev) => {
        const newTime = prev + 1;
        localStorage.setItem("zyeute_arcade_playtime", newTime.toString());
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaywalled, isPremium]);

  let url = searchParams.get("url");
  const title = searchParams.get("title") || "Arcade Game";

  if (!url) {
    return (
      <ArcadeBackdrop className="flex items-center justify-center">
        <div className="text-center p-8 bg-black/50 border-2 border-red-500 rounded">
          <h2 className="text-xl font-bold text-red-500 mb-4">Erreur</h2>
          <p className="text-white mb-6">L'URL du jeu est manquante.</p>
          <button onClick={() => navigate("/arcade")} className={arcadeBtnPrimary}>
            Retour à l'Arcade
          </button>
        </div>
      </ArcadeBackdrop>
    );
  }

  // Detect if this is a GameDistribution game that needs to be wrapped.
  // GameDistribution links usually start with https://html5.gamedistribution.com/
  // The documentation explicitly says to wrap it in the responsive embed player.
  if (url.includes("gamedistribution.com")) {
    const currentHost = typeof window !== "undefined" ? window.location.href : "https://zyeute.com";
    url = `https://embed.gamedistribution.com/?url=${encodeURIComponent(
      url
    )}&width=100%25&height=100%25&language=fr&gdpr-tracking=1&gdpr-targeting=1&gd_sdk_referrer_url=${encodeURIComponent(
      currentHost
    )}`;
  }

  const handleClaim = () => {
    setClaimed(true);
    // In a real implementation, we would call an API here to credit the user
    // e.g., await apiCall("/arcade/claim", { method: "POST" });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between p-4 bg-[#1a0f2e] border-b-2 border-cyan-500/30 z-10 shadow-[0_4px_20px_rgba(6,182,212,0.15)] shrink-0">
        <button
          type="button"
          onClick={() => navigate("/arcade")}
          className={`flex items-center gap-2 text-sm font-bold ${arcadeTextCyan} hover:opacity-80 transition-opacity`}
        >
          <ArrowLeft className="w-5 h-5" />
          Quitter
        </button>

        <h1 className="arcade-font-pixel text-white text-xs sm:text-sm tracking-widest text-center truncate px-4 max-w-md">
          {title.toUpperCase()}
        </h1>

        <button
          type="button"
          onClick={handleClaim}
          disabled={claimed}
          className={`flex items-center gap-2 text-xs sm:text-sm font-bold px-3 py-1.5 rounded border-2 transition-all ${
            claimed
              ? "border-gray-600 text-gray-500 cursor-not-allowed bg-black/40"
              : `border-yellow-500 ${arcadeTextYellow} hover:bg-yellow-500/10 hover:scale-105 active:scale-95`
          }`}
        >
          <Coins className="w-4 h-4" />
          {claimed ? "Jetons Réclamés" : "Réclamer 10 Jetons"}
        </button>
      </header>

      {/* Game Iframe or Paywall */}
      <main className="flex-1 w-full bg-black relative flex items-center justify-center">
        {isPaywalled ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-[#1a0f2e]/80 border-2 border-[#5a4282] rounded-xl shadow-[0_0_30px_rgba(165,134,214,0.3)] max-w-lg mx-4 z-10">
            <div className="w-16 h-16 bg-[#3d2b5e] rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(212,195,240,0.5)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4c3f0]">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold arcade-title-gradient arcade-font-pixel mb-4">
              TEMPS ÉCOULÉ !
            </h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              Votre essai gratuit d'une heure est terminé. Pour continuer à jouer en illimité et accéder à tout notre catalogue de jeux premium, passez à l'abonnement Zyeuté.
            </p>
            <button
              onClick={() => navigate("/premium")}
              className={`${arcadeBtnPrimary} w-full text-lg py-4 shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:shadow-[0_0_25px_rgba(34,211,238,0.8)]`}
            >
              Débloquer l'Arcade
            </button>
            <button
              onClick={() => navigate("/arcade")}
              className="mt-4 text-sm text-gray-500 hover:text-gray-300 underline underline-offset-4"
            >
              Retour au menu
            </button>
          </div>
        ) : (
          <iframe
            src={url}
            title={title}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; fullscreen; focus-without-user-activation; gamepad; keyboard-map *; camera; microphone"
          />
        )}
      </main>
    </div>
  );
}
