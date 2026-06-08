import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Gift } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  submitRoundScore,
  finishMatch,
  type GridRushMatch,
} from "@/services/gridRushService";

interface GridRushGameProps {
  matchId: string;
  currentUserId: string;
  initialMatch: GridRushMatch;
}

type GamePhase = "STARTING" | "PLAYING" | "FINISHED";

function shuffleGrid(): number[] {
  const numbers = Array.from({ length: 16 }, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
}

function initialGamePhase(match: GridRushMatch): GamePhase {
  if (match.status === "ACTIVE") return "PLAYING";
  if (match.status === "COMPLETED") return "FINISHED";
  return "STARTING";
}

function myScoreFrom(match: GridRushMatch, userId: string): number {
  return match.player1Id === userId ? match.player1Score : match.player2Score;
}

function normalizeMatch(row: Record<string, unknown>): GridRushMatch {
  return {
    id: (row.id as string) ?? "",
    status: row.status as GridRushMatch["status"],
    player1Id: (row.player1Id ?? row.player_1_id) as string,
    player2Id: ((row.player2Id ?? row.player_2_id) as string) ?? null,
    player1Score: Number(row.player1Score ?? row.player_1_score ?? 0),
    player2Score: Number(row.player2Score ?? row.player_2_score ?? 0),
    stakeTokens: Number(row.stakeTokens ?? row.stake_tokens ?? 500),
    winnerId: ((row.winnerId ?? row.winner_id) as string) ?? null,
    startedAt: (row.startedAt ?? row.started_at) as string | null,
    endsAt: (row.endsAt ?? row.ends_at) as string | null,
    createdAt: (row.createdAt ?? row.created_at) as string,
    updatedAt: (row.updatedAt ?? row.updated_at) as string,
  };
}

export default function GridRushGame({
  matchId,
  currentUserId,
  initialMatch,
}: GridRushGameProps) {
  const [matchData, setMatchData] = useState<GridRushMatch>(initialMatch);
  const [gridNumbers, setGridNumbers] = useState<number[]>(() =>
    initialMatch.status === "ACTIVE" ? shuffleGrid() : [],
  );
  const [nextExpectedNumber, setNextExpectedNumber] = useState(1);
  const [localScore, setLocalScore] = useState(() =>
    myScoreFrom(initialMatch, currentUserId),
  );
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameState, setGameState] = useState<GamePhase>(() =>
    initialGamePhase(initialMatch),
  );
  const finishCalled = useRef(false);

  const isPlayer1 = matchData.player1Id === currentUserId;

  const opponentScore = isPlayer1
    ? matchData.player2Score
    : matchData.player1Score;

  const generateNewGrid = useCallback(() => {
    const numbers = Array.from({ length: 16 }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    setGridNumbers(numbers);
    setNextExpectedNumber(1);
  }, []);

  const syncFromMatch = useCallback(
    (raw: Record<string, unknown>) => {
      const updated = normalizeMatch(raw);
      setMatchData(updated);

      const serverMyScore =
        updated.player1Id === currentUserId
          ? updated.player1Score
          : updated.player2Score;
      setLocalScore((prev) => Math.max(prev, serverMyScore));

      if (updated.status === "ACTIVE") {
        setGameState("PLAYING");
        setGridNumbers((prev) => {
          if (prev.length === 0) {
            const numbers = Array.from({ length: 16 }, (_, i) => i + 1);
            for (let i = numbers.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
            }
            setNextExpectedNumber(1);
            return numbers;
          }
          return prev;
        });
      }
      if (updated.status === "COMPLETED") {
        setGameState("FINISHED");
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    const channel = supabase
      .channel(`grid_rush_${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "grid_rush_matches",
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          syncFromMatch(payload.new as Record<string, unknown>);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, syncFromMatch]);

  useEffect(() => {
    if (!matchData.endsAt) return;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(matchData.endsAt!).getTime() - Date.now()) / 1000),
      );
      setTimeLeft(remaining);

      if (
        remaining <= 0 &&
        matchData.status === "ACTIVE" &&
        !finishCalled.current
      ) {
        finishCalled.current = true;
        void finishMatch(matchId).then(({ data }) => {
          if (data) setMatchData(data);
          setGameState("FINISHED");
        });
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [matchData.endsAt, matchData.status, matchId]);

  const handleNumberClick = async (num: number) => {
    if (gameState !== "PLAYING") return;

    if (num === nextExpectedNumber) {
      if (num === 16) {
        const optimistic = localScore + 1;
        setLocalScore(optimistic);
        generateNewGrid();

        const { data, error } = await submitRoundScore(matchId);
        if (error || !data) {
          setLocalScore(localScore);
        } else {
          setMatchData(data);
        }
      } else {
        setNextExpectedNumber((prev) => prev + 1);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-white p-4">
      <div className="w-full max-w-md leather-card border border-gold-500/20 rounded-2xl p-4 mb-6 stitched">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-semibold tracking-wider text-gold-400 uppercase flex items-center gap-1">
            Mise:
            <Star className="w-3.5 h-3.5 fill-gold-400" />
            {matchData.stakeTokens}
          </div>
          <div className="text-2xl font-black tabular-nums bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20">
            {timeLeft}s
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-black/40 p-3 rounded-xl border border-leather-700">
            <p className="text-xs text-leather-400 font-medium">Toi</p>
            <p className="text-3xl font-extrabold text-gold-400">
              {localScore}
            </p>
          </div>
          <div className="bg-black/40 p-3 rounded-xl border border-leather-700">
            <p className="text-xs text-leather-400 font-medium">Adversaire</p>
            <p className="text-3xl font-extrabold text-purple-400">
              {opponentScore}
            </p>
          </div>
        </div>
      </div>

      {gameState === "PLAYING" && (
        <div className="w-full max-w-md aspect-square leather-card border border-gold-500/20 rounded-2xl p-4 flex flex-col justify-between stitched">
          <div className="text-center text-sm font-medium text-leather-300 mb-2">
            Tape:{" "}
            <span className="text-gold-400 font-bold text-lg">
              {nextExpectedNumber}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 flex-1">
            {gridNumbers.map((num, idx) => {
              const isTapped = num < nextExpectedNumber;
              return (
                <motion.button
                  key={`cell-${idx}`}
                  type="button"
                  whileTap={isTapped ? undefined : { scale: 0.92 }}
                  onClick={() => handleNumberClick(num)}
                  disabled={isTapped}
                  className={`w-full aspect-square font-black text-xl rounded-xl transition-all duration-100 flex items-center justify-center ${
                    isTapped
                      ? "bg-black/60 text-leather-600 border border-leather-800 cursor-not-allowed"
                      : "bg-leather-800 text-white border border-leather-600 hover:border-gold-500/50 active:bg-gold-500/20"
                  }`}
                >
                  {!isTapped && num}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {gameState === "FINISHED" && (
        <div className="w-full max-w-md leather-card border border-gold-500/20 rounded-2xl p-8 text-center stitched">
          <h2 className="text-3xl font-black mb-2 tracking-tight text-gold-400">
            FIN DE PARTIE
          </h2>
          <p className="text-leather-300 mb-6">
            Score final: {localScore} vs {opponentScore}
          </p>

          {matchData.winnerId === currentUserId ? (
            <div className="bg-gold-500/10 text-gold-400 font-bold p-4 rounded-xl border border-gold-500/20 text-xl flex items-center justify-center gap-2">
              <Star className="w-6 h-6 fill-gold-400" />
              Victoire! GG Gift de {matchData.stakeTokens * 2} étoiles reçu!
            </div>
          ) : matchData.winnerId === null ? (
            <div className="bg-leather-800 text-leather-200 font-bold p-4 rounded-xl text-xl">
              Égalité — jetons remboursés
            </div>
          ) : (
            <div className="bg-red-500/10 text-red-400 font-bold p-4 rounded-xl border border-red-500/20 text-xl flex items-center justify-center gap-2">
              <Gift className="w-6 h-6" />
              GG Gift de {matchData.stakeTokens} étoiles envoyé au gagnant.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
