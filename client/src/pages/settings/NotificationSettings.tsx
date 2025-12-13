/**
 * Notification Settings Page
 */

import React from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsPreferences } from '@/hooks/useSettingsPreferences';
import { toast } from '@/components/Toast';
import { useHaptics } from '@/hooks/useHaptics';

export const NotificationSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();

  const handleToggle = (
    path: 'notifications.push' | 'notifications.emailDigest' | 'notifications.reminders' | 'notifications.notifyComments' | 'notifications.notifyFires' | 'notifications.notifyFollows',
    value: boolean
  ) => {
    tap();
    setPreference(path, value);
    toast.success('Paramètre mis à jour! ✨');
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Notifications" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Push Notifications */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Notifications push</h3>
              <p className="text-leather-300 text-sm">Recevoir des notifications sur ton appareil</p>
            </div>
            <button
              onClick={() => handleToggle('notifications.push', !preferences.notifications.push)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.notifications.push ? 'bg-gold-500' : 'bg-leather-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.notifications.push ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Email Digest */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Résumé par courriel</h3>
              <p className="text-leather-300 text-sm">Recevoir un résumé hebdomadaire par courriel</p>
            </div>
            <button
              onClick={() => handleToggle('notifications.emailDigest', !preferences.notifications.emailDigest)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.notifications.emailDigest ? 'bg-gold-500' : 'bg-leather-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.notifications.emailDigest ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Reminders */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Rappels</h3>
              <p className="text-leather-300 text-sm">Rappels pour publier et interagir</p>
            </div>
            <button
              onClick={() => handleToggle('notifications.reminders', !preferences.notifications.reminders)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.notifications.reminders ? 'bg-gold-500' : 'bg-leather-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.notifications.reminders ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Comments on my posts */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Commentaires sur mes posts</h3>
              <p className="text-leather-300 text-sm">Recevoir des notifications pour les commentaires</p>
            </div>
            <button
              onClick={() => handleToggle('notifications.notifyComments', !preferences.notifications.notifyComments)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.notifications.notifyComments ? 'bg-gold-500' : 'bg-leather-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.notifications.notifyComments ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Fires on my posts */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Feux sur mes posts</h3>
              <p className="text-leather-300 text-sm">Recevoir des notifications pour les feux (likes)</p>
            </div>
            <button
              onClick={() => handleToggle('notifications.notifyFires', !preferences.notifications.notifyFires)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.notifications.notifyFires ? 'bg-gold-500' : 'bg-leather-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.notifications.notifyFires ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* New followers */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Nouveaux abonnés</h3>
              <p className="text-leather-300 text-sm">Recevoir des notifications pour les nouveaux abonnés</p>
            </div>
            <button
              onClick={() => handleToggle('notifications.notifyFollows', !preferences.notifications.notifyFollows)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.notifications.notifyFollows ? 'bg-gold-500' : 'bg-leather-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.notifications.notifyFollows ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notification Types Info */}
        <div className="leather-card rounded-xl p-4 stitched bg-gold-500/10 border border-gold-500/30">
          <h3 className="text-white font-semibold mb-2">Types de notifications</h3>
          <p className="text-leather-300 text-sm mb-2">
            Tu recevras des notifications pour:
          </p>
          <ul className="space-y-1 text-leather-400 text-xs">
            <li>• Nouveaux abonnés</li>
            <li>• Commentaires sur tes posts</li>
            <li>• Feux (likes) sur tes posts</li>
            <li>• Mentions et tags</li>
            <li>• Messages directs</li>
          </ul>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default NotificationSettings;

