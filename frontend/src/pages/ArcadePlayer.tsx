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

  const url = searchParams.get("url");
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

      {/* Game Iframe */}
      <main className="flex-1 w-full bg-black relative">
        <iframe
          src={url}
          title={title}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; fullscreen; focus-without-user-activation; gamepad; keyboard-map *; camera; microphone"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </main>
    </div>
  );
}
