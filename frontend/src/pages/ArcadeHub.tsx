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

export default function ArcadeHub() {
  const navigate = useNavigate();

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
        const res = await fetch(`/api/gamedistribution/rss?category=${activeCategory}`);
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
          <div className="arcade-font-pixel animate-pulse text-cyan-400">Chargement...</div>
        </div>
      ) : (

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {games.map((g) => (
          <motion.div
            key={g.Md5}
            whileHover={{ y: -4 }}
            className="bg-[#2d1b4e]/80 rounded-xl overflow-hidden border border-[#3d2b5e] flex flex-col group cursor-pointer"
            onClick={() => navigate(`/arcade/play?url=${encodeURIComponent(g.Url)}&title=${encodeURIComponent(g.Title)}`)}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-black/50">
              <img 
                src={g.Asset[0]} 
                alt={g.Title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
            <div className="p-3">
              <h3 className="font-bold text-sm text-white truncate mb-1">{g.Title}</h3>
              <p className="text-xs text-purple-300/70 line-clamp-2">{g.Description}</p>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
}
