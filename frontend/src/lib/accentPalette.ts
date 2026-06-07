/** Generate and apply a full accent scale from one hex color (app-wide gold-* remap). */

const DEFAULT_GOLD = "#D4AF37";

export function normalizeHex(hex: string): string {
  let h = hex.trim();
  if (!h.startsWith("#")) h = `#${h}`;
  if (h.length === 4) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h.toUpperCase();
}

export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  const n = normalizeHex(hex).slice(1);
  if (n.length !== 6 || !/^[0-9A-F]{6}$/i.test(n)) return null;
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const rgb = hexToRgb(hex) ?? hexToRgb(DEFAULT_GOLD)!;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r: number;
  let g: number;
  let b: number;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

function shadeHex(baseHex: string, lightnessDelta: number): string {
  const { h, s, l } = hexToHsl(baseHex);
  return hslToHex(h, s, Math.max(8, Math.min(92, l + lightnessDelta)));
}

const SCALE_DELTAS: Record<number, number> = {
  50: 38,
  100: 30,
  200: 20,
  300: 12,
  400: 5,
  500: 0,
  600: -8,
  700: -14,
  800: -20,
  900: -26,
  950: -32,
};

/** Apply accent hex to Tailwind gold scale + edge/glow CSS variables on :root. */
export function applyAccentPalette(baseHex: string): string {
  const base = normalizeHex(baseHex);
  const root = document.documentElement;

  for (const [step, delta] of Object.entries(SCALE_DELTAS)) {
    const color = delta === 0 ? base : shadeHex(base, delta);
    root.style.setProperty(`--color-gold-${step}`, color);
  }

  root.style.setProperty("--edge-color", base);
  root.style.setProperty("--accent-primary", base);
  root.style.setProperty("--leather-gold", base);

  const rgb = hexToRgb(base);
  if (rgb) {
    root.style.setProperty("--accent-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    root.style.setProperty(
      "--glow-color",
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`,
    );
  }

  return base;
}

export { DEFAULT_GOLD };
