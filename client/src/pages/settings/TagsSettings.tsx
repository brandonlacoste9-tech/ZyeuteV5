/**
 * Tags and Mentions Settings Page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsPreferences } from '@/hooks/useSettingsPreferences';
import { toast } from '@/components/Toast';
import { useHaptics } from '@/hooks/useHaptics';

export const TagsSettings: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();

  const handleToggle = (path: 'tags.allowTagging' | 'tags.requireApproval', value: boolean) => {
    tap();
    setPreference(path, value);
    toast.success('Paramètre mis à jour! ✨');
  };

  const handleMentionScope = (scope: 'everyone' | 'followers' | 'no_one') => {
    tap();
    setPreference('tags.mentionScope', scope);
    toast.success('Portée des mentions mise à jour! ✨');
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Tags et mentions" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Allow Tagging */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Autoriser les tags</h3>
              <p className="text-leather-300 text-sm">Permettre aux autres de te taguer dans leurs posts</p>
            </div>
            <button
              onClick={() => handleToggle('tags.allowTagging', !preferences.tags.allowTagging)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.tags.allowTagging ? 'bg-gold-500' : 'bg-leather-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.tags.allowTagging ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Require Approval */}
        {preferences.tags.allowTagging && (
          <div className="leather-card rounded-xl p-4 stitched">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Approbation requise</h3>
                <p className="text-leather-300 text-sm">Approuver les tags avant qu&apos;ils apparaissent</p>
              </div>
              <button
                onClick={() => handleToggle('tags.requireApproval', !preferences.tags.requireApproval)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  preferences.tags.requireApproval ? 'bg-gold-500' : 'bg-leather-700'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    preferences.tags.requireApproval ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Mention Scope */}
        <div className="leather-card rounded-xl p-4 stitched">
          <h3 className="text-white font-semibold mb-3">Qui peut te mentionner?</h3>
          <div className="space-y-2">
            {(['everyone', 'followers', 'no_one'] as const).map((scope) => (
              <button
                key={scope}
                onClick={() => handleMentionScope(scope)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  preferences.tags.mentionScope === scope
                    ? 'bg-gold-500/20 border-2 border-gold-500'
                    : 'bg-leather-800/50 border-2 border-transparent hover:bg-leather-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">
                    {scope === 'everyone' && 'Tout le monde'}
                    {scope === 'followers' && 'Tes abonnés seulement'}
                    {scope === 'no_one' && 'Personne'}
                  </span>
                  {preferences.tags.mentionScope === scope && (
                    <span className="text-gold-500">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TagsSettings;

