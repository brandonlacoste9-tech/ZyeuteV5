import { useCallback, useEffect, useState } from "react";
import { logger } from "../lib/logger";

const useSettingsPreferencesLogger = logger.withContext(
  "UseSettingsPreferences",
);

type MentionScope = "everyone" | "followers" | "no_one";
type ContentFilterLevel = "strict" | "medium" | "off";
type LanguageOption = "fr" | "en";

export interface SettingsPreferences {
  tags: {
    allowTagging: boolean;
    requireApproval: boolean;
    mentionScope: MentionScope;
  };
  comments: {
    allowComments: boolean;
    filterOffensive: boolean;
    autoHide: boolean;
    allowGifs: boolean;
    tiGuyCommentsEnabled: boolean;
  };
  sharing: {
    allowShares: boolean;
    allowRemix: boolean;
    allowDownload: boolean;
    allowEmbed: boolean;
  };
  favorites: {
    showFavoritesFirst: boolean;
    notifyWhenLive: boolean;
  };
  restricted: {
    accounts: string[];
  };
  muted: {
    accounts: string[];
    hideStories: boolean;
    hidePosts: boolean;
  };
  content: {
    sensitiveFilter: ContentFilterLevel;
    personalizedAds: boolean;
    autoplayRecommendations: boolean;
  };
  media: {
    autoplayFeed: boolean;
    highQualityUploads: boolean;
    saveOriginals: boolean;
  };
  audio: {
    muteByDefault: boolean;
    normalizeVolume: boolean;
    autoAddMusic: boolean;
  };
  storage: {
    dataSaver: boolean;
    downloadWifiOnly: boolean;
    cacheSizeMb: number;
  };
  app: {
    haptics: boolean;
    analytics: boolean;
    betaFeatures: boolean;
  };
  privacy: {
    privateAccount: boolean;
    twoFactor: boolean;
    loginAlerts: boolean;
  };
  notifications: {
    push: boolean;
    emailDigest: boolean;
    reminders: boolean;
    notifyComments: boolean;
    notifyFires: boolean;
    notifyFollows: boolean;
  };
  interactions: {
    swipeGestures: boolean;
    doubleTapToFire: boolean;
  };
  region: string;
  language: LanguageOption;
}

type PreferencePath =
  | `tags.${keyof SettingsPreferences["tags"]}`
  | `comments.${keyof SettingsPreferences["comments"]}`
  | `sharing.${keyof SettingsPreferences["sharing"]}`
  | `favorites.${keyof SettingsPreferences["favorites"]}`
  | `restricted.${keyof SettingsPreferences["restricted"]}`
  | `muted.${keyof SettingsPreferences["muted"]}`
  | `content.${keyof SettingsPreferences["content"]}`
  | `media.${keyof SettingsPreferences["media"]}`
  | `audio.${keyof SettingsPreferences["audio"]}`
  | `storage.${keyof SettingsPreferences["storage"]}`
  | `app.${keyof SettingsPreferences["app"]}`
  | `privacy.${keyof SettingsPreferences["privacy"]}`
  | `notifications.${keyof SettingsPreferences["notifications"]}`
  | `interactions.${keyof SettingsPreferences["interactions"]}`
  | "region"
  | "language";

const STORAGE_KEY = "zyeute-settings";

const basePreferences: SettingsPreferences = {
  tags: {
    allowTagging: true,
    requireApproval: false,
    mentionScope: "everyone",
  },
  comments: {
    allowComments: true,
    filterOffensive: true,
    autoHide: true,
    allowGifs: true,
    tiGuyCommentsEnabled: true,
  },
  sharing: {
    allowShares: true,
    allowRemix: true,
    allowDownload: false,
    allowEmbed: true,
  },
  favorites: {
    showFavoritesFirst: true,
    notifyWhenLive: true,
  },
  restricted: {
    accounts: [],
  },
  muted: {
    accounts: [],
    hideStories: false,
    hidePosts: false,
  },
  content: {
    sensitiveFilter: "medium",
    personalizedAds: true,
    autoplayRecommendations: true,
  },
  media: {
    autoplayFeed: true,
    highQualityUploads: true,
    saveOriginals: false,
  },
  audio: {
    muteByDefault: false,
    normalizeVolume: true,
    autoAddMusic: false,
  },
  storage: {
    dataSaver: false,
    downloadWifiOnly: true,
    cacheSizeMb: 320,
  },
  app: {
    haptics: true,
    analytics: true,
    betaFeatures: false,
  },
  privacy: {
    privateAccount: false,
    twoFactor: true,
    loginAlerts: true,
  },
  notifications: {
    push: true,
    emailDigest: false,
    reminders: true,
    notifyComments: true,
    notifyFires: true,
    notifyFollows: true,
  },
  interactions: {
    swipeGestures: true,
    doubleTapToFire: true,
  },
  region: "mtl",
  language: "fr",
};

const clonePreferences = (): SettingsPreferences =>
  JSON.parse(JSON.stringify(basePreferences));

const mergeWithDefaults = (
  defaults: SettingsPreferences,
  stored?: Partial<SettingsPreferences>,
): SettingsPreferences => {
  if (!stored) return defaults;
  const result: SettingsPreferences = clonePreferences();

  (Object.keys(defaults) as Array<keyof SettingsPreferences>).forEach((key) => {
    const defaultValue = defaults[key];
    const storedValue = stored[key];

    if (storedValue === undefined) {
      result[key] = defaultValue as any;
      return;
    }

    if (Array.isArray(defaultValue)) {
      result[key] = Array.isArray(storedValue)
        ? (storedValue as any)
        : (defaultValue as any);
      return;
    }

    if (
      typeof defaultValue === "object" &&
      defaultValue !== null &&
      !Array.isArray(defaultValue)
    ) {
      result[key] = {
        ...defaultValue,
        ...(storedValue as Record<string, unknown>),
      } as any;
      return;
    }

    result[key] = storedValue as any;
  });

  return result;
};

const setValueAtPath = (
  obj: SettingsPreferences,
  path: PreferencePath,
  value: unknown,
): SettingsPreferences => {
  const segments = path.split(".");
  const next = JSON.parse(JSON.stringify(obj)) as SettingsPreferences;
  let cursor: any = next;

  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      cursor[segment] = value;
      return;
    }

    cursor[segment] = { ...cursor[segment] };
    cursor = cursor[segment];
  });

  return next;
};

const getValueAtPath = (obj: SettingsPreferences, path: PreferencePath) => {
  const segments = path.split(".");
  let cursor: any = obj;

  for (const segment of segments) {
    if (cursor == null) return undefined;
    cursor = cursor[segment];
  }

  return cursor;
};

export function useSettingsPreferences() {
  const [preferences, setPreferences] = useState<SettingsPreferences>(() => {
    if (typeof window === "undefined") {
      return clonePreferences();
    }

    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      if (!storedValue) return clonePreferences();
      const parsed = JSON.parse(storedValue) as Partial<SettingsPreferences>;
      return mergeWithDefaults(clonePreferences(), parsed);
    } catch (error) {
      useSettingsPreferencesLogger.warn(
        "Failed to parse stored settings, using defaults",
        error,
      );
      return clonePreferences();
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setPreference = useCallback((path: PreferencePath, value: unknown) => {
    setPreferences((prev) => setValueAtPath(prev, path, value));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(clonePreferences());
  }, []);

  const getPreference = useCallback(
    (path: PreferencePath) => getValueAtPath(preferences, path),
    [preferences],
  );

  return {
    preferences,
    setPreference,
    getPreference,
    resetPreferences,
  };
}
