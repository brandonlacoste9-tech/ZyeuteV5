/**
 * Geo/Language Auto-detection utilities
 * Silently detects the user's hive, language, and region from browser signals.
 * No UI changes — all logic runs in the background.
 */

export type HiveId = "quebec" | "mexico" | "brazil" | "argentina";
export type LanguageCode = "fr" | "en" | "es" | "pt";

const QUEBEC_TIMEZONES = new Set([
  "America/Toronto",
  "America/Montreal",
  "America/Quebec",
  "America/Moncton",
  "America/Halifax",
]);

const CANADA_TIMEZONES = new Set([
  "America/Toronto",
  "America/Montreal",
  "America/Quebec",
  "America/Moncton",
  "America/Halifax",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Regina",
]);

const MEXICO_TIMEZONES = new Set([
  "America/Mexico_City",
  "America/Monterrey",
  "America/Merida",
  "America/Mazatlan",
  "America/Chihuahua",
  "America/Hermosillo",
  "America/Tijuana",
  "America/Cancun",
]);

const BRAZIL_TIMEZONES = new Set([
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Fortaleza",
  "America/Recife",
  "America/Maceio",
  "America/Bahia",
  "America/Cuiaba",
  "America/Porto_Velho",
  "America/Boa_Vista",
  "America/Noronha",
  "America/Araguaina",
]);

const ARGENTINA_TIMEZONES = new Set([
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Cordoba",
  "America/Argentina/Mendoza",
  "America/Argentina/Salta",
  "America/Argentina/Jujuy",
]);

/**
 * Detects the best hive from browser timezone and language.
 * Never throws — always returns a safe default.
 */
export function detectHiveFromBrowser(): HiveId {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lang = (navigator.language || "").toLowerCase();

    // Quebec timezones → quebec
    if (QUEBEC_TIMEZONES.has(tz)) return "quebec";

    // French Canadian language + Canadian timezone → quebec
    if ((lang === "fr" || lang === "fr-ca") && CANADA_TIMEZONES.has(tz)) {
      return "quebec";
    }

    // Mexico timezones → mexico
    if (MEXICO_TIMEZONES.has(tz)) return "mexico";

    // Brazil timezones → brazil
    if (BRAZIL_TIMEZONES.has(tz)) return "brazil";

    // Argentina timezones → argentina
    if (ARGENTINA_TIMEZONES.has(tz)) return "argentina";

    // Language-based fallbacks when timezone doesn't match above sets
    if (lang === "es-mx") return "mexico";
    if (lang === "pt" || lang === "pt-br") return "brazil";
    if (lang === "es-ar") return "argentina";

    // Other es-* in Americas → mexico (default Spanish)
    if (lang.startsWith("es") && tz.startsWith("America/")) return "mexico";

    // Other Canadian timezones → quebec (default Canada)
    if (CANADA_TIMEZONES.has(tz)) return "quebec";

    // fr / fr-CA without specific timezone → quebec
    if (lang === "fr" || lang === "fr-ca") return "quebec";
  } catch {
    // Ignore any browser API errors
  }

  // Safe default
  return "quebec";
}

/**
 * Detects the user's preferred language from the browser.
 * Returns one of: "fr", "en", "es", "pt"
 */
export function detectLanguageFromBrowser(): LanguageCode {
  try {
    const lang = (navigator.language || "").toLowerCase();

    if (lang.startsWith("fr")) return "fr";
    if (lang.startsWith("pt")) return "pt";
    if (lang.startsWith("es")) return "es";
  } catch {
    // Ignore
  }

  return "en";
}

/**
 * Maps timezone to a region_id string based on hive.
 */
export function detectRegionFromTimezone(hive: HiveId): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

    switch (hive) {
      case "quebec":
        if (tz === "America/Montreal" || tz === "America/Toronto")
          return "montreal";
        if (tz === "America/Quebec") return "quebec_city";
        if (tz === "America/Moncton") return "gatineau";
        return "montreal";

      case "mexico":
        if (tz === "America/Mexico_City") return "cdmx";
        if (tz === "America/Monterrey") return "monterrey";
        if (tz === "America/Merida" || tz === "America/Cancun")
          return "yucatan";
        if (
          tz === "America/Mazatlan" ||
          tz === "America/Hermosillo" ||
          tz === "America/Tijuana"
        )
          return "guadalajara";
        return "cdmx";

      case "brazil":
        if (tz === "America/Sao_Paulo") return "sao_paulo";
        if (tz === "America/Manaus") return "amazonia";
        if (
          tz === "America/Fortaleza" ||
          tz === "America/Recife" ||
          tz === "America/Maceio" ||
          tz === "America/Bahia"
        )
          return "nordeste";
        return "sao_paulo";

      case "argentina":
        if (tz === "America/Argentina/Buenos_Aires") return "buenos_aires";
        if (tz === "America/Argentina/Cordoba") return "cordoba";
        if (tz === "America/Argentina/Mendoza") return "mendoza";
        return "buenos_aires";

      default:
        return "montreal";
    }
  } catch {
    // Ignore
  }

  return hive === "mexico"
    ? "cdmx"
    : hive === "brazil"
      ? "sao_paulo"
      : hive === "argentina"
        ? "buenos_aires"
        : "montreal";
}
