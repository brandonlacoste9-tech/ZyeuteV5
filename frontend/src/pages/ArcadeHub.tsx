import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaGamepad, FaHive, FaQuestionCircle } from "react-icons/fa";
import { Zap } from "lucide-react";

export default function ArcadeHub() {
  const navigate = useNavigate();

  const games = [
    {
      id: "grid-rush",
      title: "Grid Rush",
      description:
        "Bataille de vitesse 1v1. Tape 1→16 avant ton adversaire. 45 secondes chrono.",
      icon: <Zap className="w-12 h-12 text-amber-400" />,
      status: "LIVE",
      path: "/arcade/grid-rush",
    },
    {
      id: "poutine",
      title: "Poutine Royale",
      description:
        "Stacke ta poutine le plus haut possible. Compétition journalière.",
      icon: <FaGamepad className="w-12 h-12 text-yellow-500" />,
      status: "LIVE",
      path: "/games/poutine",
    },
    {
      id: "hive-tap",
      title: "Hive Tap",
      description: "Check-in rapide NFC pour domination territoriale.",
      icon: <FaHive className="w-12 h-12 text-purple-500" />,
      status: "LIVE",
      path: "/hive-tap",
    },
    {
      id: "trivia",
      title: "Zyeuté Quiz",
      description: "Test tes connaissances sur le Québec.",
      icon: <FaQuestionCircle className="w-12 h-12 text-blue-500" />,
      status: "COMING SOON",
      path: null,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono">
      <header className="flex justify-between items-center mb-12 border-b-2 border-purple-600 pb-4">
        <h1 className="text-4xl font-black uppercase tracking-widest flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          Zyeuté Arcade
        </h1>
      </header>

      <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <motion.div
            key={game.id}
            className={`bg-gray-900 border-2 rounded-xl p-6 relative overflow-hidden group ${
              game.status === "LIVE"
                ? "border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                : "border-gray-700 opacity-60 grayscale"
            }`}
          >
            <div className="absolute top-4 right-4 text-xs font-bold px-2 py-1 bg-black rounded border border-white/20">
              {game.status}
            </div>

            <div className="mb-6 bg-black/50 p-6 rounded-full inline-block group-hover:bg-black/80 transition-colors">
              {game.icon}
            </div>

            <h2 className="text-2xl font-black italic mb-2">{game.title}</h2>
            <p className="text-gray-400 text-sm mb-6">{game.description}</p>

            {game.status === "LIVE" && game.path && (
              <button
                type="button"
                onClick={() => navigate(game.path!)}
                className="w-full bg-yellow-500 text-black font-black py-3 uppercase tracking-wider rounded hover:bg-yellow-400 transition-colors"
              >
                JOUER MAINTENANT
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
