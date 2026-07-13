/**
 * Content Preferences Settings Page
 * Includes Pour Toi affinity tags (interests).
 */

import React, { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";
import { apiCall } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

/** Catalog matches backend AFFINITY_TAG_CATALOG */
const INTEREST_CATALOG: { id: string; label: string }[] = [
  { id: "hockey", label: "Hockey 🏒" },
  { id: "canadiens", label: "Canadiens" },
  { id: "humour", label: "Humour" },
  { id: "musique", label: "Musique" },
  { id: "food", label: "Bouffe" },
  { id: "poutine", label: "Poutine 🍟" },
  { id: "montreal", label: "Montréal" },
  { id: "quebec", label: "Québec" },
  { id: "nature", label: "Nature" },
  { id: "hiver", label: "Hiver" },
  { id: "voyage", label: "Voyage" },
  { id: "mode", label: "Mode" },
  { id: "sports", label: "Sports" },
  { id: "gaming", label: "Gaming" },
  { id: "culture", label: "Culture" },
  { id: "festival", label: "Festivals" },
  { id: "animaux", label: "Animaux" },
  { id: "beaute", label: "Beauté" },
  { id: "techno", label: "Techno" },
  { id: "cinema", label: "Cinéma" },
  { id: "fitness", label: "Fitness" },
  { id: "art", label: "Art" },
  { id: "famille", label: "Famille" },
  { id: "nouvelles", label: "Nouvelles" },
];

export const ContentPreferencesSettings: React.FC = () => {
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap } = useHaptics();
  const { user, isGuest } = useAuth();
  const canSaveInterests = Boolean(user?.id) && !isGuest;
  const [affinityTags, setAffinityTags] = useState<string[]>([]);
  const [savingTags, setSavingTags] = useState(false);
  const [loadedTags, setLoadedTags] = useState(false);

  useEffect(() => {
    if (!canSaveInterests) {
      setLoadedTags(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiCall<{
          user?: { affinity_tags?: string[]; affinityTags?: string[] };
        }>("/users/me");
        const tags =
          data?.user?.affinity_tags ||
          data?.user?.affinityTags ||
          (user as { affinity_tags?: string[] } | null)?.affinity_tags ||
          [];
        if (!cancelled) setAffinityTags(Array.isArray(tags) ? tags : []);
      } catch {
        const fallback =
          (user as { affinity_tags?: string[] } | null)?.affinity_tags || [];
        if (!cancelled) setAffinityTags(fallback);
      } finally {
        if (!cancelled) setLoadedTags(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canSaveInterests, user]);

  const persistAffinity = useCallback(
    async (next: string[]) => {
      setAffinityTags(next);
      if (!canSaveInterests) {
        toast.error("Connecte-toi pour sauvegarder tes intérêts");
        return;
      }
      setSavingTags(true);
      try {
        const { error } = await apiCall("/users/me", {
          method: "PATCH",
          body: JSON.stringify({ affinityTags: next }),
        });
        if (error) {
          toast.error("Impossible de sauvegarder les intérêts");
        } else {
          toast.success("Intérêts Pour Toi mis à jour! ⚜️");
        }
      } catch {
        toast.error("Erreur réseau");
      } finally {
        setSavingTags(false);
      }
    },
    [canSaveInterests],
  );

  const toggleTag = (id: string) => {
    tap();
    const has = affinityTags.includes(id);
    const next = has
      ? affinityTags.filter((t) => t !== id)
      : [...affinityTags, id].slice(0, 40);
    void persistAffinity(next);
  };

  const handleToggle = (
    path: "content.personalizedAds" | "content.autoplayRecommendations",
    value: boolean,
  ) => {
    tap();
    setPreference(path, value);
    toast.success("Paramètre mis à jour! ✨");
  };

  const handleFilterLevel = (level: "strict" | "medium" | "off") => {
    tap();
    setPreference("content.sensitiveFilter", level);
    toast.success("Niveau de filtre mis à jour! ✨");
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header
        title="Préférences de contenu"
        showBack={true}
        showSearch={false}
      />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Pour Toi interests */}
        <div className="leather-card rounded-xl p-4 stitched">
          <h3 className="text-white font-semibold mb-1">
            Intérêts Pour Toi ⚜️
          </h3>
          <p className="text-leather-300 text-sm mb-3">
            Choisis ce que tu veux voir plus souvent dans ton fil. On apprend
            aussi de ce que tu regardes.
          </p>
          {!loadedTags ? (
            <p className="text-leather-400 text-sm">Chargement…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {INTEREST_CATALOG.map(({ id, label }) => {
                const on = affinityTags.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={savingTags}
                    onClick={() => toggleTag(id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      on
                        ? "bg-gold-500/25 border-gold-500 text-gold-300"
                        : "bg-leather-800/60 border-leather-600 text-leather-200 hover:border-gold-500/50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          {affinityTags.length > 0 && (
            <p className="text-leather-400 text-xs mt-3">
              {affinityTags.length} intérêt
              {affinityTags.length > 1 ? "s" : ""} sélectionné
              {affinityTags.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Sensitive Content Filter */}
        <div className="leather-card rounded-xl p-4 stitched">
          <h3 className="text-white font-semibold mb-3">
            Filtre de contenu sensible
          </h3>
          <div className="space-y-2">
            {(["strict", "medium", "off"] as const).map((level) => (
              <button
                key={level}
                onClick={() => handleFilterLevel(level)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  preferences.content.sensitiveFilter === level
                    ? "bg-gold-500/20 border-2 border-gold-500"
                    : "bg-leather-800/50 border-2 border-transparent hover:bg-leather-700/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">
                    {level === "strict" && "Strict"}
                    {level === "medium" && "Moyen"}
                    {level === "off" && "Désactivé"}
                  </span>
                  {preferences.content.sensitiveFilter === level && (
                    <span className="text-gold-500">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Personalized Ads */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Publicités personnalisées
              </h3>
              <p className="text-leather-300 text-sm">
                Afficher des publicités basées sur tes intérêts
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "content.personalizedAds",
                  !preferences.content.personalizedAds,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.content.personalizedAds
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.content.personalizedAds
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Autoplay Recommendations */}
        <div className="leather-card rounded-xl p-4 stitched">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Lecture automatique des recommandations
              </h3>
              <p className="text-leather-300 text-sm">
                Lire automatiquement les vidéos recommandées
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle(
                  "content.autoplayRecommendations",
                  !preferences.content.autoplayRecommendations,
                )
              }
              className={`relative w-14 h-8 rounded-full transition-colors ${
                preferences.content.autoplayRecommendations
                  ? "bg-gold-500"
                  : "bg-leather-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  preferences.content.autoplayRecommendations
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

export default ContentPreferencesSettings;
