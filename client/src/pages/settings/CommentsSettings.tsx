/**
 * Comments Settings Page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsPreferences } from '@/hooks/useSettingsPreferences';
import { toast } from '@/components/Toast';
import { useHaptics } from '@/hooks/useHaptics';

export const CommentsSettings: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();

  const handleToggle = (
    path: 'comments.allowComments' | 'comments.filterOffensive' | 'comments.autoHide' | 'comments.allowGifs',
    value: boolean
  ) => {
    tap();
    setPreference(path, value);
    toast.success('Paramètre mis à jour! ✨');
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Commentaires" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Allow Comments */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Autoriser les commentaires</h3>
              <p className="text-leather-300 text-sm">Permettre aux autres de commenter tes posts</p>
            </div>
            <button
              onClick={() => handleToggle('comments.allowComments', !preferences.comments.allowComments)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.comments.allowComments ? 'bg-gold-500' : 'bg-leather-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.comments.allowComments ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Filter Offensive */}
        {preferences.comments.allowComments && (
          <>
            <div className="leather-card rounded-xl p-4 stitched">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Filtrer les commentaires offensants</h3>
                  <p className="text-leather-300 text-sm">Masquer automatiquement les commentaires inappropriés</p>
                </div>
                <button
                  onClick={() => handleToggle('comments.filterOffensive', !preferences.comments.filterOffensive)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    preferences.comments.filterOffensive ? 'bg-gold-500' : 'bg-leather-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      preferences.comments.filterOffensive ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Auto Hide */}
            <div className="leather-card rounded-xl p-4 stitched">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Masquer automatiquement</h3>
                  <p className="text-leather-300 text-sm">Masquer les commentaires avec plusieurs signalements</p>
                </div>
                <button
                  onClick={() => handleToggle('comments.autoHide', !preferences.comments.autoHide)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    preferences.comments.autoHide ? 'bg-gold-500' : 'bg-leather-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      preferences.comments.autoHide ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Allow GIFs */}
            <div className="leather-card rounded-xl p-4 stitched">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Autoriser les GIFs</h3>
                  <p className="text-leather-300 text-sm">Permettre les GIFs dans les commentaires</p>
                </div>
                <button
                  onClick={() => handleToggle('comments.allowGifs', !preferences.comments.allowGifs)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    preferences.comments.allowGifs ? 'bg-gold-500' : 'bg-leather-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      preferences.comments.allowGifs ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default CommentsSettings;

