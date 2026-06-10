import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Gift, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  submitRoundScore,
  finishMatch,
  type GridRushMatch,
} from "@/services/gridRushService";
import {
  arcadeBackBtn,
  arcadeBtnSecondary,
  arcadeCard,
  arcadeTextCyan,
  arcadeTextMuted,
  arcadeTextYellow,
} from "@/components/arcade/arcade-ui";

interface GridRushGameProps {
  matchId: string;
  currentUserId: string;
  initialMatch: GridRushMatch;
  onExit?: () => void;
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
    isBot: Boolean(row.isBot ?? row.is_bot ?? false),
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
  onExit,
}: GridRushGameProps) {
  const navigate = useNavigate();
  const exit = onExit ?? (() => navigate("/arcade/grid-rush"));
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
        void (async () => {
          for (let attempt = 0; attempt < 4; attempt++) {
            const { data, error } = await finishMatch(matchId);
            if (data) {
              setMatchData(data);
              setGameState("FINISHED");
              return;
            }
            if (error?.includes("pas encore terminée") && attempt < 3) {
              await new Promise((r) => setTimeout(r, 500));
              continue;
            }
            finishCalled.current = false;
            return;
          }
        })();
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
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-white p-4 pt-6">
      <div className="w-full max-w-md flex items-center mb-4">
        <button
          type="button"
          onClick={exit}
          className={arcadeBackBtn}
          aria-label="Quitter la partie"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className={`w-full max-w-md ${arcadeCard} p-4 mb-6`}>
        <div className="flex justify-between items-center mb-4">
          <div
            className={`text-sm font-semibold tracking-wider uppercase flex items-center gap-1 ${arcadeTextYellow}`}
          >
            {matchData.stakeTokens > 0 ? (
              <>
                Mise:
                <Star className="w-3.5 h-3.5 fill-current" />
                {matchData.stakeTokens}
              </>
            ) : (
              "Entraînement gratuit"
            )}
          </div>
          <div className="text-2xl font-black tabular-nums bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20">
            {timeLeft}s
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-black/40 p-3 rounded-sm border border-[rgba(0,243,255,0.3)]">
            <p className={`text-xs font-medium ${arcadeTextMuted}`}>Toi</p>
            <p className={`text-3xl font-extrabold ${arcadeTextCyan}`}>
              {localScore}
            </p>
          </div>
          <div className="bg-black/40 p-3 rounded-sm border border-[rgba(255,43,214,0.3)]">
            <p className={`text-xs font-medium ${arcadeTextMuted}`}>
              Adversaire
            </p>
            <p className={`text-3xl font-extrabold ${arcadeTextYellow}`}>
              {opponentScore}
            </p>
          </div>
        </div>
      </div>

      {gameState === "PLAYING" && (
        <div
          className={`w-full max-w-md aspect-square ${arcadeCard} p-4 flex flex-col justify-between`}
        >
          <div
            className={`text-center text-sm font-medium mb-2 ${arcadeTextMuted}`}
          >
            Tape:{" "}
            <span className={`font-bold text-lg ${arcadeTextYellow}`}>
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
                  className={`w-full aspect-square min-h-[44px] font-black text-xl rounded-sm transition-colors duration-150 flex items-center justify-center cursor-pointer ${
                    isTapped
                      ? "bg-black/60 text-[#4a5568] border border-[#1a1430] cursor-not-allowed"
                      : "bg-[#1a1430] text-white border border-[rgba(0,243,255,0.35)] hover:border-[rgba(0,243,255,0.7)] active:bg-[rgba(0,243,255,0.15)]"
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
        <div
          className={`w-full max-w-md ${arcadeCard} p-8 text-center space-y-5`}
        >
          <Trophy className={`w-12 h-12 mx-auto ${arcadeTextYellow}`} />
          <h2 className="text-lg font-black tracking-tight arcade-font-pixel arcade-title-gradient leading-relaxed">
            FIN DE PARTIE
          </h2>
          <p className={arcadeTextMuted}>
            Score final: {localScore} vs {opponentScore}
          </p>

          {matchData.winnerId === currentUserId ? (
            <div
              className={`bg-[rgba(255,230,0,0.1)] font-bold p-4 rounded-sm border border-[rgba(255,230,0,0.3)] text-lg flex items-center justify-center gap-2 ${arcadeTextYellow}`}
            >
              <Star className="w-6 h-6 fill-current shrink-0" />
              Victoire! GG Gift de {matchData.stakeTokens * 2} étoiles reçu!
            </div>
          ) : matchData.winnerId === null &&
            matchData.player1Score === matchData.player2Score ? (
            <div
              className={`bg-[#1a1430] font-bold p-4 rounded-sm text-lg border border-[rgba(158,180,216,0.3)] ${arcadeTextMuted}`}
            >
              Égalité — jetons remboursés
            </div>
          ) : (
            <div className="bg-red-500/10 text-red-400 font-bold p-4 rounded-xl border border-red-500/20 text-lg flex items-center justify-center gap-2">
              <Gift className="w-6 h-6 shrink-0" />
              GG Gift de {matchData.stakeTokens} étoiles envoyé au gagnant.
            </div>
          )}

          <button type="button" onClick={exit} className={arcadeBtnSecondary}>
            Retour au lobby
          </button>
        </div>
      )}
    </div>
  );
}
