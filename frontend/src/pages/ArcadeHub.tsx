import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { ArcadeBackdrop } from "@/components/arcade/ArcadeBackdrop";
import {
  arcadeBtnPrimary,
  arcadeTextCyan,
  arcadeTextMuted,
} from "@/components/arcade/arcade-ui";
import { useSEO } from "@/hooks/useSEO";

export default function ArcadeHub() {
  const navigate = useNavigate();
  useSEO({
    title: "Arcade — Jeux québécois",
    description:
      "Zyeuté Arcade : Grid Rush, Poutine Stack, Carte Sucrée et plus. Mini-jeux gratuits pour la gang d'icitte.",
    url: "/arcade",
  });

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
        </header>

        {/* Premium Banner for Hell Yeah Games Headquarters */}
        <div className="mb-12">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              window.open(
                "https://www.hellyeah-games.com/",
                "_blank",
                "noopener,noreferrer",
              )
            }
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                window.open(
                  "https://www.hellyeah-games.com/",
                  "_blank",
                  "noopener,noreferrer",
                );
              }
            }}
            aria-label="Visiter Hell Yeah Games"
            className="relative w-full overflow-hidden rounded-2xl cursor-pointer group"
            style={{
              background: "linear-gradient(135deg, #FF0055 0%, #7000FF 100%)",
              boxShadow:
                "0 0 30px rgba(255, 0, 85, 0.4), inset 0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            {/* Cyberpunk grid overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 z-10">
              <div className="text-center md:text-left flex-1">
                <div className="inline-block px-3 py-1 bg-black/40 border border-white/10 rounded-full text-xs font-bold text-pink-300 uppercase tracking-widest mb-3 backdrop-blur-sm">
                  Partenaire Officiel
                </div>
                <h2
                  className="text-3xl sm:text-4xl font-black text-white mb-2 leading-tight drop-shadow-md"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Hell Yeah Games INC
                </h2>
                <p className="text-white/80 text-sm sm:text-base max-w-md mx-auto md:mx-0">
                  Découvrez notre Quartier Général ! Plus de 800+ jeux premiums,
                  des tournois exclusifs, et la communauté ultime de joueurs.
                </p>
              </div>

              <div className="flex-shrink-0">
                <button className="px-8 py-4 bg-white text-black font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.4)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.8)] transition-all duration-300 flex items-center gap-2">
                  Visiter le QG <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <WebGamesCatalog />

        <p className={`text-center arcade-insert-coin mt-12 opacity-70`}>
          CREDIT 00
        </p>
      </div>
    </ArcadeBackdrop>
  );
}

interface WebGame {
  Title: string;
  Md5: string;
  Description: string;
  Url: string;
  Asset: string[];
  Category: string[];
}

function WebGamesCatalog() {
  const navigate = useNavigate();
  const [games, setGames] = useState<WebGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("puzzle");

  const categories = [
    { id: "puzzle", label: "Casse-tête & Cartes" },
    { id: "action", label: "Action & Shooter" },
    { id: "casual", label: "Casual & Bulles" },
    { id: "course", label: "Course & Voitures" },
  ];

  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      try {
        // Fetch from our backend proxy with the selected category
        const res = await fetch(
          `/api/gamedistribution/rss?category=${activeCategory}`,
        );
        const data = await res.json();
        if (data && Array.isArray(data)) {
          setGames(data);
        }
      } catch (e) {
        console.error("Failed to fetch games via proxy:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, [activeCategory]);

  return (
    <div className="mt-12">
      <div className="flex flex-col items-center gap-6 mb-8">
        <h2 className="text-xl sm:text-2xl font-bold arcade-title-gradient arcade-font-pixel">
          CATALOGUE WEB
        </h2>

        {/* Neon Tabs Menu */}
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 border ${
                activeCategory === cat.id
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                  : "bg-transparent border-[#3d2b5e] text-[#a586d6] hover:border-[#5a4282] hover:text-[#d4c3f0]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-20 flex justify-center opacity-50 min-h-[300px]">
          <div className="arcade-font-pixel animate-pulse text-cyan-400">
            Chargement...
          </div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {games.map((g) => (
            <motion.div
              key={g.Md5}
              whileHover={{ y: -4 }}
              className="bg-[#2d1b4e]/80 rounded-xl overflow-hidden border border-[#3d2b5e] flex flex-col group cursor-pointer"
              onClick={() =>
                navigate(
                  `/arcade/play?url=${encodeURIComponent(g.Url)}&title=${encodeURIComponent(g.Title)}`,
                )
              }
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-black/50">
                <img
                  src={g.Asset[0]}
                  alt={g.Title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm text-white truncate mb-1">
                  {g.Title}
                </h3>
                <p className="text-xs text-purple-300/70 line-clamp-2">
                  {g.Description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
