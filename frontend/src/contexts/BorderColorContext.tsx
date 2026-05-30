/**
 * BorderColorContext - Customizable App Accent Lighting
 * Allows users to customize the border glow color around the app
 */

import React, { createContext, useState, useEffect, useContext } from "react";

// Define the default gold color matching the theme
const DEFAULT_GOLD = "#FFBF00"; // Matches gold-500 in tailwind config

interface BorderColorContextType {
  borderColor: string;
  setBorderColor: (color: string) => void;
  defaultGold: string;
}

// 1. Define the Context
const BorderColorContext = createContext<BorderColorContextType | undefined>(
  undefined,
);

// 2. Create a custom hook for easy access
export const useBorderColor = () => {
  const context = useContext(BorderColorContext);
  if (context === undefined) {
    throw new Error("useBorderColor must be used within a BorderColorProvider");
  }
  return context;
};

// 3. Create the Provider Component
export const BorderColorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use localStorage to persist the setting, defaulting to gold
  const [color, setColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedColor = localStorage.getItem("appBorderColor");
      const initialColor = savedColor || DEFAULT_GOLD;
      // Initialize CSS variable on mount
      document.documentElement.style.setProperty("--edge-color", initialColor);
      // Initialize glow color
      const r = parseInt(initialColor.slice(1, 3), 16);
      const g = parseInt(initialColor.slice(3, 5), 16);
      const b = parseInt(initialColor.slice(5, 7), 16);
      document.documentElement.style.setProperty(
        "--glow-color",
        `rgba(${r}, ${g}, ${b}, 0.4)`,
      );
      return initialColor;
    }
    return DEFAULT_GOLD;
  });

  // Save the color to localStorage and update CSS variable whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("appBorderColor", color);
      // Update CSS variable for edge lighting (used by VideoPlayer and other components)
      document.documentElement.style.setProperty("--edge-color", color);
      // Also update glow color with opacity
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      document.documentElement.style.setProperty(
        "--glow-color",
        `rgba(${r}, ${g}, ${b}, 0.4)`,
      );
    }
  }, [color]);

  // The value provided to components
  const contextValue = React.useMemo(() => ({
    borderColor: color,
    setBorderColor: setColor,
    defaultGold: DEFAULT_GOLD,
  }), [color]);

  return (
    <BorderColorContext.Provider value={contextValue}>
      {children}
    </BorderColorContext.Provider>
  );
};
