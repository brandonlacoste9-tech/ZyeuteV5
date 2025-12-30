import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useTranslation as useI18n } from "../i18n";

// Define the available Hives
export type HiveId = "quebec" | "mexico" | "south";

interface HiveConfig {
  id: HiveId;
  name: string;
  flag: string; // Emoji
  locale: string;
  culture: "joual" | "chilango" | "rioplatense";
  currency: "CAD" | "MXN" | "USD";
}

export const HIVES: Record<HiveId, HiveConfig> = {
  quebec: {
    id: "quebec",
    name: "Québec",
    flag: "⚜️",
    locale: "fr-CA",
    culture: "joual",
    currency: "CAD",
  },
  mexico: {
    id: "mexico",
    name: "México",
    flag: "🇲🇽",
    locale: "es-MX",
    culture: "chilango",
    currency: "MXN",
  },
  south: {
    id: "south",
    name: "Sur",
    flag: "🌎",
    locale: "es-SUR",
    culture: "rioplatense",
    currency: "USD",
  },
};

interface HiveContextType {
  currentHive: HiveConfig;
  switchHive: (hiveId: HiveId) => void;
  availableHives: HiveConfig[];
}

const HiveContext = createContext<HiveContextType | undefined>(undefined);

export const HiveProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Default to Quebec
  const [currentHive, setCurrentHive] = useState<HiveConfig>(HIVES.quebec);

  // Load from local storage on mount
  useEffect(() => {
    const savedHive = localStorage.getItem("zyeute_hive_id") as HiveId;
    if (savedHive && HIVES[savedHive]) {
      setCurrentHive(HIVES[savedHive]);
    }
  }, []);

  const switchHive = (hiveId: HiveId) => {
    if (HIVES[hiveId]) {
      setCurrentHive(HIVES[hiveId]);
      localStorage.setItem("zyeute_hive_id", hiveId);
      // Force reload to apply locale changes deeply if needed,
      // or we can rely on the responsive I18n system if mapped correctly.
      // For now, we update state.
    }
  };

  return (
    <HiveContext.Provider
      value={{
        currentHive,
        switchHive,
        availableHives: Object.values(HIVES),
      }}
    >
      {children}
    </HiveContext.Provider>
  );
};

export const useHive = (): HiveContextType => {
  const context = useContext(HiveContext);
  if (!context) {
    throw new Error("useHive must be used within a HiveProvider");
  }
  return context;
};
