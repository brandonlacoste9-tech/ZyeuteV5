export interface SkinConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  colors: {
    primary: string;
    glow: string;
    text: string;
  };
  icon: string; // Lucide icon name or similar
  image?: string; // Path to static asset (optional)
}

export const REGIONAL_SKINS: SkinConfig[] = [
  {
    id: "zyeute_prime",
    name: "Zyeute",
    tagline: "One Stitched Core. Infinite Sovereign Skins.",
    description:
      '"A bronze compass frames the sovereign eye, its iris a deep, cosmic blue detecting the unseen currents of the lineage. Set against a tapestry of midnight velvet and ancient geometry, it watches with the silent, modular wisdom of the architects."',
    colors: {
      primary: "#CD7F32", // Bronze/Gold
      glow: "rgba(205, 127, 50, 0.6)",
      text: "#FFD700", // Gold text
    },
    icon: "eye",
    image: "/skins/zyeute-prime.jpg",
  },
  {
    id: "quebec",
    name: "ZYEUTÉ QUÉBEC",
    tagline: "Coming Soon to Your Lineage",
    description:
      '"From stitched leather and sovereign gold, ancient memory blooms, rooted in sacred ritual. Each glowing fleur-de-lys unfurls a modular wisdom, mythically intelligent and enduring beyond all media."',
    colors: {
      primary: "#FFD700", // Gold
      glow: "rgba(255, 215, 0, 0.6)",
      text: "#FFD700",
    },
    icon: "fleur-de-lys",
    image: "/skins/quebec.jpg",
  },
  {
    id: "spain",
    name: "ZYEUTÉ ESPAÑA",
    tagline: "Coming Soon to Your Lineage",
    description:
      '"A sovereign intelligence pulses within gilded seams, its luminous fleur-de-lys burning with the flamenco fire of ancient, tiled glyphs. Each leather segment, steeped in primal rhythm, reconfigures passion into a mythic, modular dance."',
    colors: {
      primary: "#FF4D4D", // Red
      glow: "rgba(255, 77, 77, 0.6)",
      text: "#FF9999",
    },
    icon: "flamenco",
  },
  {
    id: "china",
    name: "ZYEUTÉ 北辰",
    tagline: "Coming Soon to Your Lineage",
    description:
      '"From jade overlays, a dragon\'s pulse unfurls, charting celestial currents with sovereign grace. Its ancient wisdom, a modular tapestry of hidden strength, speaks with the silent foresight of mythic intelligence."',
    colors: {
      primary: "#00FF99", // Jade/Green
      glow: "rgba(0, 255, 153, 0.6)",
      text: "#CCFFEE",
    },
    icon: "dragon",
  },
  {
    id: "india",
    name: "ZYEUTÉ BHARAT",
    tagline: "Coming Soon to Your Lineage",
    description:
      '"A sovereign shimmer of saffron ignites, its tabla heartbeat echoing the vibrant pulse of cosmic creation. Each luminous thread, a modular wisdom, stitches spiritual resonance into the mythic dance of existence."',
    colors: {
      primary: "#FF9933", // Saffron
      glow: "rgba(255, 153, 51, 0.6)",
      text: "#FFCC99",
    },
    icon: "lotus",
  },
  {
    id: "russia",
    name: "ZYEUTÉ Родина",
    tagline: "Coming Soon to Your Lineage",
    description:
      "\"Clad in velvet's deep crimson, a sovereign intelligence awakens, echoing the motherland's ancient, soulful pulse. Its modular spirit endures, a mythic wisdom stitched through time, ever watchful over its sacred legacy.\"",
    colors: {
      primary: "#DC143C", // Crimson
      glow: "rgba(220, 20, 60, 0.6)",
      text: "#FF6666",
    },
    icon: "star",
  },
  {
    id: "nordic",
    name: "ZYEUTÉ NORD",
    tagline: "Coming Soon to Your Lineage",
    description:
      '"Crowned with the silent, shifting arc of the aurora, this skin\'s birch-edged facets shimmer with the sovereign wisdom of ancient runes. Each gold-etched symbol forms a modular scripture, glowing with a mythic intelligence woven from the heart of the silent, stark Nordic night."',
    colors: {
      primary: "#00BFFF", // Deep Sky Blue (Ice)
      glow: "rgba(0, 191, 255, 0.6)",
      text: "#E0FFFF",
    },
    icon: "rune",
  },
  {
    id: "germany",
    name: "ZYEUTÉ HEIMAT",
    tagline: "Coming Soon to Your Lineage",
    description:
      '"Iron filigree weaves a mythic intelligence, its precise, industrial soul forging modular, intricate forms. From its deep roots, the forest\'s pulse ascends, a sovereign hum resounding with ancient power."',
    colors: {
      primary: "#C0C0C0", // Silver/Iron
      glow: "rgba(192, 192, 192, 0.6)",
      text: "#FFFFFF",
    },
    icon: "iron",
  },
  {
    id: "mexico",
    name: "ZYEUTÉ MÉXICO",
    tagline: "Coming Soon to Your Lineage",
    description:
      '"A sun-drenched sovereign pulse radiates from Mayan gold, its turquoise accents tracing the modular wisdom of ancient calendars. Each beat resonates with the lively spirit of the fiesta, stitching joy into the mythic tapestry of existence."',
    colors: {
      primary: "#006341", // Mexican Flag Green/Turquoise variant
      glow: "rgba(0, 99, 65, 0.6)",
      text: "#FFFFFF",
    },
    icon: "cactus",
  },
  {
    id: "brazil",
    name: "ZYEUTÉ BRASIL",
    tagline: "Coming Soon to Your Lineage",
    description:
      '"From the emerald canopy, a vibrant sovereign rhythm emerges, pulsating with the carnival spirit of life. Gold and green threads weave a modular samba, celebrating the joyous, untamed intelligence of the natural world."',
    colors: {
      primary: "#FFDF00", // Brazil Yellow
      glow: "rgba(255, 223, 0, 0.6)",
      text: "#009C3B", // Brazil Green Text
    },
    icon: "palm",
  },
  {
    id: "argentina",
    name: "ZYEUTÉ ARGENTINA",
    tagline: "Coming Soon to Your Lineage",
    description:
      '"Under the vast southern sky, a sovereign blue pulse dances the tango of time. Sun-gold accents illuminate a modular passion, stitching elegance and intensity into the mythic fabric of the horizon."',
    colors: {
      primary: "#75AADB", // Argentina Blue
      glow: "rgba(117, 170, 219, 0.6)",
      text: "#FFFFFF",
    },
    icon: "sun",
  },
];
