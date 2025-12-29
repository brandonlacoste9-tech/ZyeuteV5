/**
 * Zyeute Factory - Application Configuration Schema
 * This file defines the identity of a specific app clone.
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
  hiveId: string; // The backend hive identifier (matching hiveEnum in schema.ts)
  name: string;
  tagline: string;
  region: string;
  locale: string;
  iconEmoji: string;
  giftEmoji: string; // The primary currency/gift icon (Leaf, Mate, Taco)
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

// 1. Zyeuté Québec (The Original)
const QUEBEC_CONFIG: AppConfig = {
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
    primary: "#0EA5E9", // Sky Blue
    secondary: "#0F172A", // Slate 900
    accent: "#38BDF8", // Sky 400
    background: "#020617", // Slate 950
    cardBackground: "#1E293B", // Slate 800
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

// 2. Conexão (Brazil Pilot)
const BRAZIL_CONFIG: AppConfig = {
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
      { title: "Conecte-se", description: "Troque ideias com a comunidade." },
      { title: "Ganhe", description: "Receba presentes dos seus fãs." },
    ],
  },
  theme: {
    primary: "#FFBF00", // Gold
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

// 3. Zarpado (Argentina Pilot)
const ARGENTINA_CONFIG: AppConfig = {
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
    primary: "#75AADB", // Sky Blue
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

// 4. Ritual (Mexico Pilot)
const MEXICO_CONFIG: AppConfig = {
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
    primary: "#E63946", // Aztec Red
    secondary: "#101010",
    accent: "#A8DADC", // Turquoise
    background: "#080808",
    cardBackground: "#1A1A1A",
    textMain: "#FFFFFF",
    textMuted: "#9CA3AF",
    edgeLighting: "#00FF7F", // Neon Green (Cyberpunk CDMX vibe)
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

// DOMAIN-BASED CONFIG DETECTION (The Chameleon Protocol)
const detectConfig = (): AppConfig => {
  if (typeof window === "undefined") return QUEBEC_CONFIG;

  const host = window.location.hostname.toLowerCase();

  // Detection logic based on TLD or Subdomain
  if (host.includes("zyeute.mx") || host.includes("mexico")) {
    return MEXICO_CONFIG;
  }
  if (
    host.includes("zarpado") ||
    host.includes("argentina") ||
    host.includes("ar.")
  ) {
    return ARGENTINA_CONFIG;
  }
  if (
    host.includes("conexao") ||
    host.includes("brazil") ||
    host.includes("br.")
  ) {
    return BRAZIL_CONFIG;
  }

  // Default to Québec (the Mother Hive)
  return QUEBEC_CONFIG;
};

export const AppConfig = detectConfig();
