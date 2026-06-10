import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, Gamepad2, HelpCircle, Zap } from "lucide-react";
import { FaHive } from "react-icons/fa";
import { ArcadeBackdrop } from "@/components/arcade/ArcadeBackdrop";
import {
  arcadeBtnPrimary,
  arcadeCardCyan,
  arcadeCardLime,
  arcadeCardMagenta,
  arcadeCardYellow,
  arcadeLiveBadge,
  arcadeTextCyan,
  arcadeTextLime,
  arcadeTextMagenta,
  arcadeTextMuted,
  arcadeTextYellow,
} from "@/components/arcade/arcade-ui";

interface ArcadeGame {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "LIVE" | "COMING SOON";
  path: string | null;
  cardClass: string;
  iconClass: string;
}

export default function ArcadeHub() {
  const navigate = useNavigate();

  const games: ArcadeGame[] = [
    {
      id: "grid-rush",
      title: "Grid Rush",
      description:
        "Bataille 1v1 — tape 1→16 avant ton adversaire. 45 secondes chrono.",
      icon: <Zap className="w-8 h-8" aria-hidden />,
      status: "LIVE",
      path: "/arcade/grid-rush",
      cardClass: arcadeCardCyan,
      iconClass: arcadeTextCyan,
    },
    {
      id: "poutine",
      title: "Poutine Royale",
      description: "Stacke ta poutine. Tournoi journalière, classement live.",
      icon: <Gamepad2 className="w-8 h-8" aria-hidden />,
      status: "LIVE",
      path: "/arcade/poutine",
      cardClass: arcadeCardMagenta,
      iconClass: arcadeTextMagenta,
    },
    {
      id: "quiz",
      title: "Zyeuté Quiz",
      description: "5 questions par jour sur le Québec. Piasses à gagner.",
      icon: <Brain className="w-8 h-8" aria-hidden />,
      status: "LIVE",
      path: "/arcade/quiz",
      cardClass: arcadeCardYellow,
      iconClass: arcadeTextYellow,
    },
    {
      id: "hive-tap",
      title: "Hive Tap",
      description: "Transfère des Piasses à ton chum — proximité requise.",
      icon: <FaHive className="w-8 h-8" aria-hidden />,
      status: "LIVE",
      path: "/arcade/hive-tap",
      cardClass: arcadeCardLime,
      iconClass: arcadeTextLime,
    },
  ];

  const liveCount = games.filter((g) => g.status === "LIVE").length;

  return (
    <ArcadeBackdrop className="pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <button
          type="button"
          onClick={() => navigate("/explore")}
          className={`flex items-center gap-2 text-sm font-bold mb-6 ${arcadeTextCyan} hover:opacity-80 transition-opacity cursor-pointer`}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à Explorer
        </button>

        <header className="mb-10">
          <div className="arcade-marquee mb-6">
            <div className="arcade-marquee-lights" aria-hidden>
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className="arcade-marquee-light" />
              ))}
            </div>
            <p className="arcade-insert-coin text-center mb-3">INSERT COIN</p>
            <h1 className="arcade-font-pixel text-center text-sm sm:text-base arcade-title-gradient leading-relaxed px-2">
              ZYEUTÉ ARCADE
            </h1>
            <p
              className={`text-center text-xs mt-3 uppercase tracking-[0.2em] ${arcadeTextMuted}`}
            >
              Est. 1985 · Montréal QC
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={`text-sm max-w-lg ${arcadeTextMuted}`}>
              Choisis ta machine. Grid Rush, Poutine, Quiz et Hive Tap — tout
              est live dans la salle.
            </p>
            <span className={arcadeLiveBadge}>
              <span className="arcade-live-dot" aria-hidden />
              {liveCount} LIVE
            </span>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {games.map((game, index) => (
            <motion.article
              key={game.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              className={`${game.cardClass} p-6 relative overflow-hidden cursor-pointer group ${
                game.status !== "LIVE" ? "opacity-50 pointer-events-none" : ""
              }`}
              onClick={() => {
                if (game.status === "LIVE" && game.path) navigate(game.path);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && game.path) navigate(game.path);
              }}
              role={game.status === "LIVE" ? "button" : undefined}
              tabIndex={game.status === "LIVE" ? 0 : undefined}
            >
              <div
                className={`absolute top-4 right-4 text-[9px] font-bold px-2 py-1 uppercase tracking-wider arcade-live-badge ${
                  game.status !== "LIVE" ? "opacity-60" : ""
                }`}
              >
                {game.status === "LIVE" && (
                  <span className="arcade-live-dot" aria-hidden />
                )}
                {game.status}
              </div>

              <div
                className={`arcade-icon-well mb-5 ${game.iconClass} group-hover:opacity-100 transition-opacity`}
              >
                {game.icon}
              </div>

              <h2 className="arcade-font-pixel text-[10px] sm:text-xs text-white mb-3 leading-relaxed">
                {game.title.toUpperCase()}
              </h2>
              <p
                className={`text-sm mb-6 min-h-[40px] leading-relaxed ${arcadeTextMuted}`}
              >
                {game.description}
              </p>

              {game.status === "LIVE" && game.path ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(game.path!);
                  }}
                  className={arcadeBtnPrimary}
                >
                  Player 1 Start
                </button>
              ) : (
                <div
                  className={`w-full py-3 text-center text-sm flex items-center justify-center gap-2 ${arcadeTextMuted}`}
                >
                  <HelpCircle className="w-4 h-4" />
                  Bientôt
                </div>
              )}
            </motion.article>
          ))}
        </div>

        <p className={`text-center arcade-insert-coin mt-12 opacity-70`}>
          CREDIT 00
        </p>
      </div>
    </ArcadeBackdrop>
  );
}
