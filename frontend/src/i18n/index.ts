import { AppConfig } from "../config/factory";

/**
 * Universal Translation Map
 * Add common UI strings here.
 * specific branding is pulled from AppConfig.identity.
 */
const TRANSLATIONS: Record<string, Record<string, string>> = {
  "fr-CA": {
    // Navigation
    "nav.feed": "Fil d'actualité",
    "nav.explore": "Explorer",
    "nav.stories": "Histoires",
    "nav.notifications": "Notifications",
    "nav.profile": "Mon Profil",
    "nav.home": "Accueil",
    "nav.discover": "Découvrir",
    "nav.create": "Créer",
    "nav.notifications_short": "Notifs",

    // Auth
    "auth.login": "Se connecter",
    "auth.signup": "S'inscrire",
    "auth.logout": "Déconnexion",

    // Actions
    "action.share": "Partager",
    "action.comment": "Commenter",
    "action.gift": "Offrir un cadeau",

    // Button Labels
    "btn_follow": "Suivre",
    "btn_following": "Abonné·e(s)",
    "btn_unfollow": "Ne plus suivre",
    "btn_like": "Feux",
    "btn_save": "Enregistrer",
    "btn_add": "Ajouter",

    // Labels
    "lbl_comments": "Commentaires",
    "lbl_write_comment": "Écris un commentaire…",
    "lbl_post_comment": "Envoyer",
    "lbl_views": "Vues",
    "lbl_followers": "Abonnés",
    "lbl_following": "Abonnements",
    "lbl_recent_videos": "Vidéos récentes",
    "lbl_settings": "Paramètres",
    "lbl_posts": "Publications",

    // Toasts
    "toast_video_saved": "Vidéo enregistrée",
    "toast_share_started": "Partage lancé",
    "toast_comment_posted": "Commentaire publié",
    "toast_network_error": "Impossible de se connecter. Vérifie ta connexion",
    "toast_comment_error": "Le commentaire n'a pas pu être envoyé",
    "toast_save_error": "Impossible d'enregistrer la vidéo",
    "toast_loading": "Chargement…",

    // Error Messages
    "error_video_unavailable": "Vidéo non disponible",
    "error_cannot_load_comments": "Les commentaires n'ont pas pu être chargés",
    "error_not_logged_in": "Connecte-toi pour interagir",
    "error_action_not_allowed": "Cette action n'est pas permise",
    "error_content_unavailable": "Contenu indisponible",

    // Onboarding & Views
    "onboarding.complete": "C'est parti !",
    "view.banned_account":
      "Compte suspendu pour violation grave des règles de sécurité.",
    "view.banned_message":
      "Zyeuté applique une politique de tolérance zéro concernant toute forme de leurre, grooming ou interaction inappropriée impliquant des mineurs. Toute tentative détectée entraîne la désactivation permanente du compte.",
    "safety.zero_tolerance_full":
      "Zyeuté applique une politique de tolérance zéro concernant toute forme de leurre, grooming ou interaction inappropriée impliquant des mineurs. Toute tentative détectée entraîne la suppression immédiate du contenu, la désactivation permanente du compte et le signalement interne requis par nos protocoles de sécurité. Les utilisateurs sont entièrement responsables du contenu qu'ils créent et partagent.",

    // Guest Mode
    "guest.mode": "Mode Visiteur",
    "guest.description":
      "Vous explorez en tant qu'invité. Créez un profil pour l'expérience complète.",
    "guest.cta": "Rejoindre le Swarm",

    // Ephemeral
    "ephemeral.label": "Éphémère",
    "ephemeral.status_burned": "Brûlé",

    // ARIA Labels & Accessibility
    "aria_play_video": "Jouer la vidéo",
    "aria_praise_post": "Féliciter ce post",
    "aria_switch_character": "Changer de personnage",
    "aria_attach_file": "Joindre un fichier",
    "aria_send_task": "Envoyer la tâche à la Colonie",

    // Error & Status Messages
    "error_enter_command": "Rentre une commande, voyons",
    "error_sending_task": "Erreur lors de l'envoi de la tâche",
    "status_enhancing": "Amélioration...",
  },
  "pt-BR": {
    // Navigation
    "nav.feed": "Feed",
    "nav.explore": "Explorar",
    "nav.stories": "Stories",
    "nav.notifications": "Notificações",
    "nav.profile": "Meu Perfil",
    "nav.home": "Início",
    "nav.discover": "Descobrir",
    "nav.create": "Criar",
    "nav.notifications_short": "Notifs",

    // Auth
    "auth.login": "Entrar",
    "auth.signup": "Cadastrar",
    "auth.logout": "Sair",

    // Actions
    "action.share": "Compartilhar",
    "action.comment": "Comentar",
    "action.gift": "Enviar Presente",

    // Button Labels
    "btn_follow": "Seguir",
    "btn_following": "Seguindo",
    "btn_unfollow": "Deixar de seguir",
    "btn_like": "Curtir",
    "btn_save": "Salvar",
    "btn_add": "Adicionar",

    // Labels
    "lbl_comments": "Comentários",
    "lbl_write_comment": "Escreva um comentário…",
    "lbl_post_comment": "Enviar",
    "lbl_views": "Visualizações",
    "lbl_followers": "Seguidores",
    "lbl_following": "Seguindo",
    "lbl_recent_videos": "Vídeos recentes",
    "lbl_settings": "Configurações",
    "lbl_posts": "Publicações",

    // Toasts
    "toast_video_saved": "Vídeo salvo",
    "toast_share_started": "Compartilhamento iniciado",
    "toast_comment_posted": "Comentário publicado",
    "toast_network_error": "Não foi possível conectar. Verifique sua conexão",
    "toast_comment_error": "Não foi possível enviar o comentário",
    "toast_save_error": "Não foi possível salvar o vídeo",
    "toast_loading": "Carregando…",

    // Error Messages
    "error_video_unavailable": "Vídeo indisponível",
    "error_cannot_load_comments": "Não foi possível carregar os comentários",
    "error_not_logged_in": "Entre para interagir",
    "error_action_not_allowed": "Esta ação não é permitida",
    "error_content_unavailable": "Conteúdo indisponível",

    // Onboarding & Views
    "onboarding.complete": "Bora!",
    "view.banned_account": "Conta suspensa por violação grave de segurança.",
    "view.banned_message":
      "A Conexão tem tolerância zero com aliciamento ou interações impróprias. Tentativas resultam em banimento permanente.",
    "safety.zero_tolerance_full":
      "A Conexão aplica uma política de tolerância zero referente a qualquer forma de aliciamento ou interação imprópria com menores. Qualquer tentativa detectada resultará na remoção imediata do conteúdo, desativação permanente da conta e denúncia às autoridades competentes.",

    // Guest Mode
    "guest.mode": "Modo Visitante",
    "guest.description":
      "Você está visitando. Crie seu perfil para desbloquear a experiência completa.",
    "guest.cta": "Entrar na Conexão",

    // Ephemeral
    "ephemeral.label": "Efêmero",
    "ephemeral.status_burned": "Queimado",
  },
  "es-AR": {
    // Navigation
    "nav.feed": "Inicio",
    "nav.explore": "Explorar",
    "nav.stories": "Historias",
    "nav.notifications": "Noti",
    "nav.profile": "Mi Perfil",
    "nav.home": "Inicio",
    "nav.discover": "Descubrir",
    "nav.create": "Crear",
    "nav.notifications_short": "Noti",

    // Auth
    "auth.login": "Entrar",
    "auth.signup": "Registrarse",
    "auth.logout": "Salir",

    // Actions
    "action.share": "Compartir",
    "action.comment": "Comentar",
    "action.gift": "Regalar",

    // Button Labels
    "btn_follow": "Seguir",
    "btn_following": "Siguiendo",
    "btn_unfollow": "Dejar de seguir",
    "btn_like": "Me copa",
    "btn_save": "Guardar",
    "btn_add": "Agregar",

    // Labels
    "lbl_comments": "Comentarios",
    "lbl_write_comment": "Escribí un comentario…",
    "lbl_post_comment": "Enviar",
    "lbl_views": "Vistas",
    "lbl_followers": "Seguidores",
    "lbl_following": "Siguiendo",
    "lbl_recent_videos": "Videos recientes",
    "lbl_settings": "Configuración",
    "lbl_posts": "Publicaciones",

    // Toasts
    "toast_video_saved": "Video guardado",
    "toast_share_started": "Compartiendo",
    "toast_comment_posted": "Comentario publicado",
    "toast_network_error": "No se pudo conectar. Revisá tu conexión",
    "toast_comment_error": "No se pudo enviar el comentario",
    "toast_save_error": "No se pudo guardar el video",
    "toast_loading": "Cargando…",

    // Error Messages
    "error_video_unavailable": "Video no disponible",
    "error_cannot_load_comments": "No se pudieron cargar los comentarios",
    "error_not_logged_in": "Entrá para interactuar",
    "error_action_not_allowed": "Esta acción no está permitida",
    "error_content_unavailable": "Contenido no disponible",

    // Onboarding & Views
    "onboarding.complete": "¡Dale!",
    "view.banned_account": "Cuenta suspendida.",
    "view.banned_message":
      "En Zarpado no nos cabe el grooming. Corta la bocha.",
    "safety.zero_tolerance_full": "Cero tolerancia con el grooming en Zarpado.",

    // Guest Mode
    "guest.mode": "Modo Visitante",
    "guest.description": "Estás de visita, che. Hacete un perfil.",
    "guest.cta": "Entrar a Zarpado",

    // Ephemeral
    "ephemeral.label": "Fantasma",
    "ephemeral.status_burned": "Quemado",
  },
  "es-MX": {
    // Navigation
    "nav.feed": "Inicio",
    "nav.explore": "Explorar",
    "nav.stories": "Historias",
    "nav.notifications": "Notificaciones",
    "nav.profile": "Mi Perfil",
    "nav.home": "Inicio",
    "nav.discover": "Descubrir",
    "nav.create": "Crear",
    "nav.notifications_short": "Notis",

    // Auth
    "auth.login": "Iniciar Sesión",
    "auth.signup": "Registrarse",
    "auth.logout": "Cerrar Sesión",

    // Actions
    "action.share": "Compartir",
    "action.comment": "Comentar",
    "action.gift": "Enviar Regalo",

    // Button Labels
    "btn_follow": "Seguir",
    "btn_following": "Siguiendo",
    "btn_unfollow": "Dejar de seguir",
    "btn_like": "Me late",
    "btn_save": "Guardar",
    "btn_add": "Agregar",

    // Labels
    "lbl_comments": "Comentarios",
    "lbl_write_comment": "Escribe un comentario…",
    "lbl_post_comment": "Enviar",
    "lbl_views": "Vistas",
    "lbl_followers": "Seguidores",
    "lbl_following": "Siguiendo",
    "lbl_recent_videos": "Videos recientes",
    "lbl_settings": "Configuración",
    "lbl_posts": "Publicaciones",

    // Toasts
    "toast_video_saved": "Video guardado",
    "toast_share_started": "Compartiendo",
    "toast_comment_posted": "Comentario publicado",
    "toast_network_error": "No se pudo conectar. Revisa tu conexión",
    "toast_comment_error": "No se pudo enviar el comentario",
    "toast_save_error": "No se pudo guardar el video",
    "toast_loading": "Cargando…",

    // Error Messages
    "error_video_unavailable": "Video no disponible",
    "error_cannot_load_comments": "No se pudieron cargar los comentarios",
    "error_not_logged_in": "Inicia sesión para interactuar",
    "error_action_not_allowed": "Esta acción no está permitida",
    "error_content_unavailable": "Contenido no disponible",

    // Onboarding & Views
    "onboarding.complete": "¡Vamos!",
    "view.banned_account": "Cuenta suspendida.",
    "view.banned_message": "En Ritual no nos cabe el grooming. Corta la bocha.",
    "safety.zero_tolerance_full": "Cero tolerancia con el grooming en Ritual.",

    // Guest Mode
    "guest.mode": "Modo Visitante",
    "guest.description": "Estás de visita, wey. Hazte un perfil.",
    "guest.cta": "Entrar al Ritual",

    // Ephemeral
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
