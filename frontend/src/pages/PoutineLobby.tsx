import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Trophy,
  Flame,
  Clock,
  Users,
  ChevronRight,
  ArrowLeft,
  Star,
  Coins,
} from "lucide-react";
import {
  getTodayTournament,
  getLeaderboard,
  getMyRank,
  getWallet,
  type RoyaleTournament as Tournament,
  type RoyaleLeaderboardEntry as LeaderboardEntry,
  type RoyaleMyRank as MyRank,
} from "@/services/royaleService";

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Terminé";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const RANK_COLORS: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-zinc-300",
  3: "text-amber-600",
};
const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function PoutineLobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [wallet, setWallet] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchAll = useCallback(async () => {
    setLoadError(false);
    try {
      const t = await getTodayTournament();
      if (!t) {
        setLoadError(true);
        return;
      }
      setTournament(t);
      setTimeLeft(t.timeRemainingMs);

      const board = await getLeaderboard(t.id, 10);
      setLeaderboard(board);

      if (user) {
        const [rank, balance] = await Promise.all([
          getMyRank(t.id),
          getWallet(),
        ]);
        setMyRank(rank);
        setWallet(balance);
      }
    } catch (e) {
      console.error("Failed to load royale data", e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(
      () => setTimeLeft((t) => Math.max(0, t - 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handlePlay = () => {
    if (!user) return navigate("/login");
    if (!tournament) return;
    navigate(`/arcade/poutine/play/${tournament.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="text-4xl"
        >
          🍟
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/arcade")}
          className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-black text-lg tracking-tight flex items-center gap-2">
            🍟 Poutine Royale
          </h1>
          {tournament && (
            <p className="text-xs text-white/40">{tournament.title}</p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {user && wallet != null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span className="tabular-nums font-bold text-yellow-300 text-sm">
                {wallet}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-white/50">
            <Clock className="w-3.5 h-3.5" />
            <span className="tabular-nums font-mono">
              {formatTimeRemaining(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Load error */}
        {loadError && !tournament && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center">
            <p className="text-4xl mb-3">🛠️</p>
            <p className="text-white/70 font-bold mb-1">
              Le tournoi est en pause technique
            </p>
            <p className="text-white/40 text-sm mb-4">
              Impossible de charger le tournoi du jour. Réessaie dans un
              instant.
            </p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchAll();
              }}
              className="px-6 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-bold hover:bg-white/20 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* My rank card */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/30 rounded-2xl p-5"
          >
            {myRank?.score != null ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                    Ton meilleur score aujourd'hui
                  </p>
                  <p className="text-4xl font-black text-purple-300 tabular-nums">
                    {myRank.score}
                  </p>
                  <p className="text-sm text-white/40 mt-1">
                    {myRank.layers} couches empilées
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/50 mb-1">Classement</p>
                  <p
                    className={`text-4xl font-black ${RANK_COLORS[myRank.rank!] ?? "text-white"}`}
                  >
                    #{myRank.rank}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-white/50 text-sm mb-1">
                  Tu n'as pas encore joué aujourd'hui
                </p>
                <p className="text-white/30 text-xs">
                  Joue pour apparaître dans le classement!
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Play button */}
        {tournament && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handlePlay}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black text-xl uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(234,179,8,0.3)]"
          >
            <Flame className="w-6 h-6" />
            {myRank?.score != null ? "Réessayer" : "Jouer maintenant"}
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        )}

        {/* Stats row */}
        {tournament && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Users className="w-4 h-4 text-white/40 mx-auto mb-1" />
              <p className="text-lg font-black tabular-nums">
                {tournament.entryCount}
              </p>
              <p className="text-xs text-white/40">joueurs</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-lg font-black tabular-nums text-yellow-400">
                {tournament.topScore ?? "—"}
              </p>
              <p className="text-xs text-white/40">record du jour</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <Clock className="w-4 h-4 text-white/40 mx-auto mb-1" />
              <p className="text-lg font-black tabular-nums">
                {formatTimeRemaining(timeLeft)}
              </p>
              <p className="text-xs text-white/40">restant</p>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="font-black text-lg uppercase tracking-wide">
              Classement du jour
            </h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-8 text-center">
              <p className="text-4xl mb-3">🍟</p>
              <p className="text-white/50 text-sm">
                Aucun score encore — sois le premier!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {leaderboard.map((entry, i) => {
                  const isMe = user?.id === entry.userId;
                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        isMe
                          ? "bg-purple-900/30 border-purple-500/40"
                          : "bg-white/5 border-transparent"
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-8 text-center flex-shrink-0">
                        {entry.rank <= 3 ? (
                          <span className="text-lg">
                            {RANK_MEDALS[entry.rank - 1]}
                          </span>
                        ) : (
                          <span
                            className={`font-black text-sm ${RANK_COLORS[entry.rank] ?? "text-white/40"}`}
                          >
                            #{entry.rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
                        {entry.avatarUrl ? (
                          <img
                            src={entry.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-black">
                            {(entry.displayName ?? entry.username ?? "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-bold text-sm truncate ${isMe ? "text-purple-300" : ""}`}
                        >
                          {entry.displayName ?? entry.username ?? "Anonyme"}
                          {isMe && (
                            <span className="ml-1 text-xs text-purple-400">
                              (toi)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-white/30">
                          {entry.layers} couches
                        </p>
                      </div>

                      {/* Score */}
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`font-black text-lg tabular-nums ${
                            entry.rank === 1
                              ? "text-yellow-400"
                              : entry.rank === 2
                                ? "text-zinc-300"
                                : entry.rank === 3
                                  ? "text-amber-600"
                                  : "text-white"
                          }`}
                        >
                          {entry.score}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="bg-white/5 rounded-xl p-4 text-sm text-white/50 space-y-1">
          <p className="text-white/70 font-bold mb-2">Comment jouer</p>
          <p>• Tape pour lâcher chaque couche de poutine</p>
          <p>• Stack le plus haut possible sans rater</p>
          <p>• Les pièces deviennent plus petites à mesure que tu montes</p>
          <p>• Bats ton record du jour pour gagner un cadeau GG en jetons 🪙</p>
          <p>• Le classement reset chaque minuit</p>
        </div>
      </div>
    </div>
  );
}
