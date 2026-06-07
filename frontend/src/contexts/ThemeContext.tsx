/**
 * Theme Context - Manages edge lighting colors and theme customization
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { applyAccentPalette, DEFAULT_GOLD } from "@/lib/accentPalette";

export interface ThemeColors {
  edgeLighting: string;
  name: string;
}

export const PRESET_THEMES: Record<string, ThemeColors> = {
  gold: {
    name: "Or Classique",
    edgeLighting: "#F5C842",
  },
  leather: {
    name: "⚜ Cuir Luxe",
    edgeLighting: "#c5a055",
  },
  "leather-green": {
    name: "🌲 Cuir Forêt",
    edgeLighting: "#7ec98a",
  },
  "leather-purple": {
    name: "👑 Cuir Royal",
    edgeLighting: "#b48ad4",
  },
  blue: {
    name: "Bleu Québec",
    edgeLighting: "#0066CC",
  },
  red: {
    name: "Rouge Passion",
    edgeLighting: "#E63946",
  },
  green: {
    name: "Vert Laurentides",
    edgeLighting: "#2A9D8F",
  },
  purple: {
    name: "Violet Royal",
    edgeLighting: "#9D4EDD",
  },
  orange: {
    name: "Orange Construction 🚧",
    edgeLighting: "#FF6B35",
  },
  pink: {
    name: "Rose Fleur-de-lys",
    edgeLighting: "#F72585",
  },
  cyan: {
    name: "Cyan Glacé",
    edgeLighting: "#00D9FF",
  },
};

function readInitialAccent(): string {
  if (typeof window === "undefined") return PRESET_THEMES.gold.edgeLighting;
  return (
    localStorage.getItem("zyeute_edge_color") ||
    localStorage.getItem("appBorderColor") ||
    PRESET_THEMES.gold.edgeLighting
  );
}

interface ThemeContextType {
  edgeLighting: string;
  setEdgeLighting: (color: string) => void;
  /** Custom hex — applies app-wide accent scale */
  setAccentColor: (color: string) => void;
  currentTheme: string;
  setTheme: (themeName: string) => void;
  isAnimated: boolean;
  setIsAnimated: (animated: boolean) => void;
  glowIntensity: number;
  setGlowIntensity: (intensity: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [edgeLighting, setEdgeLightingState] =
    useState<string>(readInitialAccent);

  const [currentTheme, setCurrentThemeState] = useState<string>(() => {
    if (typeof window === "undefined") return "gold";
    return localStorage.getItem("zyeute_theme") || "gold";
  });

  const [isAnimated, setIsAnimatedState] = useState<boolean>(() => {
    const saved = localStorage.getItem("zyeute_edge_animated");
    return saved ? JSON.parse(saved) : true;
  });

  const [glowIntensity, setGlowIntensityState] = useState<number>(() => {
    const saved = localStorage.getItem("zyeute_glow_intensity");
    return saved ? parseInt(saved, 10) : 0;
  });

  const persistAccent = useCallback((color: string, themeName: string) => {
    const normalized = applyAccentPalette(color);
    setEdgeLightingState(normalized);
    setCurrentThemeState(themeName);
    localStorage.setItem("zyeute_edge_color", normalized);
    localStorage.setItem("appBorderColor", normalized);
    localStorage.setItem("zyeute_theme", themeName);
    return normalized;
  }, []);

  // Apply accent scale + animation attrs whenever accent/theme changes
  useEffect(() => {
    applyAccentPalette(edgeLighting);
    const root = document.documentElement;
    root.setAttribute("data-theme", currentTheme);
    root.style.setProperty("--glow-intensity", `${glowIntensity}%`);

    if (isAnimated) {
      root.classList.add("edge-animated");
    } else {
      root.classList.remove("edge-animated");
    }
  }, [edgeLighting, isAnimated, glowIntensity, currentTheme]);

  const setEdgeLighting = useCallback(
    (color: string) => {
      persistAccent(color, "custom");
    },
    [persistAccent],
  );

  const setAccentColor = useCallback(
    (color: string) => {
      persistAccent(color, "custom");
    },
    [persistAccent],
  );

  const setTheme = useCallback(
    (themeName: string) => {
      const preset = PRESET_THEMES[themeName];
      if (preset) {
        persistAccent(preset.edgeLighting, themeName);
      } else {
        setCurrentThemeState(themeName);
        localStorage.setItem("zyeute_theme", themeName);
      }
    },
    [persistAccent],
  );

  const setIsAnimated = (animated: boolean) => {
    setIsAnimatedState(animated);
    localStorage.setItem("zyeute_edge_animated", JSON.stringify(animated));
  };

  const setGlowIntensity = (intensity: number) => {
    setGlowIntensityState(intensity);
    localStorage.setItem("zyeute_glow_intensity", intensity.toString());
  };

  const value = React.useMemo(
    () => ({
      edgeLighting,
      setEdgeLighting,
      setAccentColor,
      currentTheme,
      setTheme,
      isAnimated,
      setIsAnimated,
      glowIntensity,
      setGlowIntensity,
    }),
    [
      edgeLighting,
      setEdgeLighting,
      setAccentColor,
      currentTheme,
      setTheme,
      isAnimated,
      glowIntensity,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
