/**
 * Content Preferences Settings Page
 */

import React from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsPreferences } from '@/hooks/useSettingsPreferences';
import { toast } from '@/components/Toast';
import { useHaptics } from '@/hooks/useHaptics';

export const ContentPreferencesSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();

  const handleToggle = (
    path: 'content.personalizedAds' | 'content.autoplayRecommendations',
    value: boolean
  ) => {
    tap();
    setPreference(path, value);
    toast.success('Paramètre mis à jour! ✨');
  };

  const handleFilterLevel = (level: 'strict' | 'medium' | 'off') => {
    tap();
    setPreference('content.sensitiveFilter', level);
    toast.success('Niveau de filtre mis à jour! ✨');
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Préférences de contenu" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Sensitive Content Filter */}
        <div className="leather-card rounded-xl p-4 stitched">
          <h3 className="text-white font-semibold mb-3">Filtre de contenu sensible</h3>
          <div className="space-y-2">
            {(['strict', 'medium', 'off'] as const).map((level) => (
              <button
                key={level}
                onClick={() => handleFilterLevel(level)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  preferences.content.sensitiveFilter === level
                    ? 'bg-gold-500/20 border-2 border-gold-500'
                    : 'bg-leather-800/50 border-2 border-transparent hover:bg-leather-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">
                    {level === 'strict' && 'Strict'}
                    {level === 'medium' && 'Moyen'}
                    {level === 'off' && 'Désactivé'}
                  </span>
                  {preferences.content.sensitiveFilter === level && (
                    <span className="text-gold-500">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Personalized Ads */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Publicités personnalisées</h3>
              <p className="text-leather-300 text-sm">Afficher des publicités basées sur tes intérêts</p>
            </div>
            <button
              onClick={() => handleToggle('content.personalizedAds', !preferences.content.personalizedAds)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.content.personalizedAds ? 'bg-gold-500' : 'bg-leather-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.content.personalizedAds ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Autoplay Recommendations */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Lecture automatique des recommandations</h3>
              <p className="text-leather-300 text-sm">Lire automatiquement les vidéos recommandées</p>
            </div>
            <button
              onClick={() => handleToggle('content.autoplayRecommendations', !preferences.content.autoplayRecommendations)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.content.autoplayRecommendations ? 'bg-gold-500' : 'bg-leather-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.content.autoplayRecommendations ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ContentPreferencesSettings;

