/**
 * Privacy and Security Settings Page
 */

import React from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";

export const PrivacySettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();

  const handleToggle = (
    path:
      | "privacy.privateAccount"
      | "privacy.twoFactor"
      | "privacy.loginAlerts",
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
              onClick={() =>
                handleToggle(
                  "privacy.privateAccount",
                  !preferences.privacy.privateAccount,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
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
