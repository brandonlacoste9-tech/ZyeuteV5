import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";
import { Button } from "../ui/button";

interface ScratchCardProps {
  prizeAmount: number;
  onComplete: () => void;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({
  prizeAmount,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Draw the "Silver" coating
    ctx.fillStyle = "#C0C0C0"; // Silver
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some texture/text to the coating
    ctx.fillStyle = "#A0A0A0";
    ctx.font = '20px "Courier New", monospace';
    // Center text roughly
    ctx.fillText("GRATTEZ ICI", 60, 85);
    ctx.fillText("???", 110, 110);

    // Pattern for realism
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#B0B0B0" : "#D0D0D0";
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        5,
        5,
      );
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isRevealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    // 2. The "Scratch" Logic (Erasing the silver)
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // 3. Calculate Progress
    checkProgress();
  };

  const checkProgress = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 128) transparent++;
    }

    const percent = (transparent / (pixels.length / 4)) * 100;
    setScratchPercent(percent);

    if (percent > 50 && !isRevealed) {
      setIsRevealed(true);
      onComplete(); // Trigger the reward logic
    }
  };

  return (
    <div className="relative w-64 h-40 rounded-xl overflow-hidden shadow-2xl border-4 border-gold-500 bg-gradient-to-br from-gold-100 to-gold-300 mx-auto select-none touch-none">
      {/* The Prize (Hidden Layer) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-0 animate-in fade-in zoom-in duration-500">
        <Trophy className="w-12 h-12 text-yellow-600 mb-2" />
        <h3 className="text-3xl font-black text-red-600 drop-shadow-md">
          +{prizeAmount} FEU
        </h3>
        <p className="text-xs text-yellow-800 font-bold uppercase mt-1">
          C'est gagnant!
        </p>
      </div>

      {/* The Scratch Layer (Canvas) */}
      <canvas
        ref={canvasRef}
        width={256}
        height={160}
        className={`absolute inset-0 z-10 cursor-crosshair transition-opacity duration-700 ${isRevealed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
      />

      {isRevealed && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
          <Sparkles className="w-full h-full text-yellow-400 animate-pulse opacity-50" />
        </div>
      )}
    </div>
  );
};
