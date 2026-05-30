/**
 * Photos and Videos Settings Page
 */

import React from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";

export const MediaSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();

  const handleToggle = (
    path:
      | "media.autoplayFeed"
      | "media.highQualityUploads"
      | "media.saveOriginals",
    value: boolean,
  ) => {
    tap();
    setPreference(path, value);
    toast.success("Paramètre mis à jour! ✨");
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Photos et vidéos" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Autoplay Feed */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Lecture automatique du feed
              </h3>
              <p className="text-leather-300 text-sm">
                Lire automatiquement les vidéos dans le feed
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "media.autoplayFeed",
                  !preferences.media.autoplayFeed,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.media.autoplayFeed
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.media.autoplayFeed
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* High Quality Uploads */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Uploads haute qualité
              </h3>
              <p className="text-leather-300 text-sm">
                Téléverser les photos et vidéos en haute qualité
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "media.highQualityUploads",
                  !preferences.media.highQualityUploads,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.media.highQualityUploads
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.media.highQualityUploads
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Originals */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Sauvegarder les originaux
              </h3>
              <p className="text-leather-300 text-sm">
                Conserver les fichiers originaux sur ton appareil
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "media.saveOriginals",
                  !preferences.media.saveOriginals,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.media.saveOriginals
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.media.saveOriginals
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

export default MediaSettings;
