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
      return savedColor || DEFAULT_GOLD;
    }
    return DEFAULT_GOLD;
  });

  // Save the color to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("appBorderColor", color);
      // Update global CSS variable for edge lighting
      document.documentElement.style.setProperty("--edge-color", color);
      // Update glow color with transparency (adding 66 for ~40% opacity if hex)
      // Assuming color is always 6-digit hex. If not, this might need more robust handling logic, 
      // but typically the picker returns hex.
      document.documentElement.style.setProperty("--glow-color", `${color}66`);
    }
  }, [color]);

  // The value provided to components
  const contextValue: BorderColorContextType = {
    borderColor: color,
    setBorderColor: setColor,
    defaultGold: DEFAULT_GOLD,
  };

  return (
    <BorderColorContext.Provider value={contextValue}>
      {children}
    </BorderColorContext.Provider>
  );
};
