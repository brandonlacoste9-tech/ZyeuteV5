import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the available Hives
export type HiveId = "quebec" | "mexico" | "brazil" | "argentina";

interface HiveConfig {
  id: HiveId;
  name: string;
  flag: string; // Emoji
  locale: string;
  culture: "joual" | "chilango" | "carioca" | "porteño";
  currency: "CAD" | "MXN" | "BRL" | "ARS";
  // Pricing in local currency
  prices: { bronze: number; silver: number; gold: number };
  // Personality name for Ti-Guy equivalent
  personality: string;
  // Mascot identity
  mascot: string;
  mascotEmoji: string;
}

export const HIVES: Record<HiveId, HiveConfig> = {
  quebec: {
    id: "quebec",
    name: "Québec",
    flag: "⚜️",
    locale: "fr-CA",
    culture: "joual",
    currency: "CAD",
    prices: { bronze: 4.99, silver: 9.99, gold: 19.99 },
    personality: "Ti-Guy",
    mascot: "Grand Castor",
    mascotEmoji: "🦫",
  },
  mexico: {
    id: "mexico",
    name: "México",
    flag: "🇲🇽",
    locale: "es-MX",
    culture: "chilango",
    currency: "MXN",
    prices: { bronze: 59, silver: 119, gold: 249 },
    personality: "El Güey",
    mascot: "Águila Real",
    mascotEmoji: "🦅",
  },
  brazil: {
    id: "brazil",
    name: "Brasil",
    flag: "🇧🇷",
    locale: "pt-BR",
    culture: "carioca",
    currency: "BRL",
    prices: { bronze: 19, silver: 39, gold: 79 },
    personality: "Mano",
    mascot: "Onça-Pintada",
    mascotEmoji: "🐆",
  },
  argentina: {
    id: "argentina",
    name: "Argentina",
    flag: "🇦🇷",
    locale: "es-AR",
    culture: "porteño",
    currency: "ARS",
    prices: { bronze: 500, silver: 999, gold: 1999 },
    personality: "Pibe",
    mascot: "Puma",
    mascotEmoji: "🐆",
  },
};

interface HiveContextType {
  currentHive: HiveConfig;
  switchHive: (hiveId: HiveId) => void;
  availableHives: HiveConfig[];
}

const HiveContext = createContext<HiveContextType | undefined>(undefined);

/** Detect best hive from browser/device locale */
export function detectHiveFromLocale(): HiveId {
  const lang =
    navigator.language ||
    (navigator.languages && navigator.languages[0]) ||
    "fr-CA";
  if (lang.toLowerCase().startsWith("es-ar")) return "argentina";
  if (lang.toLowerCase().startsWith("es")) return "mexico";
  if (lang.toLowerCase().startsWith("pt")) return "brazil";
  return "quebec";
}

export const HiveProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Initialize from localStorage, then locale auto-detect, then default quebec
  const [currentHive, setCurrentHive] = useState<HiveConfig>(() => {
    const saved = localStorage.getItem("zyeute_hive_id") as HiveId;
    if (saved && HIVES[saved]) return HIVES[saved];
    // Auto-detect from browser locale on first visit
    const detected = detectHiveFromLocale();
    return HIVES[detected];
  });

  const switchHive = (hiveId: HiveId) => {
    if (HIVES[hiveId]) {
      setCurrentHive(HIVES[hiveId]);
      localStorage.setItem("zyeute_hive_id", hiveId);
      // Force reload to apply locale changes deeply if needed,
      // or we can rely on the responsive I18n system if mapped correctly.
      // For now, we update state.
    }
  };

  const value = React.useMemo(
    () => ({
      currentHive,
      switchHive,
      availableHives: Object.values(HIVES),
    }),
    [currentHive],
  );

  return <HiveContext.Provider value={value}>{children}</HiveContext.Provider>;
};

export const useHive = (): HiveContextType => {
  const context = useContext(HiveContext);
  if (!context) {
    throw new Error("useHive must be used within a HiveProvider");
  }
  return context;
};
