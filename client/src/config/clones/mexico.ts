
import { AppConfig } from '../factory';

export const MEXICO_CONFIG: AppConfig = {
  identity: {
    name: "Zyeuté México",
    tagline: "El Swarm Mexicano 🇲🇽",
    region: "MX",
    locale: "es-MX",
    iconEmoji: "🇲🇽",
    landingTitle: "Bienvenido al Swarm",
    landingSubtitle: "La plataforma social premium de México.",
    onboardingSteps: [
      { title: "Descubre", description: "Videos exclusivos y talento local." },
      { title: "Conecta", description: "Interactúa con la comunidad." },
      { title: "Gana", description: "Recibe regalos de tus fans." }
    ]
  },
  theme: {
    primary: "#006341", // Mexico Green
    secondary: "#1a1512",
    accent: "#CE1126", // Mexico Red
    background: "#0d0c0b",
    cardBackground: "#1e1a17",
    textMain: "#FFFFFF",
    textMuted: "#a18e87",
    edgeLighting: "#006341",
    glowColor: "rgba(0, 99, 65, 0.4)",
    stitchingColor: "rgba(206, 17, 38, 0.7)",
    fontFamily: "'Inter', sans-serif"
  },
  features: {
    enableChat: true,
    enableStories: true,
    enableModeration: true,
    enableGifts: true
  }
};
