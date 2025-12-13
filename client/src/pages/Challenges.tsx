/**
 * 🎯 Daily Challenges Page
 * Gamified content creation with rewards
 */

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';
import { toast } from '../components/Toast';
import { logger } from '../lib/logger';

const challengesLogger = logger.withContext('Challenges');


interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'seasonal';
  points: number;
  icon: string;
  requirement: string;
  expires_at: string;
}

interface UserProgress {
  challenge_id: string;
  progress: number;
  completed: boolean;
}

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProgress, setUserProgress] = useState<Map<string, UserProgress>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'daily' | 'weekly' | 'seasonal'>('all');
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    loadChallenges();
    loadUserProgress();
  }, [selectedType]);

  const loadChallenges = async () => {
    try {
      let query = supabase
        .from('daily_challenges')
        .select('*')
        .gte('expires_at', new Date().toISOString())
        .order('type', { ascending: true })
        .order('points', { ascending: false });

      if (selectedType !== 'all') {
        query = query.eq('type', selectedType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      challengesLogger.error('Error loading challenges:', error);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const progressMap = new Map<string, UserProgress>();
      let points = 0;
      
      data?.forEach((progress) => {
        progressMap.set(progress.challenge_id, progress);
        if (progress.completed) {
          points += progress.points_earned || 0;
        }
      });

      setUserProgress(progressMap);
      setTotalPoints(points);
    } catch (error) {
      challengesLogger.error('Error loading progress:', error);
    }
  };

  const handleClaimReward = async (challenge: Challenge) => {
    const progress = userProgress.get(challenge.id);
    if (!progress?.completed) {
      toast.warning('Complète le défi d\'abord!');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Award points
      const { error } = await supabase
        .from('user_challenge_progress')
        .update({ claimed: true })
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`+${challenge.points} points! 🎉`);
      loadUserProgress();
    } catch (error) {
      challengesLogger.error('Error claiming reward:', error);
      toast.error('Erreur lors de la réclamation');
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)}j restants`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Défis Quotidiens 🎯
          </h1>
          <p className="text-white/60 mb-4">
            Complète des défis et gagne des points!
          </p>
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-gold-500 to-yellow-600 rounded-full">
            <span className="text-2xl font-bold text-black">
              {totalPoints} points
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {[
            { id: 'all', name: 'Tous', icon: '🎯' },
            { id: 'daily', name: 'Quotidien', icon: '📅' },
            { id: 'weekly', name: 'Hebdo', icon: '📆' },
            { id: 'seasonal', name: 'Saisonnier', icon: '🎄' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedType === tab.id
                  ? 'bg-gold-500 text-black font-bold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>

        {/* Challenges Grid */}
        {isLoading ? (
          <div className="text-center text-white/60 py-12">Chargement...</div>
        ) : challenges.length === 0 ? (
          <div className="text-center text-white/60 py-12">
            Aucun défi disponible pour le moment. Reviens plus tard! 🔄
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => {
              const progress = userProgress.get(challenge.id);
              const isCompleted = progress?.completed || false;
              const isClaimed = (progress as any)?.claimed || false;

              return (
                <div
                  key={challenge.id}
                  className={`bg-white/5 border ${
                    isCompleted ? 'border-green-500' : 'border-white/10'
                  } rounded-2xl p-6 hover:bg-white/10 transition-all`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="text-5xl">{challenge.icon}</div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {challenge.title}
                          </h3>
                          <p className="text-white/60 text-sm">
                            {challenge.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gold-500">
                            +{challenge.points}
                          </div>
                          <div className="text-xs text-white/40">points</div>
                        </div>
                      </div>

                      {/* Requirement */}
                      <div className="bg-white/5 rounded-lg px-3 py-2 mb-3">
                        <span className="text-white/80 text-sm">
                          📋 {challenge.requirement}
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-white/40">
                            ⏰ {getTimeRemaining(challenge.expires_at)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            challenge.type === 'daily' ? 'bg-blue-500/20 text-blue-400' :
                            challenge.type === 'weekly' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {challenge.type === 'daily' ? 'Quotidien' :
                             challenge.type === 'weekly' ? 'Hebdo' : 'Saisonnier'}
                          </span>
                        </div>

                        {isCompleted ? (
                          isClaimed ? (
                            <span className="text-green-500 font-bold">
                              ✓ Réclamé
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleClaimReward(challenge)}
                              className="bg-gold-500 text-black hover:bg-gold-600"
                            >
                              Réclamer 🎁
                            </Button>
                          )
                        ) : (
                          <span className="text-white/40 text-sm">
                            En cours...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

