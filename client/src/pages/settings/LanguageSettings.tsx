/**
 * Language Settings Page
 * French-only by default with tiny English toggle
 */

import React from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsPreferences } from '@/hooks/useSettingsPreferences';
import { toast } from '@/components/Toast';
import { useHaptics } from '@/hooks/useHaptics';

export const LanguageSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();

  const handleLanguageSelect = (lang: 'fr' | 'en') => {
    tap();
    setPreference('language', lang);
    toast.success(`Langue changée: ${lang === 'fr' ? 'Français' : 'English'}! ✨`);
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Langue" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Quebec Pride Banner */}
        <div className="leather-card rounded-xl p-6 stitched bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-gold-500/30">
          <div className="text-center">
            <span className="text-4xl mb-2 block">⚜️🇨🇦⚜️</span>
            <h2 className="text-gold-400 font-bold text-lg mb-1">Zyeuté, c&apos;est en français!</h2>
            <p className="text-white text-sm">
              L&apos;app sociale du Québec, fait au Québec pour le Québec.
            </p>
          </div>
        </div>

        {/* French - Main Language (Prominent) */}
        <div className="leather-card rounded-xl p-4 stitched">
          <h3 className="text-white font-semibold mb-4">Langue principale</h3>
          <button
            onClick={() => handleLanguageSelect('fr')}
            className={`w-full text-left p-5 rounded-xl transition-all ${
              preferences.language === 'fr'
                ? 'bg-gold-500/20 border-2 border-gold-500 shadow-lg shadow-gold-500/20'
                : 'bg-leather-800/50 border-2 border-transparent hover:bg-leather-700/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🇨🇦</span>
                <div>
                  <p className="text-white font-bold text-lg">Français québécois</p>
                  <p className="text-leather-400 text-sm">La langue de chez nous! ⚜️</p>
                </div>
              </div>
              {preferences.language === 'fr' && (
                <span className="text-gold-500 text-2xl">✓</span>
              )}
            </div>
          </button>
        </div>

        {/* Note about Quebec French */}
        <div className="leather-card rounded-xl p-4 stitched">
          <p className="text-leather-300 text-sm">
            🦫 Zyeuté utilise le français québécois authentique. Ti-Guy, notre mascotte, te parle en joual! 
            Tout le contenu de la communauté est en français.
          </p>
        </div>

        {/* Tiny English Toggle - Hidden at bottom */}
        <div className="mt-12 pt-8 border-t border-leather-800/30">
          <button
            onClick={() => handleLanguageSelect('en')}
            className={`w-full text-left p-3 rounded-lg transition-all opacity-40 hover:opacity-70 ${
              preferences.language === 'en'
                ? 'bg-leather-800/30 border border-leather-600/50'
                : 'bg-leather-900/20 border border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🌐</span>
                <p className="text-leather-500 text-xs">English interface</p>
              </div>
              {preferences.language === 'en' && (
                <span className="text-leather-500 text-xs">✓</span>
              )}
            </div>
          </button>
          <p className="text-leather-600 text-[10px] text-center mt-2">
            For non-French speakers only
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default LanguageSettings;

