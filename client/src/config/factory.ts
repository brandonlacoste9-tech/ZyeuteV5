
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
  name: string;
  tagline: string;
  region: string;
  locale: string;
  iconEmoji: string;
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

// DEFAULT BASE CONFIG (Zyeuté Québec)
export const DEFAULT_CONFIG: AppConfig = {
  identity: {
    name: "Zyeuté Québec",
    tagline: "Le Swarm Québécois ⚜️",
    region: "QC",
    locale: "fr-CA",
    iconEmoji: "⚜️",
    landingTitle: "Bienvenue dans le Swarm",
    landingSubtitle: "La plateforme sociale premium du Québec.",
    onboardingSteps: [
      { title: "Découvrez", description: "Vidéos exclusives et talents locaux." },
      { title: "Connectez", description: "Échangez avec la communauté." },
      { title: "Gagnez", description: "Recevez des cadeaux de vos fans." }
    ]
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
    fontFamily: "'Inter', sans-serif"
  },
  features: {
    enableChat: true,
    enableStories: true,
    enableModeration: true,
    enableGifts: true
  }
};

// GLOBAL CONFIG ACCESSOR
// In a "clone", this file is modified or replaced.
export const AppConfig = DEFAULT_CONFIG;
