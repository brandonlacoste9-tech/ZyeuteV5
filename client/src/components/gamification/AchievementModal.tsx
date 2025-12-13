/**
 * AchievementModal - Popup when achievement is unlocked
 * Beautiful animation and celebration!
 */

import React, { useEffect, useState } from 'react';
import { Button } from '../Button';
import { cn } from '../../lib/utils';
import type { Achievement } from '../../services/achievementService';

interface AchievementModalProps {
  achievement: Achievement | null;
  onClose: () => void;
  onShare?: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({
  achievement,
  onClose,
  onShare,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
    }
  }, [achievement]);

  if (!achievement) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-500 via-orange-500 to-red-500';
      case 'epic':
        return 'from-purple-500 via-pink-500 to-purple-600';
      case 'rare':
        return 'from-blue-500 via-cyan-500 to-blue-600';
      case 'uncommon':
        return 'from-green-500 via-emerald-500 to-green-600';
      default:
        return 'from-gray-500 via-gray-600 to-gray-700';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'LÉGENDAIRE';
      case 'epic':
        return 'ÉPIQUE';
      case 'rare':
        return 'RARE';
      case 'uncommon':
        return 'PEU COMMUN';
      default:
        return 'COMMUN';
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleClose}
    >
      {/* Confetti-like particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            {['⚜️', '🍁', '🔥', '✨', '⭐', '💎'][Math.floor(Math.random() * 6)]}
          </div>
        ))}
      </div>

      {/* Modal Content */}
      <div
        className={cn(
          'relative w-full max-w-md mx-4 transform transition-all duration-500',
          isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Rarity Glow */}
        <div
          className={cn(
            'absolute inset-0 rounded-3xl blur-3xl opacity-50 animate-pulse',
            `bg-gradient-to-r ${getRarityColor(achievement.rarity)}`
          )}
        />

        {/* Card */}
        <div className="relative bg-gradient-to-b from-gray-900 to-black rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10">
          {/* Header */}
          <div className="relative p-8 text-center">
            {/* Rarity Badge */}
            <div className="inline-block mb-4">
              <div
                className={cn(
                  'px-4 py-1 rounded-full text-xs font-bold text-white',
                  `bg-gradient-to-r ${getRarityColor(achievement.rarity)}`
                )}
              >
                {getRarityLabel(achievement.rarity)}
              </div>
            </div>

            {/* Achievement Icon */}
            <div className="relative inline-block mb-4">
              <div
                className={cn(
                  'w-32 h-32 rounded-full flex items-center justify-center text-6xl',
                  `bg-gradient-to-br ${getRarityColor(achievement.rarity)}`,
                  'shadow-2xl animate-bounce-slow'
                )}
              >
                {achievement.icon}
              </div>
              
              {/* Sparkles */}
              <div className="absolute -top-2 -right-2 text-3xl animate-ping">✨</div>
              <div className="absolute -bottom-2 -left-2 text-3xl animate-ping delay-300">⭐</div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-2">
              Accomplissement Débloqué!
            </h2>
            <h3 className="text-2xl font-bold text-gold-400 mb-3">
              {achievement.name_fr}
            </h3>
            <p className="text-white/70 text-sm mb-4 px-4">
              {achievement.description}
            </p>

            {/* Rewards */}
            <div className="flex items-center justify-center gap-6 py-4 px-6 bg-white/5 rounded-xl">
              {achievement.points > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div className="text-left">
                    <p className="text-xs text-white/60">Points</p>
                    <p className="text-xl font-bold text-gold-400">
                      +{achievement.points}
                    </p>
                  </div>
                </div>
              )}

              {achievement.reward_cennes > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <div className="text-left">
                    <p className="text-xs text-white/60">Cennes</p>
                    <p className="text-xl font-bold text-gold-400">
                      +{achievement.reward_cennes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {achievement.reward_description && (
              <p className="text-white/60 text-xs mt-3 italic">
                {achievement.reward_description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 pt-0 flex gap-3">
            {onShare && (
              <Button
                variant="outline"
                className="flex-1 bg-gradient-to-r from-gold-600 to-yellow-600 hover:from-gold-700 hover:to-yellow-700 border-0"
                onClick={() => {
                  onShare();
                  handleClose();
                }}
              >
                <span className="mr-2">🎉</span>
                Partager
              </Button>
            )}
            <Button
              variant="primary"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={handleClose}
            >
              Continuer
            </Button>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
};

// Global Achievement Listener Component
export const AchievementListener: React.FC = () => {
  const [achievement, setAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    const handleAchievement = (event: CustomEvent<Achievement>) => {
      setAchievement(event.detail);
    };

    window.addEventListener('achievement-unlocked' as any, handleAchievement);

    return () => {
      window.removeEventListener('achievement-unlocked' as any, handleAchievement);
    };
  }, []);

  const handleShare = () => {
    if (achievement) {
      const text = `🏆 J'ai débloqué "${achievement.name_fr}" sur Zyeuté! ${achievement.icon}`;
      if (navigator.share) {
        navigator.share({
          title: 'Accomplissement Zyeuté',
          text,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(text);
        alert('Copié dans le presse-papiers!');
      }
    }
  };

  return (
    <AchievementModal
      achievement={achievement}
      onClose={() => setAchievement(null)}
      onShare={handleShare}
    />
  );
};

export default AchievementModal;

