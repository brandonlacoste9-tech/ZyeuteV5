import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GoldEditionSplashProps {
  onComplete: () => void;
  videoSrc?: string;
}

export const GoldEditionSplash: React.FC<GoldEditionSplashProps> = ({
  onComplete,
  videoSrc = "/mgm_intro.mp4",
}) => {
  const [canSkip, setCanSkip] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Show skip button after 2.5 seconds
    const timer = setTimeout(() => setCanSkip(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleEnded = () => {
    setIsExiting(true);
    setTimeout(onComplete, 1000); // Allow fade out animation
  };

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(onComplete, 500);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(20px)" }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="fixed inset-0 z-[10000] bg-black flex items-center justify-center overflow-hidden"
          id="gold-edition-splash"
        >
          {/* Cinema Lighting Gradient */}
          <div className="absolute inset-0 bg-radial-at-center from-transparent via-black/40 to-black pointer-events-none" />

          <video
            ref={videoRef}
            autoPlay
            muted={false}
            playsInline
            onEnded={handleEnded}
            className="w-full h-full object-cover md:object-contain scale-105"
            onError={() => {
              console.warn("Splash video failed to load, skipping...");
              onComplete();
            }}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>

          {/* Overlay Effects */}
          <div className="absolute inset-0 gold-glow-soft pointer-events-none mix-blend-overlay opacity-30" />

          {/* Skip Button */}
          {canSkip && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleSkip}
              className="absolute bottom-8 right-8 px-6 py-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:border-white/40 transition-all text-sm font-light tracking-widest uppercase z-[11000]"
            >
              Skip Intro
            </motion.button>
          )}

          {/* Branding Subtitle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ delay: 5, duration: 2 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/40 text-[10px] tracking-[0.5em] uppercase font-light pointer-events-none"
          >
            Zyeuté AG © 2026 Gold Edition
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
