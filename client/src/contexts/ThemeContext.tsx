/**
 * Theme Context - Manages edge lighting colors and theme customization
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  edgeLighting: string;
  name: string;
}

export const PRESET_THEMES: Record<string, ThemeColors> = {
  gold: {
    name: 'Or Classique',
    edgeLighting: '#F5C842',
  },
  blue: {
    name: 'Bleu Québec',
    edgeLighting: '#0066CC',
  },
  red: {
    name: 'Rouge Passion',
    edgeLighting: '#E63946',
  },
  green: {
    name: 'Vert Laurentides',
    edgeLighting: '#2A9D8F',
  },
  purple: {
    name: 'Violet Royal',
    edgeLighting: '#9D4EDD',
  },
  orange: {
    name: 'Orange Construction 🚧',
    edgeLighting: '#FF6B35',
  },
  pink: {
    name: 'Rose Fleur-de-lys',
    edgeLighting: '#F72585',
  },
  cyan: {
    name: 'Cyan Glacé',
    edgeLighting: '#00D9FF',
  },
};

interface ThemeContextType {
  edgeLighting: string;
  setEdgeLighting: (color: string) => void;
  currentTheme: string;
  setTheme: (themeName: string) => void;
  isAnimated: boolean;
  setIsAnimated: (animated: boolean) => void;
  glowIntensity: number;
  setGlowIntensity: (intensity: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [edgeLighting, setEdgeLightingState] = useState<string>(() => {
    const saved = localStorage.getItem('zyeute_edge_color');
    return saved || PRESET_THEMES.gold.edgeLighting;
  });

  const [currentTheme, setCurrentThemeState] = useState<string>(() => {
    return localStorage.getItem('zyeute_theme') || 'gold';
  });

  const [isAnimated, setIsAnimatedState] = useState<boolean>(() => {
    const saved = localStorage.getItem('zyeute_edge_animated');
    return saved ? JSON.parse(saved) : true;
  });

  const [glowIntensity, setGlowIntensityState] = useState<number>(() => {
    const saved = localStorage.getItem('zyeute_glow_intensity');
    return saved ? parseInt(saved) : 50;
  });

  // Update CSS variables when colors change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--edge-color', edgeLighting);
    root.style.setProperty('--glow-intensity', `${glowIntensity}%`);
    
    // Add animation class if enabled
    if (isAnimated) {
      root.classList.add('edge-animated');
    } else {
      root.classList.remove('edge-animated');
    }
  }, [edgeLighting, isAnimated, glowIntensity]);

  const setEdgeLighting = (color: string) => {
    setEdgeLightingState(color);
    localStorage.setItem('zyeute_edge_color', color);
  };

  const setTheme = (themeName: string) => {
    setCurrentThemeState(themeName);
    localStorage.setItem('zyeute_theme', themeName);
    if (PRESET_THEMES[themeName]) {
      setEdgeLighting(PRESET_THEMES[themeName].edgeLighting);
    }
  };

  const setIsAnimated = (animated: boolean) => {
    setIsAnimatedState(animated);
    localStorage.setItem('zyeute_edge_animated', JSON.stringify(animated));
  };

  const setGlowIntensity = (intensity: number) => {
    setGlowIntensityState(intensity);
    localStorage.setItem('zyeute_glow_intensity', intensity.toString());
  };

  return (
    <ThemeContext.Provider
      value={{
        edgeLighting,
        setEdgeLighting,
        currentTheme,
        setTheme,
        isAnimated,
        setIsAnimated,
        glowIntensity,
        setGlowIntensity,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

