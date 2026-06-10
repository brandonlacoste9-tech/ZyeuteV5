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

  useEffect(() => {
    async function fetchGames() {
      try {
        // Fetch from our backend proxy to avoid CORS and get curated games
        const res = await fetch("/api/gamedistribution/rss");
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
  }, []);

  if (loading) {
    return (
      <div className="mt-20 flex justify-center opacity-50">
        <div className="arcade-font-pixel">Chargement du catalogue...</div>
      </div>
    );
  }

  return (
    <div className="mt-20">
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-xl sm:text-2xl font-bold arcade-title-gradient arcade-font-pixel">
          NOUVEAUTÉS DU WEB
        </h2>
      </div>

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
    </div>
  );
}
