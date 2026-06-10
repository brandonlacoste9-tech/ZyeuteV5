import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Trophy,
  Flame,
  Clock,
  Users,
  ChevronRight,
  Star,
  Coins,
  Layers,
  Wrench,
} from "lucide-react";
import { ArcadeShell } from "@/components/arcade/ArcadeShell";
import { ArcadeLoading } from "@/components/arcade/ArcadeLoading";
import { ArcadeRankBadge } from "@/components/arcade/ArcadeRankBadge";
import {
  arcadeBtnPrimary,
  arcadeCard,
  arcadeTextCyan,
  arcadeTextYellow,
  arcadeTokenChip,
} from "@/components/arcade/arcade-ui";
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
  1: arcadeTextYellow,
  2: arcadeTextCyan,
  3: "arcade-text-magenta",
};

export default function PoutineLobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [wallet, setWallet] = useState<number | null>(null);
  const [loadingTournament, setLoadingTournament] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const fetchGen = useRef(0);

  const fetchAll = useCallback(async () => {
    const gen = ++fetchGen.current;
    setLoadError(null);
    setLoadingTournament(true);

    const tournamentPromise = getTodayTournament();
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 12000),
    );

    try {
      const t = await Promise.race([tournamentPromise, timeoutPromise]);
      if (gen !== fetchGen.current) return;

      if (!t) {
        setTournament(null);
        setLoadError("Impossible de charger le tournoi du jour.");
        return;
      }

      setTournament(t);
      setTimeLeft(t.timeRemainingMs);
      setLoadingTournament(false);

      setLoadingLeaderboard(true);
      void getLeaderboard(t.id, 10)
        .then((board) => {
          if (gen !== fetchGen.current) return;
          setLeaderboard(board);
        })
        .catch((e) => {
          console.error("[PoutineLobby] leaderboard failed", e);
        })
        .finally(() => {
          if (gen === fetchGen.current) setLoadingLeaderboard(false);
        });

      if (user) {
        void getMyRank(t.id)
          .then((rank) => {
            if (gen === fetchGen.current) setMyRank(rank);
          })
          .catch((e) => {
            console.error("[PoutineLobby] my-rank failed", e);
          });

        void getWallet()
          .then((balance) => {
            if (gen === fetchGen.current) setWallet(balance);
          })
          .catch((e) => {
            console.error("[PoutineLobby] wallet failed", e);
          });
      } else {
        setMyRank(null);
        setWallet(null);
      }
    } catch (e) {
      console.error("Failed to load royale data", e);
      if (gen === fetchGen.current) {
        setTournament(null);
        setLoadError("Le tournoi est temporairement indisponible.");
      }
    } finally {
      if (gen === fetchGen.current) setLoadingTournament(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

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

  if (loadingTournament && !tournament) {
    return <ArcadeLoading icon={Layers} label="Chargement du tournoi…" />;
  }

  return (
    <ArcadeShell
      title="Poutine Royale"
      subtitle={tournament?.title}
      icon={<Layers className="w-5 h-5 shrink-0" />}
      headerRight={
        <div className="flex items-center gap-2 shrink-0">
          {user && wallet != null && (
            <span className={arcadeTokenChip}>
              <Coins className="w-3.5 h-3.5 arcade-text-yellow" />
              {wallet}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs arcade-text-muted">
            <Clock className="w-3.5 h-3.5 arcade-text-yellow" />
            <span className="tabular-nums font-mono">
              {formatTimeRemaining(timeLeft)}
            </span>
          </span>
        </div>
      }
    >
      <div className="space-y-6 pb-6">
        {loadError && !tournament && (
          <div className={`${arcadeCard} border-red-500/30 p-6 text-center`}>
            <Wrench className="w-10 h-10 arcade-text-yellow mx-auto mb-3" />
            <p className="arcade-text-muted font-bold mb-1">
              Le tournoi est en pause technique
            </p>
            <p className="arcade-text-dim text-sm mb-4">{loadError}</p>
            <button
              type="button"
              onClick={() => void fetchAll()}
              className="px-6 py-2 rounded-sm border border-[rgba(255,230,0,0.4)] arcade-text-yellow text-sm font-bold hover:bg-[rgba(255,230,0,0.1)] transition-colors cursor-pointer"
            >
              Réessayer
            </button>
          </div>
        )}

        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${arcadeCard} p-5`}
          >
            {myRank?.score != null ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs arcade-text-dim uppercase tracking-wider mb-1">
                    Ton meilleur score aujourd'hui
                  </p>
                  <p className="text-4xl font-black arcade-text-yellow tabular-nums">
                    {myRank.score}
                  </p>
                  <p className="text-sm arcade-text-dim mt-1">
                    {myRank.layers} couches empilées
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs arcade-text-dim mb-1">Classement</p>
                  <p
                    className={`text-4xl font-black ${RANK_COLORS[myRank.rank ?? 0] ?? "text-white"}`}
                  >
                    #{myRank.rank}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="arcade-text-muted text-sm mb-1">
                  Tu n'as pas encore joué aujourd'hui
                </p>
                <p className="arcade-text-dim text-xs">
                  Joue pour apparaître dans le classement!
                </p>
              </div>
            )}
          </motion.div>
        )}

        {tournament && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handlePlay}
            className={`${arcadeBtnPrimary} py-5 text-xl flex items-center justify-center gap-3`}
          >
            <Flame className="w-6 h-6" />
            {myRank?.score != null ? "Réessayer" : "Jouer maintenant"}
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        )}

        {tournament && (
          <div className="grid grid-cols-3 gap-3">
            <div className={`${arcadeCard} p-3 text-center`}>
              <Users className="w-4 h-4 arcade-text-dim mx-auto mb-1" />
              <p className="text-lg font-black tabular-nums">
                {tournament.entryCount}
              </p>
              <p className="text-xs arcade-text-dim">joueurs</p>
            </div>
            <div className={`${arcadeCard} p-3 text-center`}>
              <Star className="w-4 h-4 arcade-text-yellow mx-auto mb-1 fill-[#ffe600]" />
              <p className="text-lg font-black tabular-nums arcade-text-yellow">
                {tournament.topScore ?? "—"}
              </p>
              <p className="text-xs arcade-text-dim">record du jour</p>
            </div>
            <div className={`${arcadeCard} p-3 text-center`}>
              <Clock className="w-4 h-4 arcade-text-dim mx-auto mb-1" />
              <p className="text-lg font-black tabular-nums">
                {formatTimeRemaining(timeLeft)}
              </p>
              <p className="text-xs arcade-text-dim">restant</p>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 arcade-text-yellow" />
            <h2 className="font-black text-lg uppercase tracking-wide">
              Classement du jour
            </h2>
            {loadingLeaderboard && (
              <span className="text-xs arcade-text-dim animate-pulse">
                sync…
              </span>
            )}
          </div>

          {leaderboard.length === 0 ? (
            <div className={`${arcadeCard} p-8 text-center`}>
              <Layers className="w-10 h-10 arcade-text-yellow mx-auto mb-3" />
              <p className="arcade-text-muted text-sm">
                {loadingLeaderboard
                  ? "Chargement du classement…"
                  : "Aucun score encore — sois le premier!"}
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
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors duration-200 ${
                        isMe
                          ? "bg-[rgba(255,230,0,0.1)] border-[rgba(255,230,0,0.4)]"
                          : "bg-[rgba(10,8,20,0.6)] border-[rgba(0,243,255,0.2)]"
                      }`}
                    >
                      <div className="w-8 text-center flex-shrink-0">
                        <ArcadeRankBadge rank={entry.rank} />
                      </div>

                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff2bd6] to-[#1a1430] flex-shrink-0 overflow-hidden border border-[rgba(255,43,214,0.4)]">
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

                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-bold text-sm truncate ${isMe ? "arcade-text-yellow" : ""}`}
                        >
                          {entry.displayName ?? entry.username ?? "Anonyme"}
                          {isMe && (
                            <span className="ml-1 text-xs arcade-text-yellow">
                              (toi)
                            </span>
                          )}
                        </p>
                        <p className="text-xs arcade-text-dim">
                          {entry.layers} couches
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p
                          className={`font-black text-lg tabular-nums ${
                            entry.rank === 1
                              ? "arcade-text-yellow"
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

        <div
          className={`${arcadeCard} p-4 text-sm arcade-text-muted space-y-1`}
        >
          <p className="arcade-text-yellow font-bold mb-2">Comment jouer</p>
          <p>• Tape pour lâcher chaque couche de poutine</p>
          <p>• Stack le plus haut possible sans rater</p>
          <p>• Les pièces deviennent plus petites à mesure que tu montes</p>
          <p>• Bats ton record du jour pour gagner un cadeau GG en jetons</p>
          <p>• Le classement reset chaque minuit</p>
        </div>
      </div>
    </ArcadeShell>
  );
}
