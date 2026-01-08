/**
 * Shared Constants and Regional Configurations
 */

export interface AppTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  cardBackground: string;
  textMain: string;
  textMuted: string;
  edgeLighting: string;
  glowColor: string;
  stitchingColor: string;
  fontFamily: string;
}

export interface AppIdentity {
  hiveId: string;
  name: string;
  tagline: string;
  region: string;
  locale: string;
  iconEmoji: string;
  giftEmoji: string;
  landingTitle: string;
  landingSubtitle: string;
  onboardingSteps: Array<{
    title: string;
    description: string;
    image?: string;
  }>;
}

export interface AppConfig {
  identity: AppIdentity;
  theme: AppTheme;
  features: {
    enableChat: boolean;
    enableStories: boolean;
    enableModeration: boolean;
    enableGifts: boolean;
  };
}

export const QUEBEC_CONFIG: AppConfig = {
  identity: {
    hiveId: "quebec",
    name: "Zyeuté",
    tagline: "Le Swarm Québécois ⚜️",
    region: "QC",
    locale: "fr-CA",
    iconEmoji: "⚜️",
    giftEmoji: "🍁",
    landingTitle: "Bienvenue dans le Swarm",
    landingSubtitle: "La plateforme sociale premium du Québec.",
    onboardingSteps: [
      {
        title: "Découvrez",
        description: "Vidéos exclusives et talents locaux.",
      },
      { title: "Connectez", description: "Échangez avec la communauté." },
      { title: "Gagnez", description: "Recevez des cadeaux de vos fans." },
    ],
  },
  theme: {
    primary: "#0EA5E9",
    secondary: "#0F172A",
    accent: "#38BDF8",
    background: "#020617",
    cardBackground: "#1E293B",
    textMain: "#F8FAFC",
    textMuted: "#94A3B8",
    edgeLighting: "#0EA5E9",
    glowColor: "rgba(14, 165, 233, 0.4)",
    stitchingColor: "rgba(56, 189, 248, 0.3)",
    fontFamily: "'Inter', sans-serif",
  },
  features: {
    enableChat: true,
    enableStories: true,
    enableModeration: true,
    enableGifts: true,
  },
};

export const BRAZIL_CONFIG: AppConfig = {
  identity: {
    hiveId: "brazil",
    name: "Conexão",
    tagline: "O Swarm Brasileiro 🇧🇷",
    region: "BR",
    locale: "pt-BR",
    iconEmoji: "🇧🇷",
    giftEmoji: "🌴",
    landingTitle: "Bem-vindo à Conexão",
    landingSubtitle: "A plataforma social premium do Brasil.",
    onboardingSteps: [
      {
        title: "Descubra",
        description: "Vídeos exclusivos e talentos locais.",
      },
      { title: "Conecte-se", description: "Troque ideias with a comunidade." },
      { title: "Ganhe", description: "Receba presentes dos seus fãs." },
    ],
  },
  theme: {
    primary: "#FFBF00",
    secondary: "#1a1512",
    accent: "#FFD966",
    background: "#0d0c0b",
    cardBackground: "#241d19",
    textMain: "#FFFFFF",
    textMuted: "#a18e87",
    edgeLighting: "#FFBF00",
    glowColor: "rgba(255, 191, 0, 0.4)",
    stitchingColor: "rgba(218, 165, 32, 0.7)",
    fontFamily: "'Inter', sans-serif",
  },
  features: {
    enableChat: true,
    enableStories: true,
    enableModeration: true,
    enableGifts: true,
  },
};

export const ARGENTINA_CONFIG: AppConfig = {
  identity: {
    hiveId: "argentina",
    name: "Zarpado",
    tagline: "El Swarm Argentino 🇦🇷",
    region: "AR",
    locale: "es-AR",
    iconEmoji: "🇦🇷",
    giftEmoji: "🧉",
    landingTitle: "Bienvenido a Zarpado",
    landingSubtitle: "La plataforma social más picante de Argentina.",
    onboardingSteps: [
      { title: "Descubrí", description: "Videos exclusivos y talento local." },
      { title: "Conectá", description: "Hablá con la comunidad." },
      { title: "Ganá", description: "Recibí regalos de tus fans." },
    ],
  },
  theme: {
    primary: "#75AADB",
    secondary: "#1a1512",
    accent: "#FFFFFF",
    background: "#0d0c0b",
    cardBackground: "#1e1e1e",
    textMain: "#FFFFFF",
    textMuted: "#a18e87",
    edgeLighting: "#75AADB",
    glowColor: "rgba(117, 170, 219, 0.4)",
    stitchingColor: "rgba(255, 255, 255, 0.5)",
    fontFamily: "'Inter', sans-serif",
  },
  features: {
    enableChat: true,
    enableStories: true,
    enableModeration: true,
    enableGifts: true,
  },
};

export const MEXICO_CONFIG: AppConfig = {
  identity: {
    hiveId: "mexico",
    name: "Zyeuté México",
    tagline: "El Swarm Mexicano 🇲🇽",
    region: "MX",
    locale: "es-MX",
    iconEmoji: "🇲🇽",
    giftEmoji: "🌮",
    landingTitle: "Entra al Ritual",
    landingSubtitle: "La plataforma más chida de México.",
    onboardingSteps: [
      { title: "Descubre", description: "Vibra con talento local." },
      { title: "Conecta", description: "Únete a la banda." },
      { title: "Gana", description: "Recibe regalos auténticos." },
    ],
  },
  theme: {
    primary: "#E63946",
    secondary: "#101010",
    accent: "#A8DADC",
    background: "#080808",
    cardBackground: "#1A1A1A",
    textMain: "#FFFFFF",
    textMuted: "#9CA3AF",
    edgeLighting: "#00FF7F",
    glowColor: "rgba(230, 57, 70, 0.4)",
    stitchingColor: "rgba(0, 255, 127, 0.5)",
    fontFamily: "'Inter', sans-serif",
  },
  features: {
    enableChat: true,
    enableStories: true,
    enableModeration: true,
    enableGifts: true,
  },
};
