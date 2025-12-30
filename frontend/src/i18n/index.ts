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
  },
  "pt-BR": {
    "nav.feed": "Feed",
    "nav.explore": "Explorar",
    "nav.stories": "Stories",
    "nav.notifications": "Notificações",
    "nav.profile": "Meu Perfil",
    "auth.login": "Entrar",
    "auth.signup": "Cadastrar",
    "auth.logout": "Sair",
    "action.share": "Compartilhar",
    "action.comment": "Comentar",
    "action.gift": "Enviar Presente",
    "onboarding.complete": "Bora!",
    "view.banned_account": "Conta suspensa por violação grave de segurança.",
    "view.banned_message":
      "A Conexão tem tolerância zero com aliciamento ou interações impróprias. Tentativas resultam em banimento permanente.",
    "safety.zero_tolerance_full":
      "A Conexão aplica uma política de tolerância zero referente a qualquer forma de aliciamento ou interação imprópria com menores. Qualquer tentativa detectada resultará na remoção imediata do conteúdo, desativação permanente da conta e denúncia às autoridades competentes.",
    "guest.mode": "Modo Visitante",
    "guest.description":
      "Você está visitando. Crie seu perfil para desbloquear a experiência completa.",
    "guest.cta": "Entrar na Conexão",
    "ephemeral.label": "Efêmero",
    "ephemeral.status_burned": "Queimado",
  },
  "es-AR": {
    "nav.feed": "Inicio",
    "nav.explore": "Explorar",
    "nav.stories": "Historias",
    "nav.notifications": "Noti",
    "nav.profile": "Mi Perfil",
    "auth.login": "Entrar",
    "auth.signup": "Registrarse",
    "auth.logout": "Salir",
    "action.share": "Compartir",
    "action.comment": "Comentar",
    "action.gift": "Regalar",
    "onboarding.complete": "¡Dale!",
    "view.banned_account": "Cuenta suspendida.",
    "view.banned_message":
      "En Zarpado no nos cabe el grooming. Corta la bocha.",
    "safety.zero_tolerance_full": "Cero tolerancia con el grooming en Zarpado.",
    "guest.mode": "Modo Visitante",
    "guest.description": "Estás de visita, che. Hacete un perfil.",
    "guest.cta": "Entrar a Zarpado",
    "ephemeral.label": "Fantasma",
    "ephemeral.status_burned": "Quemado",
  },
  "es-MX": {
    "nav.feed": "Inicio",
    "nav.explore": "Explorar",
    "nav.stories": "Historias",
    "nav.notifications": "Notificaciones",
    "nav.profile": "Mi Perfil",
    "auth.login": "Iniciar Sesión",
    "auth.signup": "Registrarse",
    "auth.logout": "Cerrar Sesión",
    "action.share": "Compartir",
    "action.comment": "Comentar",
    "action.gift": "Enviar Regalo",
    "onboarding.complete": "¡Vamos!",
    "view.banned_account": "Cuenta suspendida.",
    "view.banned_message": "En Ritual no nos cabe el grooming. Corta la bocha.",
    "safety.zero_tolerance_full": "Cero tolerancia con el grooming en Ritual.",
    "guest.mode": "Modo Visitante",
    "guest.description": "Estás de visita, wey. Hazte un perfil.",
    "guest.cta": "Entrar al Ritual",
    "ephemeral.label": "Fugaz",
    "ephemeral.status_burned": "Ceniza",
  },
};

export function useTranslation() {
  const locale = AppConfig.identity.locale;
  const t = (key: string) => {
    return TRANSLATIONS[locale]?.[key] || TRANSLATIONS["fr-CA"][key] || key;
  };

  return { t, locale };
}
