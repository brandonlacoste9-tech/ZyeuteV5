/**
 * Zyeuté Copy System - Joual-forward, inclusive voice
 * Women-forward but not gendered - warm, welcoming, authentic Quebec
 *
 * Voice guidelines:
 * - Use "tu" (informal) over "vous"
 * - Joual expressions where natural (icitte, ben, faque, pis)
 * - Warm and encouraging
 * - Inclusive - no gendered assumptions
 * - Local pride without being exclusionary
 */

export const copy = {
  // Navigation
  nav: {
    home: "Accueil",
    discover: "Découvrir",
    create: "Créer",
    notifications: "Notifs",
    profile: "Profil",
    settings: "Réglages",
    studio: "Studio",
  },

  // Auth
  auth: {
    login: "Connecte-toi",
    signup: "Crée ton compte",
    logout: "Déconnexion",
    email: "Courriel",
    password: "Mot de passe",
    username: "Ton pseudo",
    forgotPassword: "Mot de passe oublié?",
    noAccount: "Pas encore icitte?",
    hasAccount: "Déjà membre?",
    continueGoogle: "Continuer avec Google",
    loginButton: "Entrer",
    signupButton: "Embarque!",
    loggingIn: "Une seconde...",
    creatingAccount: "On prépare ta place...",
    welcomeBack: "Content de te r'voir! 🦫",
    welcomeNew: "Bienvenue dans la gang! 🔥",
  },

  // Empty states - warm and encouraging
  empty: {
    feed: {
      title: "Rien à zyeuter pour l'instant!",
      subtitle: "Découvre du monde icitte ou crée ton premier post.",
      action: "Découvrir des créateurs",
    },
    notifications: {
      title: "Pas de notifs",
      subtitle: "Quand du monde interagit avec toi, ça va apparaître icitte.",
    },
    search: {
      title: "Cherche quelqu'un ou quelque chose",
      subtitle: "Des posts, du monde, des hashtags...",
    },
    comments: {
      title: "Aucun commentaire",
      subtitle: "Sois le premier à réagir!",
    },
    stories: {
      title: "Pas de stories",
      subtitle: "Les stories de ton monde vont apparaître icitte.",
    },
    profile: {
      noPosts: "Aucun post encore",
      noPostsSubtitle: "Partage ton premier moment! 📸",
    },
  },

  // Actions - casual but clear
  actions: {
    post: "Poster",
    share: "Partager",
    save: "Sauvegarder",
    cancel: "Annuler",
    confirm: "C'est beau",
    delete: "Supprimer",
    edit: "Modifier",
    follow: "Suivre",
    following: "Abonné·e",
    unfollow: "Ne plus suivre",
    report: "Signaler",
    block: "Bloquer",
    mute: "Mettre en sourdine",
    reply: "Répondre",
    viewReplies: "Voir les réponses",
    hideReplies: "Cacher les réponses",
    loadMore: "Charger plus",
    refresh: "Actualiser",
    retry: "Réessayer",
    send: "Envoyer",
    done: "Fini!",
    next: "Suivant",
    back: "Retour",
    close: "Fermer",
    viewAll: "Voir tout",
  },

  // Feedback - encouraging and warm
  feedback: {
    success: {
      postCreated: "Posté! 🔥",
      commentAdded: "Commentaire ajouté!",
      followed: "Tu suis maintenant!",
      unfollowed: "Désabonné",
      saved: "Sauvegardé!",
      copied: "Copié!",
      reported: "Signalement envoyé",
      profileUpdated: "Profil mis à jour!",
    },
    error: {
      generic: "Oups, y'a eu un pépin!",
      network: "Problème de connexion. Réessaye?",
      notFound: "Pas trouvé... 🤔",
      unauthorized: "Connecte-toi d'abord!",
      upload: "Le upload a pas marché",
      tooLarge: "Fichier trop gros!",
    },
    loading: {
      generic: "Ça charge...",
      feed: "On prépare ton feed...",
      post: "Ton post s'en vient...",
      upload: "Upload en cours...",
      ai: "Ti-Guy réfléchit...",
    },
    info: {
      endOfFeed: "T'as tout vu! 🎉",
      noMore: "C'est tout pour l'instant",
      comeBack: "Reviens plus tard!",
    },
  },

  // Ti-Guy AI assistant
  tiguy: {
    greeting: "Allô! C'est Ti-Guy 🦫",
    intro: "Ton assistant québécois. Comment je peux t'aider?",
    thinking: "Hmm, laisse-moi réfléchir...",
    generating: "Je travaille là-dessus...",
    placeholder: "Pose-moi une question...",
    suggestions: [
      "C'est quoi les feux?",
      "Comment ça marche icitte?",
      "Aide-moi avec ma légende",
      "Qu'est-ce qui est tendance?",
    ],
  },

  // Upload/Create
  create: {
    title: "Crée ton post",
    addMedia: "Ajoute une photo ou vidéo",
    changeMedia: "Changer",
    caption: "Ta légende",
    captionPlaceholder: "Qu'est-ce qui se passe?",
    location: "Où es-tu?",
    hashtags: "Hashtags",
    posting: "On poste ça...",
    publishStory: "Publier comme Story",
    postToFeed: "Poster dans le feed",
  },

  // Profile
  profile: {
    posts: "Posts",
    followers: "Abonné·e·s",
    following: "Abonnements",
    fires: "Feux",
    editProfile: "Modifier le profil",
    shareProfile: "Partager",
    bio: "Bio",
    bioPlaceholder: "Parle-nous de toi...",
    website: "Site web",
    location: "Région",
  },

  // Settings
  settings: {
    account: "Ton compte",
    privacy: "Confidentialité",
    notifications: "Notifications",
    appearance: "Apparence",
    language: "Langue",
    help: "Aide",
    about: "À propos",
    premium: "Premium ⚜️",
    logoutConfirm: "Tu veux vraiment te déconnecter?",
  },

  // Premium
  premium: {
    title: "Deviens VIP",
    subtitle: "Débloque des fonctionnalités exclusives",
    bronze: "Bronze",
    silver: "Argent",
    gold: "Or",
    subscribe: "S'abonner",
    currentPlan: "Ton plan actuel",
  },

  // Dates - casual Quebec style
  dates: {
    now: "là-là",
    secondsAgo: "y'a quelques secondes",
    minuteAgo: "y'a 1 min",
    minutesAgo: (n: number) => `y'a ${n} min`,
    hourAgo: "y'a 1h",
    hoursAgo: (n: number) => `y'a ${n}h`,
    dayAgo: "hier",
    daysAgo: (n: number) => `y'a ${n} jours`,
    weekAgo: "la semaine passée",
    weeksAgo: (n: number) => `y'a ${n} semaines`,
  },

  // Misc
  misc: {
    or: "ou ben",
    and: "pis",
    madeInQuebec: "Fait au Québec 🦫⚜️",
    tagline: "L'app sociale du Québec",
    you: "Toi",
    verified: "Vérifié",
    sponsored: "Commandité",
  },
} as const;

// Helper to format relative time in joual style
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 10) return copy.dates.now;
  if (seconds < 60) return copy.dates.secondsAgo;

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return copy.dates.minuteAgo;
  if (minutes < 60) return copy.dates.minutesAgo(minutes);

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return copy.dates.hourAgo;
  if (hours < 24) return copy.dates.hoursAgo(hours);

  const days = Math.floor(hours / 24);
  if (days === 1) return copy.dates.dayAgo;
  if (days < 7) return copy.dates.daysAgo(days);

  const weeks = Math.floor(days / 7);
  if (weeks === 1) return copy.dates.weekAgo;
  return copy.dates.weeksAgo(weeks);
}

export default copy;
