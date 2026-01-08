/**
 * Storage and Data Settings Page
 */

import React from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";

export const StorageSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();

  const handleToggle = (
    path: "storage.dataSaver" | "storage.downloadWifiOnly",
    value: boolean,
  ) => {
    tap();
    setPreference(path, value);
    toast.success("Paramètre mis à jour! ✨");
  };

  const handleCacheSize = (size: number) => {
    tap();
    setPreference("storage.cacheSizeMb", size);
    toast.success("Taille du cache mise à jour! ✨");
  };

  const clearCache = () => {
    tap();
    if (window.confirm("Es-tu sûr de vouloir vider le cache?")) {
      // In a real app, this would clear the cache
      toast.success("Cache vidé! ✨");
    }
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Stockage et données" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Data Saver */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Économiseur de données
              </h3>
              <p className="text-leather-300 text-sm">
                Réduire l&apos;utilisation des données mobiles
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "storage.dataSaver",
                  !preferences.storage.dataSaver,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.storage.dataSaver ? "bg-gold-500" : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.storage.dataSaver
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Download WiFi Only */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Télécharger uniquement en WiFi
              </h3>
              <p className="text-leather-300 text-sm">
                Télécharger uniquement lorsque connecté au WiFi
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "storage.downloadWifiOnly",
                  !preferences.storage.downloadWifiOnly,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.storage.downloadWifiOnly
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.storage.downloadWifiOnly
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Cache Size */}
        <div className="leather-card rounded-xl p-4 stitched">
          <h3 className="text-white font-semibold mb-3">Taille du cache</h3>
          <div className="space-y-2">
            {[160, 320, 640, 1280].map((size) => (
              <button
                key={size}
                onClick={() => handleCacheSize(size)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  preferences.storage.cacheSizeMb === size
                    ? "bg-gold-500/20 border-2 border-gold-500"
                    : "bg-leather-800/50 border-2 border-transparent hover:bg-leather-700/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{size} MB</span>
                  {preferences.storage.cacheSizeMb === size && (
                    <span className="text-gold-500">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Clear Cache */}
        <div className="leather-card rounded-xl p-4 stitched">
          <button
            onClick={clearCache}
            className="w-full text-center py-3 text-red-400 font-semibold hover:text-red-300 transition-colors"
          >
            Vider le cache
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default StorageSettings;
