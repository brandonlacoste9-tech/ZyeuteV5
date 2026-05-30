import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScratchCard } from "./ScratchCard";
import { getCurrentUser, updateProfile } from "../../services/api";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "../Toast";
import type { User } from "@/types";

export const DailyGratteuxModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prize, setPrize] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { impact } = useHaptics();

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      setCurrentUser(user);

      // Check if bonus already claimed today
      const lastBonus = user.last_daily_bonus
        ? new Date(user.last_daily_bonus)
        : null;
      const today = new Date();

      const isSameDay =
        lastBonus &&
        lastBonus.getDate() === today.getDate() &&
        lastBonus.getMonth() === today.getMonth() &&
        lastBonus.getFullYear() === today.getFullYear();

      if (!isSameDay) {
        // Determine prize (Weighted Random)
        const roll = Math.random();
        let amount = 50; // Common
        if (roll > 0.95)
          amount = 500; // Legendary
        else if (roll > 0.8)
          amount = 200; // Rare
        else if (roll > 0.6) amount = 100; // Uncommon

        setPrize(amount);
        // Delay slightly for effect
        setTimeout(() => setIsOpen(true), 2000);
      }
    } catch (e) {
      console.error("Gratteux check failed", e);
    }
  };

  const handleClaim = async () => {
    impact();
    // Celebrate
    toast.success(`Tu as gagné ${prize} FEU! 🔥`);

    // Close modal after delay
    setTimeout(() => {
      setIsOpen(false);
    }, 2500);

    // Update Server
    try {
      if (!currentUser) return;

      await updateProfile({
        last_daily_bonus: new Date().toISOString(),
        coins: (currentUser.coins || 0) + 0, // Coins separate? Or uses Fire Score? Let's assume Fire Score ("Feu")
        fire_score: (currentUser.fire_score || 0) + prize,
      });
    } catch (e) {
      console.error("Failed to save bonus", e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-neutral-900 border-2 border-gold-500 rounded-2xl p-6 shadow-2xl max-w-sm w-full relative stitched"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-gold-400 uppercase tracking-widest drop-shadow-sm">
                Le Gratteux
              </h2>
              <p className="text-stone-400 text-xs mt-1">
                Ton bonus quotidien t'attend!
              </p>
            </div>

            {/* The Card */}
            <div className="flex justify-center mb-6">
              <ScratchCard prizeAmount={prize} onComplete={handleClaim} />
            </div>

            {/* Close button (only visible if stuck?) */}
            {/* Ideally user MUST scratch to close, or click outside? Let's allow outside click maybe not */}

            <p className="text-center text-xs text-stone-600">
              Reviens demain pour un autre essai!
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
