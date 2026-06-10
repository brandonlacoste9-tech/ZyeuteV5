import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  Timer,
  ArrowDown,
  ChevronRight,
  AlertCircle,
  Coins,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { ArcadeBackdrop } from "@/components/arcade/ArcadeBackdrop";
import {
  arcadeBackBtn,
  arcadeBtnPrimary,
  arcadeBtnSecondary,
  arcadeCard,
  arcadeTextCyan,
  arcadeTextMagenta,
  arcadeTextMuted,
  arcadeTextYellow,
} from "@/components/arcade/arcade-ui";
import { useAuth } from "@/contexts/AuthContext";
import { ParentalService } from "@/services/parental-service";
import { useHaptics } from "@/hooks/useHaptics";
import {
  getTodayTournament,
  submitScore as submitRoyaleScore,
} from "@/services/royaleService";

interface Piece {
  id: number;
  type: "fries" | "cheese" | "gravy";
  x: number;
  width: number;
  success: boolean;
}

export const PoutineStackGame: React.FC = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [currentX, setCurrentX] = useState(50);
  const [direction, setDirection] = useState(1);
  const [speed, setSpeed] = useState(2);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [finalRank, setFinalRank] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [reward, setReward] = useState(0);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [restriction, setRestriction] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [visualBuzz, setVisualBuzz] = useState(false);
  const { user } = useAuth();
  const { tap, impact, error: hapticError } = useHaptics();

  const gameLoopRef = useRef<number | null>(null);

  // Check Parental Restrictions
  useEffect(() => {
    const checkRestrictions = async () => {
      if (user?.parentId || user?.parent_id) {
        const status = await ParentalService.checkParentalStatus(user.id);
        if (!status.allowed) {
          setRestriction(status.reason || "Accès restreint");
        }
      }
    };
    checkRestrictions();
  }, [user]);

  // Base width of pieces (decreases as you go up)
  const getPieceWidth = (count: number) => Math.max(10, 40 - count * 1.5);

  const startNewGame = () => {
    if (restriction) return;
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setPieces([]);
    setSpeed(2);
    setTimeLeft(60);
    setSubmitted(false);
    setFinalRank(null);
    setIsNewBest(false);
    setReward(0);
    setSubmitError(null);
    tap();
  };

  const handleTap = useCallback(() => {
    if (!isPlaying || isGameOver) return;

    const width = getPieceWidth(score);
    const prevPiece = pieces[pieces.length - 1];

    let success = true;
    if (prevPiece) {
      // Check for overlap
      const overlapStart = Math.max(currentX, prevPiece.x);
      const overlapEnd = Math.min(
        currentX + width,
        prevPiece.x + prevPiece.width,
      );

      if (overlapEnd <= overlapStart) {
        success = false;
      }
    }

    const newPiece: Piece = {
      id: Date.now(),
      type: score % 3 === 0 ? "fries" : score % 3 === 1 ? "cheese" : "gravy",
      x: currentX,
      width: width,
      success,
    };

    if (!success) {
      setIsGameOver(true);
      setIsPlaying(false);
      hapticError();
      return;
    }

    setPieces((prev) => [...prev, newPiece]);
    setScore((s) => s + 1);
    impact();
    setVisualBuzz(true);
    setTimeout(() => setVisualBuzz(false), 300);
    setSpeed((sp) => Math.min(sp + 0.15, 6)); // Increase speed
  }, [isPlaying, isGameOver, currentX, score, pieces]);

  // Movement loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const move = () => {
      setCurrentX((prev) => {
        const next = prev + speed * direction;
        if (next >= 100 - getPieceWidth(score)) {
          setDirection(-1);
          return 100 - getPieceWidth(score);
        }
        if (next <= 0) {
          setDirection(1);
          return 0;
        }
        return next;
      });
      gameLoopRef.current = requestAnimationFrame(move);
    };

    gameLoopRef.current = requestAnimationFrame(move);
    return () => cancelAnimationFrame(gameLoopRef.current!);
  }, [isPlaying, isGameOver, speed, direction, score]);

  // Timer
  useEffect(() => {
    if (!isPlaying || isGameOver || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [isPlaying, isGameOver, timeLeft]);

  const submitScore = async () => {
    if (submitted) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Get today's tournament if tournamentId not provided via URL
      let tid = tournamentId;
      if (!tid) {
        const t = await getTodayTournament();
        tid = t?.id;
      }
      if (!tid) throw new Error("Tournoi introuvable");

      const { result, error } = await submitRoyaleScore({
        tournamentId: tid,
        score,
        layers: pieces.length,
        metadata: { playedAt: new Date().toISOString() },
      });

      if (error || !result) {
        throw new Error(error || "Erreur lors de la soumission");
      }

      setFinalRank(result.rank ?? null);
      setIsNewBest(result.isNewBest);
      setReward(result.reward);
      setTokenBalance(result.tokenBalance);
      setSubmitted(true);
    } catch (error: unknown) {
      console.error("Failed to submit score:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la soumission. Réessaie dans un instant.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ArcadeBackdrop
      scanlines={false}
      className="fixed inset-0 z-[100] h-[100dvh] w-full overflow-hidden touch-none"
    >
      <div
        className="flex-1 min-h-0 relative flex flex-col overflow-hidden touch-none"
        onClick={handleTap}
      >
        {/* HUD */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-30 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className={`w-5 h-5 ${arcadeTextYellow}`} />
              <span
                className={`font-bold tracking-widest text-xs uppercase ${arcadeTextMuted}`}
              >
                Score
              </span>
            </div>
            <div
              className={`text-5xl font-black tracking-tighter tabular-nums transition-all duration-300 ${visualBuzz ? `${arcadeTextYellow} scale-110` : "text-white"}`}
            >
              {score}
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <Timer className={`w-5 h-5 ${arcadeTextCyan}`} />
              <span
                className={`font-bold tracking-widest text-xs uppercase ${arcadeTextMuted}`}
              >
                Temps
              </span>
            </div>
            <div
              className={`text-4xl font-black tabular-nums ${timeLeft < 10 ? "text-red-500 animate-pulse" : ""}`}
            >
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a1430]/80 to-black">
          {/* Dynamic Background Grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Stack Container */}
          <div className="absolute bottom-0 left-0 right-0 h-[70%] px-10 flex flex-col-reverse items-center pb-20">
            <AnimatePresence>
              {pieces.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ y: -500, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  style={{
                    left: `${p.x}%`,
                    width: `${p.width}%`,
                    height: "40px",
                  }}
                  className={`absolute rounded-xl border-2 flex items-center justify-center font-black italic text-xs ${
                    p.type === "fries"
                      ? "bg-amber-500 border-amber-300 text-amber-900"
                      : p.type === "cheese"
                        ? "bg-white border-zinc-300 text-zinc-900"
                        : "bg-amber-900 border-amber-700 text-amber-100"
                  }`}
                >
                  {p.type.toUpperCase()}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Base */}
            <div className="w-full h-4 bg-zinc-800 rounded-full border border-white/10" />
          </div>

          {/* Floating Piece (The Slider) */}
          {!isGameOver && isPlaying && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 h-10 rounded-xl border-2 transition-colors flex items-center justify-center font-black italic text-xs shadow-2xl ${
                score % 3 === 0
                  ? "bg-amber-500 border-amber-300 text-amber-900 shadow-amber-500/50"
                  : score % 3 === 1
                    ? "bg-white border-zinc-300 text-zinc-900 shadow-white/50"
                    : "bg-amber-900 border-amber-700 text-amber-100 shadow-amber-900/50"
              }`}
              style={{
                left: `${currentX}%`,
                width: `${getPieceWidth(score)}%`,
              }}
            >
              {score % 3 === 0 ? "FRIES" : score % 3 === 1 ? "CHEESE" : "GRAVY"}
            </div>
          )}
        </div>

        {/* Interaction Hint */}
        {isPlaying && !isGameOver && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-30 pointer-events-none">
            <span className="font-bold text-xs uppercase tracking-widest mb-2">
              Tape pour Lâcher
            </span>
            <ArrowDown className="w-6 h-6" />
          </div>
        )}

        {/* Game Over Screen */}
        <AnimatePresence>
          {isGameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-50 bg-black/92 backdrop-blur-xl flex flex-col items-center justify-center p-8"
            >
              <div className="w-20 h-20 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>

              <h2 className="text-sm sm:text-base font-black tracking-tight mb-2 arcade-font-pixel arcade-title-gradient leading-relaxed">
                OUPELAYE!
              </h2>
              <p
                className={`font-medium mb-10 text-center text-lg max-w-sm ${arcadeTextMuted}`}
              >
                Ta poutine a revollé.{" "}
                {score > 10 ? "Pas pire pentoute!" : "Y'en a manqué un boute."}
              </p>

              <div
                className={`${arcadeCard} p-6 w-full max-w-sm mb-10 space-y-4`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`font-bold uppercase tracking-widest text-xs ${arcadeTextMuted}`}
                  >
                    Score final
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-3xl font-black tabular-nums ${arcadeTextYellow}`}
                    >
                      {score}
                    </span>
                    {isNewBest && submitted && (
                      <span
                        className={`text-[10px] bg-[rgba(255,230,0,0.15)] border border-[rgba(255,230,0,0.35)] px-2 py-0.5 rounded-sm font-bold uppercase ${arcadeTextYellow}`}
                      >
                        Record
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`font-bold uppercase tracking-widest text-xs ${arcadeTextMuted}`}
                  >
                    Classement
                  </span>
                  <span
                    className={`text-3xl font-black tabular-nums ${arcadeTextYellow}`}
                  >
                    {finalRank != null ? `#${finalRank}` : "—"}
                  </span>
                </div>

                {submitted && (
                  <div className="pt-4 border-t border-[rgba(255,230,0,0.2)] space-y-2">
                    {reward > 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-between"
                      >
                        <span
                          className={`font-bold uppercase tracking-widest text-xs ${arcadeTextMuted}`}
                        >
                          Cadeau GG
                        </span>
                        <span
                          className={`flex items-center gap-1.5 text-xl font-black ${arcadeTextYellow}`}
                        >
                          <Coins className="w-5 h-5" />+{reward}
                        </span>
                      </motion.div>
                    ) : (
                      <p className={`text-center text-xs ${arcadeTextMuted}`}>
                        Bats ton record du jour pour gagner des jetons!
                      </p>
                    )}
                    {tokenBalance != null && (
                      <p
                        className={`text-center text-xs tabular-nums ${arcadeTextMuted}`}
                      >
                        Solde : {tokenBalance} jetons
                      </p>
                    )}
                  </div>
                )}
              </div>

              {submitError && (
                <p className="text-red-400 text-sm text-center mb-4 max-w-sm px-4">
                  {submitError}
                </p>
              )}

              <div className="flex flex-col gap-3 w-full max-w-sm">
                {!submitted ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void submitScore();
                    }}
                    disabled={isSubmitting}
                    className={`${arcadeBtnPrimary} flex items-center justify-center gap-2 disabled:opacity-50`}
                  >
                    {isSubmitting ? "Soumission..." : "Soumettre le score"}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/arcade/poutine");
                    }}
                    className={`${arcadeBtnPrimary} flex items-center justify-center gap-2`}
                  >
                    Voir le classement
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startNewGame();
                  }}
                  className={arcadeBtnSecondary}
                >
                  Réessayer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Screen */}
        {!isPlaying && !isGameOver && !restriction && (
          <div className="absolute inset-0 z-40 bg-black/95 flex flex-col items-center justify-center p-8">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/arcade/poutine");
              }}
              className={`absolute top-6 left-6 ${arcadeBackBtn}`}
              aria-label="Retour au lobby"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className={`arcade-icon-well mb-8 ${arcadeTextMagenta}`}
            >
              <Layers className="w-10 h-10" />
            </motion.div>
            <h1 className="text-sm sm:text-base font-black tracking-tight mb-3 text-center arcade-font-pixel arcade-title-gradient leading-relaxed">
              Poutine Stack
            </h1>
            <div className="border border-[rgba(255,43,214,0.45)] bg-[rgba(255,43,214,0.1)] px-4 py-1 rounded-sm mb-6">
              <span
                className={`font-bold text-[10px] tracking-[0.2em] uppercase ${arcadeTextMagenta}`}
              >
                Tournoi du jour
              </span>
            </div>
            <p
              className={`text-sm mb-10 text-center max-w-xs leading-relaxed ${arcadeTextMuted}`}
            >
              Stack le plus haut possible sans tout faire revollé par terre. 60
              secondes chrono.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startNewGame();
              }}
              className={`${arcadeBtnPrimary} max-w-xs px-10`}
            >
              Commencer
            </button>
          </div>
        )}

        {/* Parental Restriction Screen */}
        {restriction && (
          <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-[rgba(255,230,0,0.1)] rounded-sm flex items-center justify-center mb-8 border border-[rgba(255,230,0,0.4)]">
              <AlertCircle className={`w-10 h-10 ${arcadeTextYellow}`} />
            </div>
            <h2
              className={`text-lg font-black tracking-tight mb-4 uppercase arcade-font-pixel ${arcadeTextYellow}`}
            >
              Accès bloqué
            </h2>
            <p
              className={`text-sm mb-8 p-4 border border-[rgba(255,230,0,0.25)] bg-[rgba(255,230,0,0.05)] rounded-sm max-w-sm ${arcadeTextMuted}`}
            >
              {restriction}
            </p>
            <p className={`text-sm max-w-xs mb-10 ${arcadeTextMuted}`}>
              Tes parents ont mis en place des limites de sécurité. Reviens plus
              tard!
            </p>
            <button
              type="button"
              onClick={() => navigate("/arcade")}
              className={`${arcadeBtnSecondary} max-w-xs`}
            >
              Retour à l&apos;arcade
            </button>
          </div>
        )}
      </div>
    </ArcadeBackdrop>
  );
};

export default PoutineStackGame;
