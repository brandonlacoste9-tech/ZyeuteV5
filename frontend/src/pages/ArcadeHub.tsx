import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Candy, Gamepad2, HelpCircle, Zap, Globe, Play } from "lucide-react";
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
      id: "carte-sucree",
      title: "Carte Sucrée",
      description: "Match-3 québécois — aligne les bonbons, gagne des jetons.",
      icon: <Candy className="w-8 h-8" aria-hidden />,
      status: "LIVE",
      path: "/arcade/carte-sucree",
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
              Choisis ta machine. Grid Rush, Poutine, Carte Sucrée et Hive Tap —
              tout est live dans la salle.
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

  // Hardcoded GameDistribution catalog to bypass CORS issues on Vercel
  const games: WebGame[] = [
    {
      Title: "Bubble Blasters",
      Md5: "5d8d11e9919245939a57378a02b8fc8b",
      Description: "Bubble Blasters is a colorful side-scrolling adventure where you blast bubbles to clear levels.",
      Url: "https://html5.gamedistribution.com/5d8d11e9919245939a57378a02b8fc8b/",
      Asset: ["https://img.gamedistribution.com/5d8d11e9919245939a57378a02b8fc8b-512x384.jpg"],
      Category: ["Adventure"]
    },
    {
      Title: "Tank Strike",
      Md5: "31f1a27db10a462fb893319e8266cdb9",
      Description: "Enter a brutal wasteland battlefield and control a powerful tank.",
      Url: "https://html5.gamedistribution.com/31f1a27db10a462fb893319e8266cdb9/",
      Asset: ["https://img.gamedistribution.com/31f1a27db10a462fb893319e8266cdb9-512x384.jpg"],
      Category: ["Action"]
    },
    {
      Title: "Hole Puzzle",
      Md5: "7697f626f5224cb284cf463ce1275495",
      Description: "Hole Puzzle is a fun casual game where a hungry cat eats everything in sight!",
      Url: "https://html5.gamedistribution.com/7697f626f5224cb284cf463ce1275495/",
      Asset: ["https://img.gamedistribution.com/7697f626f5224cb284cf463ce1275495-512x384.jpg"],
      Category: ["Casual"]
    },
    {
      Title: "Magic Brick Wars",
      Md5: "a9964948ad434acfb106811d323e6464",
      Description: "Fight wars with your favorite characters using your own Raskulls!",
      Url: "https://html5.gamedistribution.com/a9964948ad434acfb106811d323e6464/",
      Asset: ["https://img.gamedistribution.com/a9964948ad434acfb106811d323e6464-512x384.jpg"],
      Category: ["Strategy"]
    }
  ];

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
