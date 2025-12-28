
import { AppConfig } from '../config/factory';

/**
 * Universal Translation Map
 * Add common UI strings here. 
 * specific branding is pulled from AppConfig.identity.
 */
const TRANSLATIONS: Record<string, Record<string, string>> = {
  'fr-CA': {
    'nav.feed': 'Fil d\'actualité',
    'nav.explore': 'Explorer',
    'nav.stories': 'Histoires',
    'nav.notifications': 'Notifications',
    'nav.profile': 'Mon Profil',
    'auth.login': 'Se connecter',
    'auth.signup': 'S\'inscrire',
    'auth.logout': 'Déconnexion',
    'action.share': 'Partager',
    'action.comment': 'Commenter',
    'action.gift': 'Offrir un cadeau',
    'onboarding.complete': 'C\'est parti !',
  },
  'es-MX': {
    'nav.feed': 'Noticias',
    'nav.explore': 'Explorar',
    'nav.stories': 'Historias',
    'nav.notifications': 'Notificaciones',
    'nav.profile': 'Mi Perfil',
    'auth.login': 'Iniciar Sesión',
    'auth.signup': 'Registrarse',
    'auth.logout': 'Cerrar Sesión',
    'action.share': 'Compartir',
    'action.comment': 'Comentar',
    'action.gift': 'Enviar Regalo',
    'onboarding.complete': '¡Vamos!',
  }
};

export function useTranslation() {
  const locale = AppConfig.identity.locale;
  const t = (key: string) => {
    return TRANSLATIONS[locale]?.[key] || TRANSLATIONS['fr-CA'][key] || key;
  };

  return { t, locale };
}
