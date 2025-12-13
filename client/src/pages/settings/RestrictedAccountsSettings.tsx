/**
 * Restricted Accounts Settings Page
 */

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsPreferences } from '@/hooks/useSettingsPreferences';
import { toast } from '@/components/Toast';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/lib/supabase';
import { logger } from '../../lib/logger';

const restrictedAccountsSettingsLogger = logger.withContext('RestrictedAccountsSettings');


export const RestrictedAccountsSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const restrictedAccounts = preferences.restricted.accounts || [];

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      restrictedAccountsSettingsLogger.error('Error searching users:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddRestricted = (userId: string, username: string) => {
    tap();
    if (restrictedAccounts.includes(userId)) {
      toast.info('Ce compte est déjà restreint');
      return;
    }

    const updated = [...restrictedAccounts, userId];
    setPreference('restricted.accounts', updated);
    toast.success(`@${username} ajouté aux comptes restreints`);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveRestricted = (userId: string) => {
    tap();
    const updated = restrictedAccounts.filter((id) => id !== userId);
    setPreference('restricted.accounts', updated);
    toast.success('Compte retiré des restrictions');
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Comptes restreints" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Info */}
        <div className="leather-card rounded-xl p-4 stitched bg-gold-500/10 border border-gold-500/30">
          <p className="text-white text-sm">
            Les comptes restreints peuvent voir tes posts publics mais ne peuvent pas voir quand tu es en ligne ou si tu as lu leurs messages.
          </p>
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
                        <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.display_name || user.username}</p>
                      <p className="text-leather-400 text-sm">@{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddRestricted(user.id, user.username)}
                    disabled={restrictedAccounts.includes(user.id)}
                    className="px-4 py-2 bg-gold-500/20 text-gold-500 rounded-lg hover:bg-gold-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {restrictedAccounts.includes(user.id) ? 'Restreint' : 'Restreindre'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Restricted Accounts List */}
        {restrictedAccounts.length > 0 && (
          <div className="leather-card rounded-xl p-4 stitched">
            <h3 className="text-white font-semibold mb-3">Comptes restreints ({restrictedAccounts.length})</h3>
            <div className="space-y-2">
              {restrictedAccounts.map((userId) => (
                <div
                  key={userId}
                  className="flex items-center justify-between p-3 bg-leather-800/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-leather-700" />
                    <div>
                      <p className="text-white font-medium">Utilisateur {userId.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveRestricted(userId)}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {restrictedAccounts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-leather-400">Aucun compte restreint</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default RestrictedAccountsSettings;

