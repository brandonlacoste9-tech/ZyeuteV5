/**
 * Region Settings Page - Select Quebec Region
 */

import React from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsPreferences } from '@/hooks/useSettingsPreferences';
import { QUEBEC_REGIONS } from '@/lib/quebecFeatures';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/Toast';
import { useHaptics } from '@/hooks/useHaptics';
import { logger } from '../../lib/logger';

const regionSettingsLogger = logger.withContext('RegionSettings');


export const RegionSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();

  const handleRegionSelect = async (regionId: string) => {
    tap();
    setPreference('region', regionId);
    
    // Also update user profile in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const region = QUEBEC_REGIONS.find(r => r.id === regionId);
        await supabase
          .from('user_profiles')
          .update({ region: regionId })
          .eq('id', user.id);
        
        toast.success(`Région mise à jour: ${region?.name || regionId}! ⚜️`);
      }
    } catch (error) {
      regionSettingsLogger.error('Error updating region:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Région du Québec" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Info */}
        <div className="leather-card rounded-xl p-4 stitched bg-gold-500/10 border border-gold-500/30">
          <p className="text-white text-sm">
            Sélectionne ta région pour voir du contenu local et connecter avec d&apos;autres Québécois de ta région! ⚜️
          </p>
        </div>

        {/* Region Selection */}
        <div className="leather-card rounded-xl p-4 stitched">
          <h3 className="text-white font-semibold mb-4">Choisis ta région</h3>
          <div className="grid grid-cols-1 gap-2">
            {QUEBEC_REGIONS.map((region) => {
              const isSelected = preferences.region === region.id;
              
              return (
                <button
                  key={region.id}
                  onClick={() => handleRegionSelect(region.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-gold-500/20 border-2 border-gold-500'
                      : 'bg-leather-800/50 border-2 border-transparent hover:bg-leather-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{region.emoji}</span>
                      <span className="text-white font-medium">{region.name}</span>
                    </div>
                    {isSelected && (
                      <span className="text-gold-500 text-xl">✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default RegionSettings;

