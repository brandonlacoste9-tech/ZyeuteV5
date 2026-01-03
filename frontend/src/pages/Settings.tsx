/**
 * Settings Page - Premium Quebec Heritage Design
 * Instagram-style layout with beaver leather & gold aesthetic
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { getCurrentUser, logout } from "@/services/api";
import { toast } from "@/components/Toast";
import { generateId } from "@/lib/utils";
import { QUEBEC_REGIONS } from "@/lib/quebecFeatures";
import { useBorderColor } from "@/contexts/BorderColorContext";
import { useHaptics } from "@/hooks/useHaptics";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/types";
import { logger } from "../lib/logger";

const settingsLogger = logger.withContext("Settings");
import { useTranslation } from "@/i18n";

interface SettingItem {
  icon: React.ReactNode;
  label: string;
  path?: string;
  badge?: string;
  onClick?: () => void;
}

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const { borderColor, setBorderColor, defaultGold } = useBorderColor();
  const { tap, success, selection, impact } = useHaptics();
  const { isGuest, logout: authLogout } = useAuth();

  // Fetch current user
  React.useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        // If Guest, setup dummy user without API call
        if (isGuest) {
          setUser({
            id: "guest",
            username: "visiteur",
            display_name: "Visiteur",
            coins: 0,
            fire_score: 0,
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
            is_following: false,
          } as User);
          setIsLoading(false);
          return;
        }

        const currentUser = await getCurrentUser();

        if (!currentUser) {
          navigate("/login");
          return;
        }

        setUser(currentUser);
      } catch (error) {
        settingsLogger.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate, isGuest]);

  // Sign out
  const handleSignOut = async () => {
    const message = isGuest
      ? t("settings.logout_guest") || "Quitter le mode invité?"
      : t("settings.logout_confirm") || "Es-tu sûr de vouloir te déconnecter?";

    const confirmed = window.confirm(message);
    if (!confirmed) return;

    toast.info(
      isGuest
        ? t("settings.closing") || "Fermeture..."
        : t("settings.logging_out") || "Déconnexion...",
    );
    await authLogout();
    toast.success(t("settings.see_you") || "À la prochaine! 👋");
    setTimeout(() => navigate("/login"), 500);
  };

  // Handle border color change
  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    selection(); // Haptic feedback for color selection
    setBorderColor(event.target.value);
    toast.success("Couleur d'accent mise à jour! ✨");
  };

  // Reset to default gold
  const resetToGold = () => {
    tap(); // Haptic feedback for button press
    setBorderColor(defaultGold);
    success(); // Success haptic for completed action
    toast.success("Couleur réinitialisée à l'or par défaut! ⚜️");
  };

  // Settings sections
  const yourActivitySettings: SettingItem[] = [
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
      label: t("settings.tags_mentions"),
      path: "/settings/tags",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      label: t("settings.comments_label"),
      path: "/settings/comments",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      ),
      label: t("settings.sharing_remixes"),
      path: "/settings/sharing",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      ),
      label: t("settings.restricted_accounts"),
      path: "/settings/restricted",
    },
  ];

  const whatYouSeeSettings: SettingItem[] = [
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
      label: t("settings.favorites_label"),
      path: "/settings/favorites",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
          />
        </svg>
      ),
      label: t("settings.muted_accounts"),
      path: "/settings/muted",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      ),
      label: t("settings.content_preferences"),
      path: "/settings/content",
    },
  ];

  const appAndMediaSettings: SettingItem[] = [
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      label: t("settings.photos_videos"),
      path: "/settings/media",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      ),
      label: t("settings.audio_music"),
      path: "/settings/audio",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      label: t("settings.storage_data"),
      path: "/settings/storage",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      label: t("settings.app_settings"),
      path: "/settings/app",
    },
  ];

  const quebecSettings: SettingItem[] = [
    {
      icon: <span className="text-2xl">⚜️</span>,
      label: t("settings.quebec_region"),
      path: "/settings/region",
      badge: user?.region
        ? QUEBEC_REGIONS.find((r) => r.id === user.region)?.emoji
        : undefined,
    },
    {
      icon: <span className="text-2xl">🇨🇦</span>,
      label: t("settings.language_label"),
      path: "/settings/language",
      badge: t("settings.lang_badge") || "FR",
    },
    {
      icon: <span className="text-2xl">🦫</span>,
      label: t("settings.tiguy_assistant"),
      path: "/settings/voice",
    },
  ];

  const accountSettings: SettingItem[] = [
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      label: t("settings.parental_hq"),
      path: "/parental",
      badge: t("settings.new_badge") || "NOUVEAU",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      label: t("settings.edit_profile"),
      path: "/settings/profile",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      label: t("settings.privacy_security"),
      path: "/settings/privacy",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
      label: t("settings.notifications_label"),
      path: "/settings/notifications",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: t("settings.premium_subscription"),
      path: "/premium",
      badge: user?.isPremium ? "⭐" : undefined,
    },
  ];

  // For Guests, remove account-specific settings
  const filteredAccountSettings = isGuest ? [] : accountSettings;

  // Filter settings based on search
  const filterSettings = (items: SettingItem[]) => {
    if (!searchQuery) return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  // Handle setting item click
  const handleSettingClick = (item: SettingItem) => {
    tap();

    // Routes that exist
    const existingRoutes = [
      "/settings/tags",
      "/settings/comments",
      "/settings/sharing",
      "/settings/restricted",
      "/settings/favorites",
      "/settings/muted",
      "/settings/content",
      "/settings/media",
      "/settings/audio",
      "/settings/storage",
      "/settings/app",
      "/settings/region",
      "/settings/language",
      "/settings/voice",
      "/settings/profile",
      "/settings/privacy",
      "/settings/notifications",
      "/premium",
      "/parental", // Added this
    ];

    if (item.path && existingRoutes.includes(item.path)) {
      navigate(item.path);
    } else if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      // Route doesn't exist yet - show coming soon message
      toast.info(`"${item.label}" sera disponible bientôt! ⚜️`);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-black leather-overlay flex items-center justify-center">
        <div className="text-gold-500 animate-pulse-gold">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-gold-500/30">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={() => {
              tap();
              navigate(-1);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-leather-900 border border-gold-500/20 text-gold-500 hover:bg-gold-500 hover:text-black transition-all"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300 bg-clip-text text-transparent embossed flex-1">
            {t("settings.title")}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="leather-card rounded-2xl p-0.5 border-gold-500/10 shadow-xl overflow-hidden stitched-subtle">
            <div className="bg-leather-950/80 px-4 py-4 flex items-center gap-3">
              <svg
                className="w-6 h-6 text-gold-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  t("settings.search_placeholder") || "Rechercher..."
                }
                className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder-leather-500 focus:placeholder-gold-500/40"
              />
            </div>
          </div>
        </div>

        {/* Your Activity Section */}
        <div className="mb-8">
          <h3 className="text-gold-500/60 text-sm font-bold uppercase tracking-[0.2em] mb-4 px-2 flex items-center gap-2">
            <span className="w-8 h-px bg-gold-500/30"></span>
            {t("settings.activity") || "Ton activité"}
            <span className="flex-1 h-px bg-gold-500/30"></span>
          </h3>
          <div className="leather-card rounded-3xl border border-gold-500/10 shadow-2xl overflow-hidden stitched">
            <div className="bg-leather-900/60 divide-y divide-gold-500/5">
              {filterSettings(yourActivitySettings).map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSettingClick(item)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-gold-500/5 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-leather-800 flex items-center justify-center text-leather-400 group-hover:text-gold-500 group-hover:bg-leather-700 transition-all border border-leather-700 group-hover:border-gold-500/30">
                    {item.icon}
                  </div>
                  <span className="flex-1 text-white font-semibold text-lg group-hover:text-gold-400 transition-colors">
                    {item.label}
                  </span>
                  <div className="text-leather-600 group-hover:text-gold-500 transform group-hover:translate-x-1 transition-all">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* What You See Section */}
        <div className="mb-8">
          <h3 className="text-gold-500/60 text-sm font-bold uppercase tracking-[0.2em] mb-4 px-2 flex items-center gap-2">
            <span className="w-8 h-px bg-gold-500/30"></span>
            {t("settings.what_you_see") || "Ce que tu vois"}
            <span className="flex-1 h-px bg-gold-500/30"></span>
          </h3>
          <div className="leather-card rounded-3xl border border-gold-500/10 shadow-2xl overflow-hidden stitched">
            <div className="bg-leather-900/60 divide-y divide-gold-500/5">
              {filterSettings(whatYouSeeSettings).map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSettingClick(item)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-gold-500/5 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-leather-800 flex items-center justify-center text-leather-400 group-hover:text-gold-500 group-hover:bg-leather-700 transition-all border border-leather-700 group-hover:border-gold-500/30">
                    {item.icon}
                  </div>
                  <span className="flex-1 text-white font-semibold text-lg group-hover:text-gold-400 transition-colors">
                    {item.label}
                  </span>
                  <div className="text-leather-600 group-hover:text-gold-500 transform group-hover:translate-x-1 transition-all">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Your App and Media Section */}
        <div className="mb-8">
          <h3 className="text-gold-500/60 text-sm font-bold uppercase tracking-[0.2em] mb-4 px-2 flex items-center gap-2">
            <span className="w-8 h-px bg-gold-500/30"></span>
            {t("settings.app_and_media") || "Ton app et médias"}
            <span className="flex-1 h-px bg-gold-500/30"></span>
          </h3>
          <div className="leather-card rounded-3xl border border-gold-500/10 shadow-2xl overflow-hidden stitched">
            <div className="bg-leather-900/60 divide-y divide-gold-500/5">
              {filterSettings(appAndMediaSettings).map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSettingClick(item)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-gold-500/5 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-leather-800 flex items-center justify-center text-leather-400 group-hover:text-gold-500 group-hover:bg-leather-700 transition-all border border-leather-700 group-hover:border-gold-500/30">
                    {item.icon}
                  </div>
                  <span className="flex-1 text-white font-semibold text-lg group-hover:text-gold-400 transition-colors">
                    {item.label}
                  </span>
                  <div className="text-leather-600 group-hover:text-gold-500 transform group-hover:translate-x-1 transition-all">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Personalization Section */}
        <div className="mb-8">
          <h3 className="text-gold-500/60 text-sm font-bold uppercase tracking-[0.2em] mb-4 px-2 flex items-center gap-2">
            <span className="w-8 h-px bg-gold-500/30"></span>
            {t("settings.personalization")}
            <span className="flex-1 h-px bg-gold-500/30"></span>
          </h3>

          <div className="leather-card-elevated rounded-3xl overflow-hidden stitched shadow-2xl">
            {/* Header */}
            <div className="p-6 bg-leather-900/40 border-b border-gold-500/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-500 shadow-inner">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold text-white">
                    Éclairage d&apos;accent
                  </p>
                  <p className="text-leather-400 text-sm">
                    Modifie la lueur des bords de ton application
                  </p>
                </div>
              </div>

              {/* Current Color Preview */}
              <div className="flex items-center gap-6 mt-6 p-4 bg-black/40 rounded-2xl border border-gold-500/5">
                <div
                  className="w-20 h-20 rounded-2xl border-4 border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden group"
                  style={{
                    backgroundColor: borderColor,
                    boxShadow: `0 0 30px ${borderColor}44`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                </div>
                <div className="flex-1">
                  <p className="text-gold-500 text-xs font-bold uppercase tracking-widest mb-1">
                    Couleur Active
                  </p>
                  <p className="text-white text-2xl font-mono font-bold tracking-tight">
                    {borderColor.toUpperCase()}
                  </p>
                  <button
                    onClick={resetToGold}
                    className="mt-2 text-gold-500/70 hover:text-gold-400 text-xs font-bold underline transition-colors"
                  >
                    Réinitialiser à l&apos;or mythique
                  </button>
                </div>
              </div>
            </div>

            {/* Preset Colors */}
            <div className="p-6 bg-leather-950/40">
              <p className="text-leather-400 text-xs font-bold uppercase tracking-widest mb-4">
                Palettes Prédéfinies
              </p>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { name: "Or Mythique", color: "#FFBF00" },
                  { name: "Rouge Nordique", color: "#FF4444" },
                  { name: "Bleu St-Laurent", color: "#4444FF" },
                  { name: "Vert Forêt", color: "#44FF44" },
                  { name: "Aurore Violette", color: "#B744FF" },
                  { name: "Cyan Glacé", color: "#00D4FF" },
                  { name: "Rose Sucré", color: "#FF0080" },
                  { name: "Orange Solaire", color: "#FF8800" },
                ].map((preset) => (
                  <button
                    key={preset.color}
                    onClick={() => {
                      tap();
                      setBorderColor(preset.color);
                      success();
                      toast.success(`Style ${preset.name} appliqué! ✨`);
                    }}
                    className={`relative group aspect-square rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center overflow-hidden ${
                      borderColor.toUpperCase() === preset.color.toUpperCase()
                        ? "border-gold-500 ring-4 ring-gold-500/20"
                        : "border-white/5 hover:border-gold-500/40"
                    }`}
                    style={{
                      backgroundColor: preset.color,
                      boxShadow:
                        borderColor.toUpperCase() === preset.color.toUpperCase()
                          ? `0 0 15px ${preset.color}66`
                          : "none",
                    }}
                    title={preset.name}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {borderColor.toUpperCase() ===
                      preset.color.toUpperCase() && (
                      <div className="bg-black/20 backdrop-blur-sm rounded-full p-2">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Advanced Custom Picker */}
              <div className="mt-8 flex items-center gap-4 p-4 bg-black/30 rounded-2xl border border-white/5">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gold-500/30 group cursor-pointer active:scale-90 transition-transform">
                  <input
                    type="color"
                    value={borderColor}
                    onChange={handleColorChange}
                    className="absolute inset-0 w-full h-full scale-150 cursor-pointer bg-transparent"
                  />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    Couleur personnalisée
                  </p>
                  <p className="text-gold-500/50 text-xs font-mono uppercase">
                    {borderColor}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="listItem-premium rounded-2xl p-4 mb-10 border border-red-500/20 shadow-lg mt-8">
            <button
              onClick={() => {
                impact();
                handleSignOut();
              }}
              className="w-full text-center py-2 text-red-400 font-bold hover:text-red-300 transition-colors uppercase tracking-widest text-sm"
            >
              {isGuest ? "Quitter le mode invité" : "Se déconnecter"}
            </button>
          </div>

          {/* App Info */}
          <div className="text-center text-leather-400 text-sm space-y-2 pb-10">
            <p className="flex items-center justify-center gap-2">
              <span className="text-gold-500">⚜️</span>
              <span className="font-bold tracking-widest">ZYEU-TÉ v1.0.42</span>
            </p>
            <p className="text-xs italic opacity-60">
              Fait au Québec avec fierté 🦫⚜️
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
