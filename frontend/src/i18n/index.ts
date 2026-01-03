import { AppConfig } from "../config/factory";

/**
 * Universal Translation Map
 * Add common UI strings here.
 * specific branding is pulled from AppConfig.identity.
 */
const TRANSLATIONS: Record<string, Record<string, string>> = {
  "fr-CA": {
    "nav.feed": "Fil d'actualité",
    "nav.explore": "Explorer",
    "nav.stories": "Histoires",
    "nav.notifications": "Notifications",
    "nav.profile": "Mon Profil",
    "auth.login": "Se connecter",
    "auth.signup": "S'inscrire",
    "auth.logout": "Déconnexion",
    "action.share": "Partager",
    "action.comment": "Commenter",
    "action.gift": "Offrir un cadeau",
    "onboarding.complete": "C'est parti !",
    "view.banned_account":
      "Compte suspendu pour violation grave des règles de sécurité.",
    "view.banned_message":
      "Zyeuté applique une politique de tolérance zéro concernant toute forme de leurre, grooming ou interaction inappropriée impliquant des mineurs. Toute tentative détectée entraîne la désactivation permanente du compte.",
    "safety.zero_tolerance_full":
      "Zyeuté applique une politique de tolérance zéro concernant toute forme de leurre, grooming ou interaction inappropriée impliquant des mineurs. Toute tentative détectée entraîne la suppression immédiate du contenu, la désactivation permanente du compte et le signalement interne requis par nos protocoles de sécurité. Les utilisateurs sont entièrement responsables du contenu qu’ils créent et partagent.",
    "guest.mode": "Mode Visiteur",
    "guest.description":
      "Vous explorez en tant qu'invité. Créez un profil pour l'expérience complète.",
    "guest.cta": "Rejoindre le Swarm",
    "ephemeral.label": "Éphémère",
    "ephemeral.status_burned": "Brûlé",
    "settings.title": "Paramètres et activité",
    "settings.search_placeholder": "Rechercher des paramètres...",
    "settings.activity": "Ton activité",
    "settings.what_you_see": "Ce que tu vois",
    "settings.app_and_media": "Ton app et médias",
    "settings.personalization": "Personnalisation",
    "settings.accent_lighting": "Éclairage d'accent",
    "settings.accent_desc": "Modifie la lueur des bords de ton application",
    "settings.quebec_pride": "Fierté Québécoise",
    "settings.logout": "Se déconnecter",
    "settings.tags_mentions": "Tags et mentions",
    "settings.comments_label": "Commentaires",
    "settings.sharing_remixes": "Partage et remixes",
    "settings.restricted_accounts": "Comptes restreints",
    "settings.favorites_label": "Favoris",
    "settings.muted_accounts": "Comptes masqués",
    "settings.content_preferences": "Préférences de contenu",
    "settings.photos_videos": "Photos et vidéos",
    "settings.audio_music": "Audio et musique",
    "settings.storage_data": "Stockage et données",
    "settings.app_settings": "Paramètres de l'app",
    "settings.quebec_region": "Région du Québec",
    "settings.language_label": "Langue",
    "settings.tiguy_assistant": "Ti-Guy Assistant",
    "settings.parental_hq": "QG Parental",
    "settings.edit_profile": "Modifier le profil",
    "settings.privacy_security": "Confidentialité et sécurité",
    "settings.notifications_label": "Notifications",
    "settings.premium_subscription": "Abonnement Premium",
    "settings.logout_guest": "Quitter le mode invité?",
    "settings.logout_confirm": "Es-tu sûr de vouloir te déconnecter?",
    "settings.closing": "Fermeture...",
    "settings.logging_out": "Déconnexion...",
    "settings.see_you": "À la prochaine! 👋",
    "settings.lang_badge": "FR",
    "settings.new_badge": "NOUVEAU",
    "loading.default": "Chargement...",
    "loading.tagline": "Fait au Québec, pour le Québec 🇨🇦⚜️",
    "toast.success": "Succès ✨",
    "toast.error": "Erreur 🛑",
    "toast.info": "Info ℹ️",
    "toast.warning": "Alerte ⚠️",
  },
  "en-US": {
    "nav.feed": "Feed",
    "nav.explore": "Explore",
    "nav.stories": "Stories",
    "nav.notifications": "Notifications",
    "nav.profile": "My Profile",
    "auth.login": "Log In",
    "auth.signup": "Sign Up",
    "auth.logout": "Log Out",
    "action.share": "Share",
    "action.comment": "Comment",
    "action.gift": "Send Gift",
    "onboarding.complete": "Let's Go!",
    "view.banned_account": "Account suspended for serious security violations.",
    "view.banned_message":
      "Zyeuté has a zero-tolerance policy for child safety violations. Detected attempts result in permanent bans.",
    "safety.zero_tolerance_full":
      "Zyeuté enforces zero tolerance for grooming or inappropriate minor interaction. Attempts lead to immediate account deletion and reporting.",
    "guest.mode": "Guest Mode",
    "guest.description":
      "You are exploring as a guest. Create a profile for the full experience.",
    "guest.cta": "Join the Swarm",
    "ephemeral.label": "Ephemeral",
    "ephemeral.status_burned": "Burned",
    "settings.title": "Settings and Activity",
    "settings.search_placeholder": "Search settings...",
    "settings.activity": "Your activity",
    "settings.what_you_see": "What you see",
    "settings.app_and_media": "Your app and media",
    "settings.personalization": "Personalization",
    "settings.accent_lighting": "Accent Lighting",
    "settings.accent_desc": "Modify the edge glow of your application",
    "settings.quebec_pride": "Quebec Heritage",
    "settings.logout": "Log Out",
    "settings.tags_mentions": "Tags and Mentions",
    "settings.comments_label": "Comments",
    "settings.sharing_remixes": "Sharing and Remixes",
    "settings.restricted_accounts": "Restricted Accounts",
    "settings.favorites_label": "Favorites",
    "settings.muted_accounts": "Muted Accounts",
    "settings.content_preferences": "Content Preferences",
    "settings.photos_videos": "Photos and Videos",
    "settings.audio_music": "Audio and Music",
    "settings.storage_data": "Storage and Data",
    "settings.app_settings": "App Settings",
    "settings.quebec_region": "Quebec Region",
    "settings.language_label": "Language",
    "settings.tiguy_assistant": "Ti-Guy Assistant",
    "settings.parental_hq": "Parental HQ",
    "settings.edit_profile": "Edit Profile",
    "settings.privacy_security": "Privacy and Security",
    "settings.notifications_label": "Notifications",
    "settings.premium_subscription": "Premium Subscription",
    "settings.logout_guest": "Exit guest mode?",
    "settings.logout_confirm": "Are you sure you want to log out?",
    "settings.closing": "Closing...",
    "settings.logging_out": "Logging out...",
    "settings.see_you": "See you soon! 👋",
    "settings.lang_badge": "EN",
    "settings.new_badge": "NEW",
    "loading.default": "Loading...",
    "loading.tagline": "Made in Quebec, for Quebec 🇨🇦⚜️",
    "toast.success": "Success ✨",
    "toast.error": "Error 🛑",
    "toast.info": "Info ℹ️",
    "toast.warning": "Warning ⚠️",
  },
};

export function useTranslation() {
  // Use preference if saved, else use AppConfig identity
  const getLocale = () => {
    try {
      const prefs = localStorage.getItem("zyeute_settings_preferences");
      if (prefs) {
        const parsed = JSON.parse(prefs);
        if (parsed.language === "en") return "en-US";
        if (parsed.language === "fr") return "fr-CA";
      }
    } catch {}
    return AppConfig.identity.locale;
  };

  const locale = getLocale();

  const t = (key: string) => {
    return TRANSLATIONS[locale]?.[key] || TRANSLATIONS["fr-CA"]?.[key] || key;
  };

  return { t, locale };
}
