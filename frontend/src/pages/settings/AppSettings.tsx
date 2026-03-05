/**
 * App Settings Page
 */

import React from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";
import { useTheme, PRESET_THEMES } from "@/contexts/ThemeContext";

export const AppSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();
  const { currentTheme, setTheme } = useTheme();

  const handleToggle = (
    path: "app.haptics" | "app.analytics" | "app.betaFeatures",
    value: boolean,
  ) => {
    tap();
    setPreference(path, value);
    toast.success("Paramètre mis à jour! ✨");
  };

  const leatherThemes = [
    { key: "leather", label: "Cuir Luxe", color: "#c5a055", emoji: "⚜" },
    { key: "leather-green", label: "Cuir Forêt", color: "#7ec98a", emoji: "🌲" },
    { key: "leather-purple", label: "Cuir Royal", color: "#b48ad4", emoji: "👑" },
  ];

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
              className={`relative w-14 h-8 rounded-full transition-colors ${preferences.app.haptics ? "bg-gold-500" : "bg-leather-700"
                }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${preferences.app.haptics ? "translate-x-6" : "translate-x-0"
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
              className={`relative w-14 h-8 rounded-full transition-colors ${preferences.app.analytics ? "bg-gold-500" : "bg-leather-700"
                }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${preferences.app.analytics ? "translate-x-6" : "translate-x-0"
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
              className={`relative w-14 h-8 rounded-full transition-colors ${preferences.app.betaFeatures ? "bg-gold-500" : "bg-leather-700"
                }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${preferences.app.betaFeatures
                    ? "translate-x-6"
                    : "translate-x-0"
                  }`}
              />
            </button>
          </div>
        </div>

        {/* ⚜ Leather Theme Selector */}
        <div className="leather-card rounded-xl p-4 stitched">
          <h3 className="text-white font-semibold mb-1">⚜ Thème Cuir</h3>
          <p className="text-leather-300 text-sm mb-4">
            Collection luxe — cuir avec couture dorée
          </p>
          <div className="flex gap-4 justify-center mb-4">
            {leatherThemes.map((lt) => (
              <button
                key={lt.key}
                onClick={() => { tap(); setTheme(lt.key); toast.success(`${lt.label} activé! ${lt.emoji}`); }}
                className="flex flex-col items-center gap-2 transition-transform hover:scale-110"
              >
                <div
                  className="w-14 h-14 rounded-full transition-all"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${lt.color}40, ${lt.color}15)`,
                    border: currentTheme === lt.key ? `3px solid ${lt.color}` : '2px solid rgba(255,255,255,0.15)',
                    boxShadow: currentTheme === lt.key ? `0 0 16px ${lt.color}60` : 'none',
                  }}
                />
                <span className="text-xs" style={{ color: currentTheme === lt.key ? lt.color : 'rgba(255,255,255,0.5)' }}>
                  {lt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Edge Color Theme */}
        <div className="leather-card rounded-xl p-4 stitched">
          <h3 className="text-white font-semibold mb-1">Couleur d'accent</h3>
          <p className="text-leather-300 text-sm mb-4">
            Personnalise l'éclairage de bordure
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(PRESET_THEMES).filter(([k]) => !k.startsWith("leather")).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => { tap(); setTheme(key); toast.success(`${theme.name} activé!`); }}
                className="flex flex-col items-center gap-1 transition-transform hover:scale-110"
              >
                <div
                  className="w-10 h-10 rounded-full transition-all"
                  style={{
                    backgroundColor: theme.edgeLighting,
                    border: currentTheme === key ? '3px solid white' : '2px solid rgba(255,255,255,0.1)',
                    boxShadow: currentTheme === key ? `0 0 12px ${theme.edgeLighting}80` : 'none',
                  }}
                />
                <span className="text-[10px]" style={{ color: currentTheme === key ? theme.edgeLighting : 'rgba(255,255,255,0.4)' }}>
                  {theme.name}
                </span>
              </button>
            ))}
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
