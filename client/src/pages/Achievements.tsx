/**
 * Achievements Page - View all Quebec-themed achievements
 * Track progress, tier, and unlock rewards
 */

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import {
  getAllAchievements,
  getUserAchievements,
  getAchievementStats,
  getUserTier,
  type Achievement,
  type UserAchievement,
  type AchievementCategory,
  type TierInfo,
} from '../services/achievementService';

const achievementsLogger = logger.withContext('Achievements');

export const Achievements: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [filter, setFilter] = useState<'all' | AchievementCategory>('all');
  const [sortBy, setSortBy] = useState<'rarity' | 'points' | 'earned'>('earned');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUser(user);

      const [achievements, userAchs, statsData, tier] = await Promise.all([
        getAllAchievements(),
        getUserAchievements(user.id),
        getAchievementStats(user.id),
        getUserTier(user.id),
      ]);

      setAllAchievements(achievements);
      setUserAchievements(userAchs);
      setStats(statsData);
      setTierInfo(tier);
    } catch (error) {
      achievementsLogger.error('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isEarned = (achievementId: string) => {
    return userAchievements.some(
      (ua) => ua.achievement_id === achievementId && ua.is_earned
    );
  };

  const getFilteredAchievements = () => {
    let filtered = allAchievements;

    if (filter !== 'all') {
      filtered = filtered.filter((a) => a.category === filter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'earned') {
        const aEarned = isEarned(a.id);
        const bEarned = isEarned(b.id);
        if (aEarned !== bEarned) return aEarned ? -1 : 1;
      } else if (sortBy === 'points') {
        return b.points - a.points;
      } else if (sortBy === 'rarity') {
        const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
      }
      return 0;
    });

    return filtered;
  };

  const filteredAchievements = getFilteredAchievements();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold-400 animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title="🏆 Accomplissements" showBack={true} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tier Card */}
        {tierInfo && (
          <div className="card-edge p-6 mb-6 bg-gradient-to-br from-gold-900/20 to-purple-900/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-500 to-yellow-600 flex items-center justify-center text-4xl shadow-lg">
                  {tierInfo.icon}
                </div>
                <div>
                  <p className="text-white/60 text-sm">Rang Actuel</p>
                  <h2 className="text-white text-2xl font-bold">{tierInfo.name}</h2>
                  <p className="text-gold-400 text-sm font-semibold">
                    {stats?.total_points || 0} points
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm">Accomplissements</p>
                <p className="text-white text-3xl font-bold">
                  {stats?.earned_count || 0}/{stats?.total_achievements || 0}
                </p>
                <p className="text-gold-400 text-xs">
                  {stats?.completion_percentage || 0}% complété
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {tierInfo.next_tier && tierInfo.points_to_next !== undefined && (
              <div>
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>Vers {tierInfo.next_tier}</span>
                  <span>{tierInfo.points_to_next} points restants</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold-500 to-yellow-600 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((stats?.total_points - tierInfo.min_points) /
                          (tierInfo.max_points - tierInfo.min_points)) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card-edge p-4 text-center">
            <p className="text-3xl mb-1">🏆</p>
            <p className="text-white text-2xl font-bold">{stats?.earned_count || 0}</p>
            <p className="text-white/60 text-xs">Débloqués</p>
          </div>
          <div className="card-edge p-4 text-center">
            <p className="text-3xl mb-1">⭐</p>
            <p className="text-white text-2xl font-bold">{stats?.total_points || 0}</p>
            <p className="text-white/60 text-xs">Points</p>
          </div>
          <div className="card-edge p-4 text-center">
            <p className="text-3xl mb-1">🎯</p>
            <p className="text-white text-2xl font-bold">{stats?.completion_percentage || 0}%</p>
            <p className="text-white/60 text-xs">Complété</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-4 py-2 rounded-xl whitespace-nowrap transition-colors',
                filter === 'all'
                  ? 'bg-gold-500 text-black font-bold'
                  : 'bg-white/5 text-white hover:bg-white/10'
              )}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('cultural')}
              className={cn(
                'px-4 py-2 rounded-xl whitespace-nowrap transition-colors',
                filter === 'cultural'
                  ? 'bg-gold-500 text-black font-bold'
                  : 'bg-white/5 text-white hover:bg-white/10'
              )}
            >
              🍁 Culturel
            </button>
            <button
              onClick={() => setFilter('regional')}
              className={cn(
                'px-4 py-2 rounded-xl whitespace-nowrap transition-colors',
                filter === 'regional'
                  ? 'bg-gold-500 text-black font-bold'
                  : 'bg-white/5 text-white hover:bg-white/10'
              )}
            >
              ⚜️ Régional
            </button>
            <button
              onClick={() => setFilter('engagement')}
              className={cn(
                'px-4 py-2 rounded-xl whitespace-nowrap transition-colors',
                filter === 'engagement'
                  ? 'bg-gold-500 text-black font-bold'
                  : 'bg-white/5 text-white hover:bg-white/10'
              )}
            >
              🔥 Engagement
            </button>
            <button
              onClick={() => setFilter('tiguy')}
              className={cn(
                'px-4 py-2 rounded-xl whitespace-nowrap transition-colors',
                filter === 'tiguy'
                  ? 'bg-gold-500 text-black font-bold'
                  : 'bg-white/5 text-white hover:bg-white/10'
              )}
            >
              🤖 Ti-Guy
            </button>
            <button
              onClick={() => setFilter('elite')}
              className={cn(
                'px-4 py-2 rounded-xl whitespace-nowrap transition-colors',
                filter === 'elite'
                  ? 'bg-gold-500 text-black font-bold'
                  : 'bg-white/5 text-white hover:bg-white/10'
              )}
            >
              💎 Élite
            </button>
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('earned')}
              className={cn(
                'px-3 py-1 rounded-lg text-sm transition-colors',
                sortBy === 'earned'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              )}
            >
              Débloqués d&apos;abord
            </button>
            <button
              onClick={() => setSortBy('rarity')}
              className={cn(
                'px-3 py-1 rounded-lg text-sm transition-colors',
                sortBy === 'rarity'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              )}
            >
              Par rareté
            </button>
            <button
              onClick={() => setSortBy('points')}
              className={cn(
                'px-3 py-1 rounded-lg text-sm transition-colors',
                sortBy === 'points'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              )}
            >
              Par points
            </button>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAchievements.map((achievement) => {
            const earned = isEarned(achievement.id);
            return (
              <div
                key={achievement.id}
                className={cn(
                  'card-edge p-5 transition-all',
                  earned ? 'bg-gradient-to-br from-gold-900/10 to-yellow-900/10' : 'opacity-60 grayscale'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0',
                      earned ? 'bg-gradient-to-br from-gold-500 to-yellow-600' : 'bg-white/5'
                    )}
                  >
                    {earned ? achievement.icon : '🔒'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold mb-1">{achievement.name_fr}</h3>
                    <p className="text-white/60 text-sm mb-2">{achievement.description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gold-400 font-semibold">
                        🏆 {achievement.points} pts
                      </span>
                      {achievement.reward_cennes > 0 && (
                        <span className="text-green-400 font-semibold">
                          💰 {achievement.reward_cennes}¢
                        </span>
                      )}
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-bold',
                          achievement.rarity === 'legendary' && 'bg-yellow-500/20 text-yellow-400',
                          achievement.rarity === 'epic' && 'bg-purple-500/20 text-purple-400',
                          achievement.rarity === 'rare' && 'bg-blue-500/20 text-blue-400',
                          achievement.rarity === 'uncommon' && 'bg-green-500/20 text-green-400',
                          achievement.rarity === 'common' && 'bg-gray-500/20 text-gray-400'
                        )}
                      >
                        {achievement.rarity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="card-edge p-12 text-center">
            <p className="text-white/60 text-lg">Aucun accomplissement dans cette catégorie</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Achievements;

