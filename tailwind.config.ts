import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./frontend/src/**/*.{js,ts,jsx,tsx,mdx}", "./frontend/index.html"],
  theme: {
    extend: {
      colors: {
        // Zyeuté Quebec Color Palette
        "zyeute-blue": "#003399", // Quebec Blue - Primary
        "zyeute-snow": "#F8F9FA", // Snow White - Backgrounds
        "zyeute-alert": "#DC3545", // Alert Red - Destructive
        "zyeute-hydro": "#FFCC00", // Hydro Yellow - Highlights

        // Semantic aliases
        "quebec-blue": "#003399",
        "snow-white": "#F8F9FA",
        "alert-red": "#DC3545",
        "hydro-yellow": "#FFCC00",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
