/**
 * useSettings Hook
 * Provides app settings including devMode
 * Wraps useSettingsPreferences for backward compatibility
 */

import { useSettingsPreferences } from "./useSettingsPreferences";

export interface Settings {
  devMode?: boolean;
  [key: string]: any;
}

export function useSettings() {
  const { preferences } = useSettingsPreferences();

  // Map preferences to settings format
  const settings: Settings = {
    devMode:
      preferences.app?.betaFeatures || process.env.NODE_ENV === "development",
    ...preferences,
  };

  return { settings };
}
