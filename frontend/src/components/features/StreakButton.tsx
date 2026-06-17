import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";
import confetti from "canvas-confetti";

export const StreakButton: React.FC = () => {
  const [hasClaimedToday, setHasClaimedToday] = useState<boolean>(true);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [nextReward, setNextReward] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const { tap, impact, success } = useHaptics();

  useEffect(() => {
    async function checkStreak() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_APP_URL || ""}/api/streaks/status`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setHasClaimedToday(data.hasClaimedToday);
          setCurrentStreak(data.currentStreak);
          setNextReward(data.nextReward);
        }
      } catch (e) {
        console.error("Failed to fetch streak status:", e);
      } finally {
        setIsLoading(false);
      }
    }

    checkStreak();
  }, []);

  const handleClaim = async () => {
    tap();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`${import.meta.env.VITE_APP_URL || ""}/api/streaks/claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setHasClaimedToday(true);
        setCurrentStreak(data.currentStreak);
        
        // Huge Confetti + Haptics
        success();
        impact();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#FFDF00', '#FF4500']
        });

        toast.success(`Bonus réclamé: +${data.reward} Cennes! 🔥`);
        setShowModal(true); // show the progression modal
      } else {
        const error = await res.json();
        toast.error(error.error || "Impossible de réclamer le bonus");
      }
    } catch (e) {
      console.error("Failed to claim streak:", e);
      toast.error("Erreur de connexion");
    }
  };

  if (isLoading || hasClaimedToday) return null;

  return (
    <>
      <button
        onClick={handleClaim}
        className="relative flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-sm shadow-[0_0_15px_rgba(255,69,0,0.6)] animate-pulse transition-transform hover:scale-105"
      >
        <span>🔥</span>
        <span>Bonus</span>
      </button>

      {/* Basic Modal for Progression visualization */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-leather-900 border border-gold-500/50 rounded-2xl p-6 max-w-sm w-full text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gold-500/5 mix-blend-overlay pointer-events-none" />
            
            <h2 className="text-3xl font-black text-gold-400 mb-2">🔥 {currentStreak} Jours!</h2>
            <p className="text-leather-300 mb-6">Tu es en feu! Reviens demain pour continuer ta séquence.</p>

            <div className="flex justify-between items-center mb-6">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const dayInCycle = ((currentStreak - 1) % 7) + 1;
                const isCompleted = day <= dayInCycle;
                const isJackpot = day === 7;
                
                return (
                  <div key={day} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isCompleted ? (isJackpot ? 'bg-gold-500 text-black shadow-[0_0_10px_rgba(212,175,55,0.8)]' : 'bg-orange-500 text-white') : 'bg-white/10 text-white/40'}`}>
                      {isCompleted ? '✓' : day}
                    </div>
                    {isJackpot && <span className="text-[10px] text-gold-400">100¢</span>}
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => setShowModal(false)}
              className="w-full py-3 rounded-xl bg-gold-gradient text-black font-bold text-lg"
            >
              C'est malade!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
