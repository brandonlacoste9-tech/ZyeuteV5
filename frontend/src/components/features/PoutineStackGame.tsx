import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  Flame,
  Trophy,
  Timer,
  ArrowDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

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
  const [currentX, setCurrentX] = useState(50); // 0-100
  const [direction, setDirection] = useState(1); // 1 or -1
  const [speed, setSpeed] = useState(2);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gameLoopRef = useRef<number | null>(null);

  // Base width of pieces (decreases as you go up)
  const getPieceWidth = (count: number) => Math.max(10, 40 - count * 1.5);

  const startNewGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setPieces([]);
    setSpeed(2);
    setTimeLeft(60);
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
      return;
    }

    setPieces((prev) => [...prev, newPiece]);
    setScore((s) => s + 1);
    setSpeed((sp) => Math.min(sp + 0.15, 6)); // Increase speed
  }, [isPlaying, isGameOver, currentX, score, pieces]);

  // Movement loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const move = () => {
      setCurrentX((prev) => {
        let next = prev + speed * direction;
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
    setIsSubmitting(true);
    try {
      await axios.post("/api/royale/submit", {
        tournamentId,
        score: score,
        layers: pieces.length,
      });
      navigate("/arcade");
    } catch (error) {
      console.error("Failed to submit score:", error);
      alert("Erreur lors de la soumission. T'as p-e pas payé l'entrée?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="h-screen bg-black text-white relative flex flex-col overflow-hidden touch-none"
      onClick={handleTap}
    >
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-30 bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="text-gold-400 w-5 h-5" />
            <span className="text-zinc-500 font-bold tracking-widest text-xs uppercase">
              Score
            </span>
          </div>
          <div className="text-5xl font-black italic tracking-tighter tabular-nums">
            {score}
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            <Timer className="text-purple-400 w-5 h-5" />
            <span className="text-zinc-500 font-bold tracking-widest text-xs uppercase">
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
      <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black">
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
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8"
          >
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(239,68,68,0.5)]">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>

            <h2 className="text-5xl font-black italic tracking-tighter mb-2">
              OUPELAYE!
            </h2>
            <p className="text-zinc-500 font-bold mb-12 text-center text-xl">
              Ta poutine a revollé.{" "}
              {score > 10 ? "Pas pire pentoute!" : "Y'en a manqué un boute."}
            </p>

            <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] w-full max-w-sm mb-12">
              <div className="flex justify-between items-center mb-4">
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                  Score Final
                </span>
                <span className="text-3xl font-black text-gold-400">
                  {score}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                  Rang Mondial
                </span>
                <span className="text-3xl font-black text-purple-400">#42</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-sm">
              <button
                onClick={submitScore}
                disabled={isSubmitting}
                className="bg-purple-600 h-16 rounded-[24px] font-black italic tracking-tighter text-xl hover:bg-purple-500 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? "SOUCOUPAGE..." : "SOUMETTRE LE SCORE"}{" "}
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                onClick={startNewGame}
                className="bg-white text-black h-16 rounded-[24px] font-black italic tracking-tighter text-xl hover:bg-zinc-200 transition-colors"
              >
                RÉESSAYER
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Screen */}
      {!isPlaying && !isGameOver && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center p-8">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="text-8xl mb-8"
          >
            🍟
          </motion.div>
          <h1 className="text-6xl font-black italic tracking-tighter mb-4 text-center">
            POUTINE STACK
          </h1>
          <p className="text-zinc-500 font-bold mb-12 text-center max-w-xs">
            Stack le plus haut possible sans tout faire revollé par terre.
          </p>
          <button
            onClick={startNewGame}
            className="bg-gold-500 text-black px-12 py-5 rounded-[24px] font-black italic tracking-tighter text-2xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,191,0,0.4)]"
          >
            START GAME
          </button>
        </div>
      )}
    </div>
  );
};

export default PoutineStackGame;
