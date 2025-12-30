/**
 * Favorites Settings Page
 */

import React from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";

export const FavoritesSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();

  const handleToggle = (
    path: "favorites.showFavoritesFirst" | "favorites.notifyWhenLive",
    value: boolean,
  ) => {
    tap();
    setPreference(path, value);
    toast.success("Paramètre mis à jour! ✨");
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Favoris" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Show Favorites First */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Afficher les favoris en premier
              </h3>
              <p className="text-leather-300 text-sm">
                Prioriser les posts de tes comptes favoris dans le feed
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "favorites.showFavoritesFirst",
                  !preferences.favorites.showFavoritesFirst,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.favorites.showFavoritesFirst
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.favorites.showFavoritesFirst
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notify When Live */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Notifier quand en direct
              </h3>
              <p className="text-leather-300 text-sm">
                Recevoir des notifications quand tes favoris sont en direct
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "favorites.notifyWhenLive",
                  !preferences.favorites.notifyWhenLive,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.favorites.notifyWhenLive
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.favorites.notifyWhenLive
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

export default FavoritesSettings;
