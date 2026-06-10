import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, Gamepad2, HelpCircle, Zap } from "lucide-react";
import { FaHive } from "react-icons/fa";

interface ArcadeGame {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "LIVE" | "COMING SOON";
  path: string | null;
}

export default function ArcadeHub() {
  const navigate = useNavigate();

  const games: ArcadeGame[] = [
    {
      id: "grid-rush",
      title: "Grid Rush",
      description:
        "Bataille de vitesse 1v1. Tape 1→16 avant ton adversaire. 45 secondes chrono.",
      icon: <Zap className="w-10 h-10 text-gold-400" />,
      status: "LIVE",
      path: "/arcade/grid-rush",
    },
    {
      id: "poutine",
      title: "Poutine Royale",
      description:
        "Stacke ta poutine le plus haut possible. Compétition journalière.",
      icon: <Gamepad2 className="w-10 h-10 text-gold-400" />,
      status: "LIVE",
      path: "/arcade/poutine",
    },
    {
      id: "quiz",
      title: "Zyeuté Quiz",
      description:
        "Test tes connaissances sur le Québec. 5 questions par jour.",
      icon: <Brain className="w-10 h-10 text-gold-400" />,
      status: "LIVE",
      path: "/arcade/quiz",
    },
    {
      id: "hive-tap",
      title: "Hive Tap",
      description:
        "Transfère des Piasses à ton chum en tap — proximité requise.",
      icon: <FaHive className="w-10 h-10 text-gold-400" />,
      status: "LIVE",
      path: "/arcade/hive-tap",
    },
  ];

  return (
    <div className="min-h-screen bg-black leather-overlay text-white p-4 pb-24">
      <header className="max-w-6xl mx-auto mb-10 border-b border-gold-500/30 pb-4">
        <button
          type="button"
          onClick={() => navigate("/explore")}
          className="flex items-center gap-2 text-gold-400 text-sm font-bold mb-4 hover:text-gold-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à Explorer
        </button>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-gold-400">
          Zyeuté Arcade
        </h1>
        <p className="text-leather-300 text-sm mt-2">
          Grid Rush, Poutine Royale, Quiz et Hive Tap — tout en un hub.
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2">
        {games.map((game, index) => (
          <motion.article
            key={game.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={`leather-card stitched rounded-2xl p-6 relative overflow-hidden ${
              game.status === "LIVE"
                ? "border border-gold-500/30 shadow-[0_0_24px_rgba(201,162,39,0.12)]"
                : "border border-leather-700 opacity-60"
            }`}
          >
            <div className="absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded-full border border-gold-500/30 text-gold-400 uppercase tracking-wider">
              {game.status}
            </div>

            <div className="mb-5 w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center">
              {game.icon}
            </div>

            <h2 className="text-2xl font-black text-white mb-2">
              {game.title}
            </h2>
            <p className="text-leather-300 text-sm mb-6 min-h-[40px]">
              {game.description}
            </p>

            {game.status === "LIVE" && game.path ? (
              <button
                type="button"
                onClick={() => navigate(game.path!)}
                className="w-full bg-gold-500 text-black font-black py-3 uppercase tracking-wider rounded-xl hover:bg-gold-400 transition-colors"
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
