/**
 * Sharing and Remixes Settings Page
 */

import React from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";

export const SharingSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();

  const handleToggle = (
    path:
      | "sharing.allowShares"
      | "sharing.allowRemix"
      | "sharing.allowDownload"
      | "sharing.allowEmbed",
    value: boolean,
  ) => {
    tap();
    setPreference(path, value);
    toast.success("Paramètre mis à jour! ✨");
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Partage et remixes" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Allow Shares */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Autoriser le partage
              </h3>
              <p className="text-leather-300 text-sm">
                Permettre aux autres de partager tes posts
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "sharing.allowShares",
                  !preferences.sharing.allowShares,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.sharing.allowShares
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.sharing.allowShares
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Allow Remix */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Autoriser les remixes
              </h3>
              <p className="text-leather-300 text-sm">
                Permettre aux autres de créer des remixes de tes vidéos
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "sharing.allowRemix",
                  !preferences.sharing.allowRemix,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.sharing.allowRemix
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.sharing.allowRemix
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Allow Download */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Autoriser le téléchargement
              </h3>
              <p className="text-leather-300 text-sm">
                Permettre aux autres de télécharger tes posts
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "sharing.allowDownload",
                  !preferences.sharing.allowDownload,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.sharing.allowDownload
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.sharing.allowDownload
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Allow Embed */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Autoriser l&apos;intégration
              </h3>
              <p className="text-leather-300 text-sm">
                Permettre l&apos;intégration de tes posts sur d&apos;autres
                sites
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "sharing.allowEmbed",
                  !preferences.sharing.allowEmbed,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.sharing.allowEmbed
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.sharing.allowEmbed
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

export default SharingSettings;
