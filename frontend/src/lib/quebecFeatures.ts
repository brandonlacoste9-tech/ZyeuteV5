/**
 * 🔥⚜️ QUEBEC-EXCLUSIVE FEATURES ⚜️🔥
 *
 * This module contains all Quebec-specific features, translations,
 * and cultural elements that make Zyeuté uniquely Québécois.
 *
 * Zyeuté - L'app sociale du Québec 🦫⚜️
 */

// ==================== QUEBEC REGIONS ====================
export const QUEBEC_REGIONS = [
  { id: "montreal", name: "Montréal", emoji: "🏙️" },
  { id: "quebec", name: "Québec", emoji: "🏰" },
  { id: "gatineau", name: "Gatineau", emoji: "🌉" },
  { id: "sherbrooke", name: "Sherbrooke", emoji: "🏔️" },
  { id: "trois-rivieres", name: "Trois-Rivières", emoji: "⛵" },
  { id: "saguenay", name: "Saguenay", emoji: "🌊" },
  { id: "levis", name: "Lévis", emoji: "🚢" },
  { id: "laval", name: "Laval", emoji: "🏘️" },
  { id: "longueuil", name: "Longueuil", emoji: "🌆" },
  { id: "gaspesie", name: "Gaspésie", emoji: "🦞" },
  { id: "charlevoix", name: "Charlevoix", emoji: "⛰️" },
  { id: "estrie", name: "Estrie", emoji: "🌲" },
  { id: "laurentides", name: "Laurentides", emoji: "⛷️" },
  { id: "mauricie", name: "Mauricie", emoji: "🌲" },
  { id: "abitibi", name: "Abitibi-Témiscamingue", emoji: "⛏️" },
] as const;

// ==================== MONTREAL NEIGHBORHOODS ====================
export const MONTREAL_QUARTIERS = [
  { id: "plateau", name: "Le Plateau", vibe: "Hipster central" },
  { id: "mile-end", name: "Mile End", vibe: "Artsy & chill" },
  { id: "vieux-mtl", name: "Vieux-Montréal", vibe: "Touristique mais cute" },
  { id: "hochelaga", name: "Hochelaga", vibe: "Up & coming" },
  { id: "rosemont", name: "Rosemont", vibe: "Familial & authentique" },
  { id: "verdun", name: "Verdun", vibe: "By the water" },
  { id: "griffintown", name: "Griffintown", vibe: "Nouveau riche" },
  { id: "outremont", name: "Outremont", vibe: "Fancy AF" },
  { id: "cdg", name: "Côte-des-Neiges", vibe: "Multiculturel" },
  { id: "gay-village", name: "Village", vibe: "🏳️‍🌈 Pride!" },
] as const;

// ==================== JOUAL TRANSLATIONS ====================
export const JOUAL_DICTIONARY = {
  // Social Actions
  like: "Donner du feu 🔥",
  comment: "Jasette 💬",
  share: "Partager ça",
  follow: "Suivre",
  unfollow: "Unfollow",

  // UI Elements
  feed: "Mon feed",
  explore: "Découvrir",
  profile: "Mon profil",
  notifications: "Mes notifs",
  messages: "Mes messages",
  settings: "Paramètres",

  // Post Actions
  post: "Poster",
  caption: "Caption",
  location: "Localisation",
  addMusic: "Ajouter de la musique",
  filters: "Filtres",

  // Quebec Slang
  cool: "Tiguidou",
  nice: "Nice en criss",
  awesome: "Malade!",
  lol: "Haha tabarnak",
  yes: "Ouin",
  no: "Non",
  maybe: "Peut-être",

  // Weather (important in Quebec!)
  cold: "Frette en esti",
  hot: "Chaud en tabarnak",
  snow: "Y neige!",
  construction: "Saison de construction 🚧",
} as const;

// ==================== VIRTUAL GIFTS ====================
export interface VirtualGift {
  id: string;
  name: string;
  nameJoual: string;
  emoji: string;
  price: number; // in "cennes"
  description: string;
}

