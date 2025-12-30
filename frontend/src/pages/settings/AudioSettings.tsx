/**
 * Audio and Music Settings Page
 */

import React from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";

export const AudioSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();

  const handleToggle = (
    path:
      | "audio.muteByDefault"
      | "audio.normalizeVolume"
      | "audio.autoAddMusic",
    value: boolean,
  ) => {
    tap();
    setPreference(path, value);
    toast.success("Paramètre mis à jour! ✨");
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Audio et musique" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Mute By Default */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Sourdine par défaut
              </h3>
              <p className="text-leather-300 text-sm">
                Les vidéos démarrent en sourdine
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "audio.muteByDefault",
                  !preferences.audio.muteByDefault,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.audio.muteByDefault
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.audio.muteByDefault
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Normalize Volume */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Normaliser le volume
              </h3>
              <p className="text-leather-300 text-sm">
                Ajuster automatiquement le volume entre les vidéos
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "audio.normalizeVolume",
                  !preferences.audio.normalizeVolume,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.audio.normalizeVolume
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.audio.normalizeVolume
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Auto Add Music */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Ajouter de la musique automatiquement
              </h3>
              <p className="text-leather-300 text-sm">
                Suggérer de la musique lors de la création de vidéos
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "audio.autoAddMusic",
                  !preferences.audio.autoAddMusic,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.audio.autoAddMusic
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.audio.autoAddMusic
                    ? "translate-x-6"
                    : "translate-x-0"
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

export default AudioSettings;
