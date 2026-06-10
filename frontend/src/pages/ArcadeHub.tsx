import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  Gamepad2,
  HelpCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { FaHive } from "react-icons/fa";
import { arcadeBtnPrimary, arcadeCard } from "@/components/arcade/arcade-ui";

interface ArcadeGame {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "LIVE" | "COMING SOON";
  path: string | null;
  accent: string;
}

export default function ArcadeHub() {
  const navigate = useNavigate();

  const games: ArcadeGame[] = [
    {
      id: "grid-rush",
      title: "Grid Rush",
      description:
        "Bataille de vitesse 1v1. Tape 1→16 avant ton adversaire. 45 secondes chrono.",
      icon: <Zap className="w-9 h-9 text-gold-400" />,
      status: "LIVE",
      path: "/arcade/grid-rush",
      accent: "shadow-[0_0_28px_rgba(243,176,38,0.18)]",
    },
    {
      id: "poutine",
      title: "Poutine Royale",
      description:
        "Stacke ta poutine le plus haut possible. Compétition journalière.",
      icon: <Gamepad2 className="w-9 h-9 text-gold-400" />,
      status: "LIVE",
      path: "/arcade/poutine",
      accent: "shadow-[0_0_28px_rgba(212,175,55,0.15)]",
    },
    {
      id: "quiz",
      title: "Zyeuté Quiz",
      description:
        "Test tes connaissances sur le Québec. 5 questions par jour.",
      icon: <Brain className="w-9 h-9 text-gold-400" />,
      status: "LIVE",
      path: "/arcade/quiz",
      accent: "shadow-[0_0_28px_rgba(201,162,39,0.12)]",
    },
    {
      id: "hive-tap",
      title: "Hive Tap",
      description:
        "Transfère des Piasses à ton chum en tap — proximité requise.",
      icon: <FaHive className="w-9 h-9 text-gold-400" />,
      status: "LIVE",
      path: "/arcade/hive-tap",
      accent: "shadow-[0_0_28px_rgba(184,134,11,0.14)]",
    },
  ];

  const liveCount = games.filter((g) => g.status === "LIVE").length;

  return (
    <div className="min-h-screen bg-black leather-overlay text-white pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-gold-500/8 to-transparent" />

      <header className="relative max-w-6xl mx-auto px-4 pt-6 pb-8 border-b border-gold-500/20">
        <button
          type="button"
          onClick={() => navigate("/explore")}
          className="flex items-center gap-2 text-gold-400 text-sm font-bold mb-6 hover:text-gold-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à Explorer
        </button>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-leather-400 mb-2 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-gold-500" />
              Voyageur Arcade
            </p>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-gold-gradient">
              Zyeuté Arcade
            </h1>
            <p className="text-leather-300 text-sm mt-2 max-w-lg">
              Grid Rush, Poutine Royale, Quiz et Hive Tap — défie la ruche en
              mode cuir & or.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full border border-gold-500/35 bg-gold-500/10 text-gold-300 text-xs font-bold uppercase tracking-wider">
            {liveCount} jeux live
          </div>
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-4 pt-8 grid gap-5 md:grid-cols-2">
        {games.map((game, index) => (
          <motion.article
            key={game.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.35 }}
            whileHover={{ y: -2 }}
            className={`${arcadeCard} p-6 relative overflow-hidden cursor-pointer group ${
              game.status === "LIVE"
                ? `border-gold-500/35 ${game.accent}`
                : "border-leather-700 opacity-60"
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
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full border border-gold-500/35 text-gold-400 uppercase tracking-wider bg-black/30">
              {game.status}
            </div>

            <div className="relative mb-5 w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center group-hover:border-gold-400/50 transition-colors">
              {game.icon}
            </div>

            <h2 className="relative text-2xl font-black text-white mb-2">
              {game.title}
            </h2>
            <p className="relative text-leather-300 text-sm mb-6 min-h-[40px] leading-relaxed">
              {game.description}
            </p>

            {game.status === "LIVE" && game.path ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(game.path!);
                }}
                className={`${arcadeBtnPrimary} relative`}
              >
                Jouer maintenant
              </button>
            ) : (
              <div className="w-full py-3 text-center text-leather-500 text-sm flex items-center justify-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Bientôt
              </div>
            )}
          </motion.article>
        ))}
      </div>
    </div>
  );
}
