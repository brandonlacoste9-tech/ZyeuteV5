/**
 * App Settings Page
 */

import React from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";

export const AppSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();

  const handleToggle = (
    path: "app.haptics" | "app.analytics" | "app.betaFeatures",
    value: boolean,
  ) => {
    tap();
    setPreference(path, value);
    toast.success("Paramètre mis à jour! ✨");
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Paramètres de l'app" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Haptics */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Retour haptique</h3>
              <p className="text-leather-300 text-sm">
                Vibrations tactiles lors des interactions
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle("app.haptics", !preferences.app.haptics)
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.app.haptics ? "bg-gold-500" : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.app.haptics ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Analytics */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Analytiques</h3>
              <p className="text-leather-300 text-sm">
                Partager des données d&apos;utilisation pour améliorer
                l&apos;app
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle("app.analytics", !preferences.app.analytics)
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.app.analytics ? "bg-gold-500" : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.app.analytics ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Beta Features */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Fonctionnalités bêta
              </h3>
              <p className="text-leather-300 text-sm">
                Accéder aux nouvelles fonctionnalités en développement
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle("app.betaFeatures", !preferences.app.betaFeatures)
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.app.betaFeatures ? "bg-gold-500" : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.app.betaFeatures
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="leather-card rounded-xl p-4 stitched">
          <h3 className="text-white font-semibold mb-3">
            Informations sur l&apos;app
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-leather-400">Version</span>
              <span className="text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-leather-400">Fait au Québec</span>
              <span className="text-gold-500">⚜️🇨🇦</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AppSettings;
