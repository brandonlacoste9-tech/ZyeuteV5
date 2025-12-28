
import React, { useEffect } from 'react';
import { AppConfig } from '../config/factory';

export const FactoryThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement;
    const { theme } = AppConfig;

    // Map Factory Theme to CSS Variables
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--primary-accent', theme.accent);
    root.style.setProperty('--bg-main', theme.background);
    root.style.setProperty('--bg-card', theme.cardBackground);
    root.style.setProperty('--text-main', theme.textMain);
    root.style.setProperty('--text-muted', theme.textMuted);
    root.style.setProperty('--edge-color', theme.edgeLighting);
    root.style.setProperty('--glow-color', theme.glowColor);
    root.style.setProperty('--stitching-color', theme.stitchingColor);
    root.style.setProperty('--font-family', theme.fontFamily);

    // Update Page Title
    document.title = AppConfig.identity.name;
    
    // Set Theme Color for Mobile Browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.background);
    } else {
      const meta = document.createElement('meta');
      meta.name = "theme-color";
      meta.content = theme.background;
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
  }, []);

  return <>{children}</>;
};
