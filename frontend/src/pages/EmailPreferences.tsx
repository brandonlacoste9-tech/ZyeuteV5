/**
 * EmailPreferences Page - Manage email notification preferences
 * Reads and writes notification prefs from user_profiles via Supabase
 */

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";

const prefLogger = logger.withContext("EmailPreferences");

interface EmailPrefs {
  emailNewFollower: boolean;
  emailNewComment: boolean;
  emailNewReaction: boolean;
  emailNewGift: boolean;
  emailDigestWeekly: boolean;
  emailPromotional: boolean;
  emailSystemUpdates: boolean;
}

const DEFAULT_PREFS: EmailPrefs = {
  emailNewFollower: true,
  emailNewComment: true,
  emailNewReaction: false,
  emailNewGift: true,
  emailDigestWeekly: true,
  emailPromotional: false,
  emailSystemUpdates: true,
};

const PREF_LABELS: { key: keyof EmailPrefs; label: string; desc: string }[] = [
  {
    key: "emailNewFollower",
    label: "Nouvel abonné",
    desc: "Reçois un email quand quelqu'un s'abonne à toi",
  },
  {
    key: "emailNewComment",
    label: "Nouveau commentaire",
    desc: "Reçois un email quand on commente tes publications",
  },
  {
    key: "emailNewReaction",
    label: "Nouvelles réactions",
    desc: "Reçois un email pour chaque réaction sur tes publications",
  },
  {
    key: "emailNewGift",
    label: "Cadeau reçu",
    desc: "Reçois un email quand quelqu'un t'envoie un cadeau Piasse",
  },
  {
    key: "emailDigestWeekly",
    label: "Résumé hebdomadaire",
    desc: "Un résumé de tes stats chaque semaine (lundi matin)",
  },
  {
    key: "emailPromotional",
    label: "Offres & nouveautés",
    desc: "Nouvelles fonctionnalités, concours et promotions Zyeuté",
  },
  {
    key: "emailSystemUpdates",
    label: "Mises à jour système",
    desc: "Sécurité, conditions d'utilisation et mises à jour importantes",
  },
];

const EmailPreferences: React.FC = () => {
  const [prefs, setPrefs] = useState<EmailPrefs>(DEFAULT_PREFS);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Load current prefs from user_profiles
  useEffect(() => {
    const loadPrefs = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;
        setUserId(user.id);

        const { data, error } = await supabase
          .from("user_profiles")
          .select("email, email_preferences")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data?.email) setUserEmail(data.email);

        if (
          data?.email_preferences &&
          typeof data.email_preferences === "object"
        ) {
          setPrefs({
            ...DEFAULT_PREFS,
            ...(data.email_preferences as Partial<EmailPrefs>),
          });
        }
      } catch (err) {
        prefLogger.error("Failed to load email preferences:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrefs();
  }, []);

  const handleToggle = (key: keyof EmailPrefs) => {
    // System updates can't be disabled
    if (key === "emailSystemUpdates") return;
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    setSavedMsg(null);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ email_preferences: prefs })
        .eq("id", userId);

      if (error) throw error;
      setSavedMsg("Préférences sauvegardées ✓");
      setTimeout(() => setSavedMsg(null), 3000);
    } catch (err) {
      prefLogger.error("Failed to save email preferences:", err);
      setSavedMsg("Erreur lors de la sauvegarde. Réessaie.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    const allOff: EmailPrefs = {
      emailNewFollower: false,
      emailNewComment: false,
      emailNewReaction: false,
      emailNewGift: false,
      emailDigestWeekly: false,
      emailPromotional: false,
      emailSystemUpdates: true, // always kept
    };
    setPrefs(allOff);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold-400 animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title="Préférences email" showBack={true} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Email address display */}
        {userEmail && (
          <div className="card-edge p-4 mb-6">
            <p className="text-white/60 text-sm mb-1">
              Notifications envoyées à
            </p>
            <p className="text-white font-semibold">{userEmail}</p>
          </div>
        )}

        {/* Preference toggles */}
        <div className="card-edge divide-y divide-white/10 mb-6">
          {PREF_LABELS.map(({ key, label, desc }) => {
            const isLocked = key === "emailSystemUpdates";
            const isEnabled = prefs[key];
            return (
              <div
                key={key}
                className="flex items-start justify-between gap-4 p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{label}</p>
                    {isLocked && (
                      <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded">
                        Requis
                      </span>
                    )}
                  </div>
                  <p className="text-white/50 text-sm mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => handleToggle(key)}
                  disabled={isLocked}
                  className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                    isEnabled ? "bg-gold-500" : "bg-white/20"
                  } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  aria-label={`${isEnabled ? "Désactiver" : "Activer"} ${label}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      isEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 rounded-xl bg-gold-gradient text-black font-bold text-lg transition-opacity disabled:opacity-60 mb-3"
        >
          {isSaving ? "Sauvegarde..." : "Sauvegarder les préférences"}
        </button>

        {savedMsg && (
          <p
            className={`text-center text-sm mt-2 ${
              savedMsg.includes("Erreur") ? "text-red-400" : "text-green-400"
            }`}
          >
            {savedMsg}
          </p>
        )}

        {/* Unsubscribe all link */}
        <button
          onClick={handleUnsubscribeAll}
          className="w-full text-center text-white/40 text-sm mt-4 hover:text-white/60 transition-colors"
        >
          Se désabonner de tous les emails (sauf les essentiels)
        </button>

        <p className="text-white/30 text-xs text-center mt-6">
          Tu peux modifier ces préférences à tout moment. Les emails systèmes ne
          peuvent pas être désactivés car ils contiennent des informations
          importantes sur ton compte.
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default EmailPreferences;
