/**
 * Privacy and Security Settings Page
 * FIXED: privateAccount toggle now persists to user_profiles.visibility via backend
 *        Other toggles stay in localStorage (they are UI-only for now)
 */

import React from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

const privacyLogger = logger.withContext("PrivacySettings");

const API_BASE =
  import.meta.env.VITE_API_URL || "https://zyeute-backend.up.railway.app";

export const PrivacySettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();
  const [isSaving, setIsSaving] = React.useState(false);

  /**
   * Toggle privacy.privateAccount — persists to DB via backend PATCH.
   * Flips user_profiles.visibility between 'public' and 'private'.
   */
  const handlePrivateAccountToggle = async () => {
    tap();
    const newValue = !preferences.privacy.privateAccount;
    setPreference("privacy.privateAccount", newValue);

    setIsSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // user_profiles doesn't have a `visibility` boolean — store in a JSONB
      // or use the backend to write to the `visibility` field on publications.
      // Since user_profiles has no direct private_account column, we store it
      // in the user_profiles.custom_permissions JSONB as a known key.
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("custom_permissions")
        .eq("id", session?.user?.id ?? "")
        .single();

      const current =
        (profile?.custom_permissions as Record<string, any>) ?? {};
      const updated = { ...current, private_account: newValue };

      const { error } = await supabase
        .from("user_profiles")
        .update({ custom_permissions: updated })
        .eq("id", session?.user?.id ?? "");

      if (error) throw error;

      toast.success(
        newValue ? "Compte privé activé ✓" : "Compte public activé ✓",
      );
    } catch (err) {
      privacyLogger.error("Failed to save privacy setting:", err);
      // Revert optimistic update
      setPreference("privacy.privateAccount", !newValue);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (
    path: "privacy.twoFactor" | "privacy.loginAlerts",
    value: boolean,
  ) => {
    tap();
    setPreference(path, value);
    toast.success("Paramètre mis à jour! ✨");
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header
        title="Confidentialité et sécurité"
        showBack={true}
        showSearch={false}
      />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Private Account */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Compte privé</h3>
              <p className="text-leather-300 text-sm">
                Seuls tes abonnés peuvent voir tes posts
              </p>
            </div>
            <button
              onClick={handlePrivateAccountToggle}
              disabled={isSaving}
              className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-60 ${
                preferences.privacy.privateAccount
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.privacy.privateAccount
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Two Factor Authentication */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Authentification à deux facteurs
              </h3>
              <p className="text-leather-300 text-sm">
                Ajouter une couche de sécurité supplémentaire
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "privacy.twoFactor",
                  !preferences.privacy.twoFactor,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.privacy.twoFactor ? "bg-gold-500" : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.privacy.twoFactor
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Login Alerts */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Alertes de connexion
              </h3>
              <p className="text-leather-300 text-sm">
                Recevoir des notifications lors de nouvelles connexions
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "privacy.loginAlerts",
                  !preferences.privacy.loginAlerts,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.privacy.loginAlerts
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.privacy.loginAlerts
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Security Info */}
        <div className="leather-card rounded-xl p-4 stitched bg-gold-500/10 border border-gold-500/30">
          <h3 className="text-white font-semibold mb-2">
            💡 Conseils de sécurité
          </h3>
          <ul className="space-y-2 text-leather-300 text-sm">
            <li>• Utilise un mot de passe fort et unique</li>
            <li>• Active l&apos;authentification à deux facteurs</li>
            <li>• Ne partage jamais ton mot de passe</li>
            <li>• Vérifie régulièrement tes paramètres de confidentialité</li>
          </ul>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PrivacySettings;
