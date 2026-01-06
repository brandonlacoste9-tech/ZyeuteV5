import React, { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Trophy, AlertTriangle, RotateCcw, Home, Coins } from "lucide-react";

interface Layer {
  width: number;
  x: number;
  type: "tray" | "fries" | "curds" | "gravy";
}

const LAYER_TYPES: Layer["type"][] = ["fries", "curds", "gravy"];
const COLORS = {
  tray: "#475569", // Slate 600
  fries: "#EAB308", // Yellow 500
  curds: "#F8FAFC", // Slate 50
  gravy: "#78350F", // Amber 900
};

const PoutineStackGame: React.FC = () => {
  const [, params] = useRoute("/royale/play/:tournamentId");
  const [, setLocation] = useLocation();
  const tournamentId = params?.tournamentId;

  const [layers, setLayers] = useState<Layer[]>([
    { width: 80, x: 10, type: "tray" }, // Starting tray
  ]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const requestRef = useRef<number>(null);
  const speed = useRef(0.5);

  // Game Loop for the moving layer
  useEffect(() => {
    if (gameOver) return;

    const animate = () => {
      setCurrentX((prev) => {
        const next = prev + direction * speed.current;
        if (next > 100 - layers[layers.length - 1].width) {
          setDirection(-1);
          return 100 - layers[layers.length - 1].width;
        }
        if (next < 0) {
          setDirection(1);
          return 0;
        }
        return next;
      });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [gameOver, direction, layers]);

  const dropLayer = () => {
    if (gameOver) return;

    const topLayer = layers[layers.length - 1];
    const dropX = currentX;
    const dropWidth = topLayer.width;

    // Calculate overlap
    const leftEdge = Math.max(dropX, topLayer.x);
    const rightEdge = Math.min(dropX + dropWidth, topLayer.x + topLayer.width);
    const overlap = rightEdge - leftEdge;

    if (overlap <= 0) {
      setGameOver(true);
      submitScore();
      return;
    }

    // Add new layer with the clipped width
    const nextType = LAYER_TYPES[score % LAYER_TYPES.length];
    setLayers((prev) => [
      ...prev,
      {
        width: overlap,
        x: leftEdge,
        type: nextType,
      },
    ]);
    setScore((prev) => prev + 1);

    // Increase difficulty
    speed.current += 0.05;
  };

  const submitScore = async () => {
    try {
      setSubmitting(true);
      await axios.post("/api/royale/submit", {
        tournamentId,
        score,
        layers,
      });
    } catch (err) {
      console.error("Failed to submit score", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-end overflow-hidden select-none touch-none"
      onClick={dropLayer}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500 rounded-full blur-[150px]" />
      </div>

      {/* Score HUD */}
      <div className="absolute top-12 flex flex-col items-center gap-1 z-20 pointer-events-none">
        <span className="text-xs font-mono text-purple-400 tracking-[0.3em] uppercase">
          Current Stack
        </span>
        <span className="text-7xl font-black text-white italic">{score}</span>
      </div>

      {/* Game Area */}
      <div className="relative w-full max-w-md h-[70vh] mb-20 border-x border-slate-900">
        {/* Stack View */}
        <div
          className="absolute bottom-0 w-full flex flex-col-reverse transition-transform duration-500"
          style={{
            transform: `translateY(${Math.max(0, (layers.length - 10) * 20)}px)`,
          }}
        >
          {layers.map((layer, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              className="h-5 rounded-sm shadow-sm"
              style={{
                width: `${layer.width}%`,
                left: `${layer.x}%`,
                backgroundColor: COLORS[layer.type],
                position: "relative",
              }}
            />
          ))}

          {/* Moving Layer */}
          {!gameOver && (
            <div
              className="h-5 rounded-sm shadow-lg brightness-110"
              style={{
                width: `${layers[layers.length - 1].width}%`,
                left: `${currentX}%`,
                backgroundColor:
                  COLORS[LAYER_TYPES[score % LAYER_TYPES.length]],
                position: "absolute",
                top: -20,
                boxShadow: `0 0 15px ${COLORS[LAYER_TYPES[score % LAYER_TYPES.length]]}66`,
              }}
            />
          )}
        </div>
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-6 px-12"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-purple-500/50 rounded-[40px] p-8 text-center shadow-[0_0_50px_rgba(168,85,247,0.2)]"
            >
              <div className="w-20 h-20 bg-purple-500 rounded-full mx-auto flex items-center justify-center mb-6">
                <Trophy className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl font-black text-white italic uppercase mb-2">
                Game Over!
              </h2>
              <p className="text-slate-400 font-mono text-sm uppercase tracking-widest mb-8">
                Base Breached
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-tighter">
                    Stack Height
                  </span>
                  <span className="text-2xl font-bold text-white">{score}</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-tighter">
                    Status
                  </span>
                  <span className="text-xs font-bold text-purple-400 uppercase">
                    {submitting ? "Syncing..." : "Saved"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-white text-black font-black uppercase rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Try Again
                </button>
                <button
                  onClick={() => setLocation("/arcade")}
                  className="w-full py-4 bg-slate-800 text-white font-black uppercase rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Lobby
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap Instruction */}
      {!gameOver && score === 0 && (
        <motion.div
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-40 text-slate-500 font-mono text-[10px] tracking-[0.5em] uppercase w-full text-center"
        >
          Tap to Stack
        </motion.div>
      )}
    </div>
  );
};

export default PoutineStackGame;
