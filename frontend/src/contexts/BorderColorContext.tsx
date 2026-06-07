/**
 * BorderColorContext - Compatibility shim over ThemeContext (single accent source).
 */

import React, { createContext, useContext, useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { DEFAULT_GOLD } from "@/lib/accentPalette";

interface BorderColorContextType {
  borderColor: string;
  setBorderColor: (color: string) => void;
  defaultGold: string;
}

const BorderColorContext = createContext<BorderColorContextType | undefined>(
  undefined,
);

export const useBorderColor = () => {
  const context = useContext(BorderColorContext);
  if (context === undefined) {
    throw new Error("useBorderColor must be used within a BorderColorProvider");
  }
  return context;
};

export const BorderColorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { edgeLighting, setAccentColor } = useTheme();

  const contextValue = useMemo(
    () => ({
      borderColor: edgeLighting,
      setBorderColor: setAccentColor,
      defaultGold: DEFAULT_GOLD,
    }),
    [edgeLighting, setAccentColor],
  );

  return (
    <BorderColorContext.Provider value={contextValue}>
      {children}
    </BorderColorContext.Provider>
  );
};