export const VIRTUAL_GIFTS: VirtualGift[] = [
  {
    id: "poutine",
    name: "Poutine",
    nameJoual: "Une pout",
    emoji: "🍟",
    price: 10,
    description: "Le classique indémodable",
  },
  {
    id: "caribou",
    name: "Caribou",
    nameJoual: "Un p'tit caribou",
    emoji: "🦌",
    price: 50,
    description: "Pour réchauffer l'hiver",
  },
  {
    id: "fleur-de-lys",
    name: "Fleur-de-lys",
    nameJoual: "Une fleur",
    emoji: "⚜️",
    price: 100,
    description: "Fierté québécoise",
  },
  {
    id: "cone-orange",
    name: "Cône orange",
    nameJoual: "Le cône",
    emoji: "🚧",
    price: 25,
    description: "Symbole de l'été québécois",
  },
  {
    id: "sirop-erable",
    name: "Sirop d'érable",
    nameJoual: "Du sirop",
    emoji: "🌲",
    price: 75,
    description: "Le goût du Québec",
  },
  {
    id: "tourtiere",
    name: "Tourtière",
    nameJoual: "Une tourtière",
    emoji: "🥧",
    price: 35,
    description: "Le goût des Fêtes",
  },
  {
    id: "biere",
    name: "Bière québécoise",
    nameJoual: "Une frette",
    emoji: "🍺",
    price: 20,
    description: "Une bonne frette locale",
  },
  {
    id: "hockey",
    name: "Bâton de hockey",
    nameJoual: "Un bâton",
    emoji: "🏒",
    price: 150,
    description: "Pour les vrais fans",
  },
];

// ==================== QUEBEC MUSIC LIBRARY ====================
export interface QuebecMusic {
  id: string;
  title: string;
  artist: string;
  genre: string;
  vibes: string[];
  spotifyUri?: string;
}

export const QUEBEC_MUSIC: QuebecMusic[] = [
  {
    id: "cowboys-1",
    title: "L'Amérique pleure",
    artist: "Les Cowboys Fringants",
    genre: "Rock alternatif",
    vibes: ["Nostalgique", "Québécois", "Classique"],
  },
  {
    id: "cardin-1",
    title: "Passive Aggressive",
    artist: "Charlotte Cardin",
    genre: "Pop/R&B",
    vibes: ["Moderne", "Chill", "Vibes"],
  },
  {
    id: "loud-1",
    title: "Toutes les femmes savent danser",
    artist: "Loud",
    genre: "Hip-hop",
    vibes: ["Party", "Énergique", "Rap QC"],
  },
  {
    id: "klo-1",
    title: "Cavalier",
    artist: "Klo Pelgag",
    genre: "Art pop",
    vibes: ["Artistique", "Unique", "Expérimental"],
  },
  {
    id: "boulay-1",
    title: "Provocante",
    artist: "Isabelle Boulay",
    genre: "Chanson",
    vibes: ["Classique", "Romantique", "Voix"],
  },
  {
    id: "hhh-1",
    title: "Celine",
    artist: "Hubert Lenoir",
    genre: "Rock alternatif",
    vibes: ["Indie", "Weird", "Cool"],
  },
];

// ==================== QUEBEC HASHTAGS ====================
export const QUEBEC_HASHTAGS = [
  "#Poutine",
  "#QC",
  "#MTL",
  "#QuebecCity",
  "#BelleProvince",
  "#Tabarnak",
  "#FretteEnEstie",
  "#CôneOrange",
  "#ConstructionSeason",
  "#HiverQuébécois",
  "#SaintJean",
  "#Osheaga",
  "#FrancoFolies",
  "#Carnaval",
  "#514",
  "#438",
  "#418",
  "#MileEnd",
  "#Plateau",
  "#VieuxMontréal",
  "#QuebecLife",
  "#FaitAuQuébec",
] as const;

// ==================== SEASONAL EVENTS ====================
export interface QuebecEvent {
  id: string;
  name: string;
  nameJoual: string;
  date: string; // MM-DD format
  emoji: string;
  description: string;
  hashtag: string;
}

export const QUEBEC_EVENTS: QuebecEvent[] = [
  {
    id: "saint-jean",
    name: "Saint-Jean-Baptiste",
    nameJoual: "La Saint-Jean",
    date: "06-24",
    emoji: "⚜️🎉",
    description: "Fête nationale du Québec!",
    hashtag: "#SaintJean",
  },
  {
    id: "osheaga",
    name: "Osheaga",
    nameJoual: "Osheaga",
    date: "08-01",
    emoji: "🎵🎪",
    description: "Le festival de musique de l'été",
    hashtag: "#Osheaga",
  },
  {
    id: "carnaval",
    name: "Carnaval de Québec",
    nameJoual: "Le Carnaval",
    date: "02-01",
    emoji: "⛄❄️",
    description: "La plus grande fête hivernale!",
    hashtag: "#Carnaval",
  },
  {
    id: "montreal-en-lumiere",
    name: "Montréal en Lumière",
    nameJoual: "Lumière",
    date: "02-15",
    emoji: "💡🌟",
    description: "Festival gastronomique et culturel",
    hashtag: "#MTLenLumiere",
  },
  {
    id: "juste-pour-rire",
    name: "Juste pour rire",
    nameJoual: "JPR",
    date: "07-15",
    emoji: "😂🎭",
    description: "Festival d'humour international",
    hashtag: "#JustePourRire",
  },
];

