/**
 * Muted Accounts Settings Page
 */

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";
import { supabase } from "@/lib/supabase";
import { logger } from "../../lib/logger";

const mutedAccountsSettingsLogger = logger.withContext("MutedAccountsSettings");

export const MutedAccountsSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const mutedAccounts = preferences.muted.accounts || [];

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, username, display_name, avatar_url")
        .ilike("username", `%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      mutedAccountsSettingsLogger.error("Error searching users:", error);
      toast.error("Erreur lors de la recherche");
    }
  };

  const handleAddMuted = (userId: string, username: string) => {
    tap();
    if (mutedAccounts.includes(userId)) {
      toast.info("Ce compte est déjà masqué");
      return;
    }

    const updated = [...mutedAccounts, userId];
    setPreference("muted.accounts", updated);
    toast.success(`@${username} ajouté aux comptes masqués`);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveMuted = (userId: string) => {
    tap();
    const updated = mutedAccounts.filter((id) => id !== userId);
    setPreference("muted.accounts", updated);
    toast.success("Compte retiré des comptes masqués");
  };

  const handleToggle = (
    path: "muted.hideStories" | "muted.hidePosts",
    value: boolean,
  ) => {
    tap();
    setPreference(path, value);
    toast.success("Paramètre mis à jour! ✨");
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Comptes masqués" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Hide Stories */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Masquer les stories
              </h3>
              <p className="text-leather-300 text-sm">
                Masquer les stories des comptes masqués
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "muted.hideStories",
                  !preferences.muted.hideStories,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.muted.hideStories ? "bg-gold-500" : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.muted.hideStories
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Hide Posts */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Masquer les posts
              </h3>
              <p className="text-leather-300 text-sm">
                Masquer les posts des comptes masqués
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle("muted.hidePosts", !preferences.muted.hidePosts)
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.muted.hidePosts ? "bg-gold-500" : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.muted.hidePosts
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="leather-card rounded-xl p-4 stitched">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Rechercher un compte..."
            className="w-full bg-leather-800/50 border border-leather-700 rounded-lg px-4 py-2 text-white placeholder-leather-400 focus:outline-none focus:border-gold-500"
          />

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-leather-800/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-leather-700 overflow-hidden">
                      {user.avatar_url && (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-leather-400 text-sm">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddMuted(user.id, user.username)}
                    disabled={mutedAccounts.includes(user.id)}
                    className="px-4 py-2 bg-gold-500/20 text-gold-500 rounded-lg hover:bg-gold-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mutedAccounts.includes(user.id) ? "Masqué" : "Masquer"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Muted Accounts List */}
        {mutedAccounts.length > 0 && (
          <div className="leather-card rounded-xl p-4 stitched">
            <h3 className="text-white font-semibold mb-3">
              Comptes masqués ({mutedAccounts.length})
            </h3>
            <div className="space-y-2">
              {mutedAccounts.map((userId) => (
                <div
                  key={userId}
                  className="flex items-center justify-between p-3 bg-leather-800/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-leather-700" />
                    <div>
                      <p className="text-white font-medium">
                        Utilisateur {userId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMuted(userId)}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {mutedAccounts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-leather-400">Aucun compte masqué</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MutedAccountsSettings;