// ==================== FILTERS (Quebec-themed) ====================
export interface PhotoFilter {
  id: string;
  name: string;
  nameJoual: string;
  css: string;
  description: string;
}

export const QUEBEC_FILTERS: PhotoFilter[] = [
  {
    id: "poutine",
    name: "Poutine",
    nameJoual: "Pout",
    css: "sepia(40%) saturate(120%) brightness(105%)",
    description: "Ton photo, sauce brune style",
  },
  {
    id: "hiver",
    name: "Hiver",
    nameJoual: "Frette",
    css: "brightness(110%) contrast(95%) saturate(80%) hue-rotate(190deg)",
    description: "Vibes frettes de janvier",
  },
  {
    id: "ete",
    name: "Été",
    nameJoual: "Hot",
    css: "brightness(115%) saturate(140%) contrast(105%)",
    description: "Chaud comme en juillet",
  },
  {
    id: "construction",
    name: "Construction",
    nameJoual: "Orange",
    css: "saturate(150%) hue-rotate(20deg) contrast(110%)",
    description: "Orange comme les cônes",
  },
  {
    id: "vintage",
    name: "Vintage",
    nameJoual: "Oldschool",
    css: "sepia(50%) saturate(80%) contrast(90%)",
    description: "Vibes années 70",
  },
  {
    id: "bleu-blanc",
    name: "Bleu-Blanc",
    nameJoual: "Patriote",
    css: "saturate(120%) hue-rotate(200deg) brightness(105%)",
    description: "Couleurs du Québec",
  },
];

// ==================== TI-GUY AI PROMPTS ====================
export const TI_GUY_PROMPTS = {
  system: `Tu es Ti-Guy, l'assistant IA de Zyeuté, le réseau social québécois.
Tu parles JOUAL authentique - pas du français standard.
Tu comprends les références culturelles québécoises.
Tu es friendly, drôle, et authentique.
Tu utilises des expressions comme: "tiguidou", "en esti", "criss", "tabarnak" (avec modération).
Tu es fier du Québec et de sa culture.`,

  captionGeneration: `Génère une caption en joual québécois pour cette image.
Sois créatif, drôle, et authentique.
Utilise des références culturelles québécoises si approprié.
Ajoute 2-3 hashtags québécois pertinents.
Maximum 280 caractères.`,

  hashtagSuggestion: `Suggère 5 hashtags québécois pertinents pour ce contenu.
Inclus un mix de populaires (#MTL, #QC) et de niche.
Utilise le joual quand c'est approprié.`,

  imageEdit: `Décris comment modifier cette image selon cette demande en joual: {prompt}
Sois précis et créatif.`,
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Get current season in Quebec
 */
export function getCurrentQuebecSeason():
  | "hiver"
  | "printemps"
  | "ete"
  | "automne"
  | "construction" {
  const month = new Date().getMonth() + 1;

  if (month >= 5 && month <= 10) return "construction"; // May-Oct = construction season!
  if (month === 12 || month <= 2) return "hiver";
  if (month >= 3 && month <= 5) return "printemps";
  if (month >= 6 && month <= 8) return "ete";
  return "automne";
}

/**
 * Check if today is a Quebec holiday/event
 */
export function getTodaysQuebecEvent(): QuebecEvent | null {
  const today = new Date();
  const dateStr = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return QUEBEC_EVENTS.find((event) => event.date === dateStr) || null;
}

/**
 * Get random Quebec greeting
 */
export function getRandomQuebecGreeting(): string {
  const greetings = [
    "Salut!",
    "Allo!",
    "Heille!",
    "Yo!",
    "Coudonc!",
    "Ça va bien?",
    "Tiguidou?",
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * Format number Quebec-style (spaces for thousands)
 */
export function formatQuebecNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Get area code from region
 */
export function getAreaCode(region: string): string {
  const areaCodes: Record<string, string> = {
    montreal: "514/438",
    laval: "450",
    longueuil: "450",
    quebec: "418/581",
    gatineau: "819/873",
    sherbrooke: "819/873",
    "trois-rivieres": "819/873",
    saguenay: "418/581",
  };
  return areaCodes[region] || "418";
}

// ==================== EXPORT ALL ====================
export default {
  QUEBEC_REGIONS,
  MONTREAL_QUARTIERS,
  JOUAL_DICTIONARY,
  VIRTUAL_GIFTS,
  QUEBEC_MUSIC,
  QUEBEC_HASHTAGS,
  QUEBEC_EVENTS,
  QUEBEC_FILTERS,
  TI_GUY_PROMPTS,
  getCurrentQuebecSeason,
  getTodaysQuebecEvent,
  getRandomQuebecGreeting,
  formatQuebecNumber,
  getAreaCode,
};
