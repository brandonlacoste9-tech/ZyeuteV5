/**
 * Original Québec street clips — mix into Pour toi while TikAPI is capped.
 * Files live in /clips/qc-*.mp4 (Netlify static).
 */
import type { Post } from "@/types";

const HOUSE = {
  id: "zyeute-house",
  username: "zyeute",
  display_name: "Zyeuté",
  displayName: "Zyeuté",
  avatar_url: "/pwa-192.png",
  avatarUrl: "/pwa-192.png",
  bio: "Quessé qui se passe icitte?",
  city: "Montréal",
  region: "QC",
  is_verified: true,
  isVerified: true,
  created_at: "2026-09-18T00:00:00.000Z",
  updated_at: "2026-09-18T00:00:00.000Z",
  role: "founder" as const,
};

const CLIPS: Array<{
  id: string;
  file: string;
  caption: string;
  city: string;
}> = [
  {
    id: "qc-street-01",
    file: "qc-01",
    caption: "Poutine qui fume à minuit. Si y'a pas de fromage en grains, c'est pas une poutine.",
    city: "Montréal",
  },
  {
    id: "qc-street-02",
    file: "qc-02",
    caption: "La orange line au complet. On rentre icitte.",
    city: "Montréal",
  },
  {
    id: "qc-street-03",
    file: "qc-03",
    caption: "Premier 20 degrés. La terrasse du Plateau est pleine.",
    city: "Montréal",
  },
  {
    id: "qc-street-04",
    file: "qc-04",
    caption: "Vieux-Québec sous la neige. Les pierres se souviennent.",
    city: "Québec",
  },
  {
    id: "qc-street-05",
    file: "qc-05",
    caption: "Minuit au dépanneur du coin. Le Québec, là.",
    city: "Montréal",
  },
  {
    id: "qc-street-06",
    file: "qc-06",
    caption: "Quand le Stade chante, on l'entend jusqu'à la maison.",
    city: "Montréal",
  },
  {
    id: "qc-street-07",
    file: "qc-07",
    caption: "Fin de semaine au chalet. Le lac est gelé encore.",
    city: "Laurentides",
  },
  {
    id: "qc-street-08",
    file: "qc-08",
    caption: "Carnaval dans la rue. Les parka, les lumières, la neige.",
    city: "Québec",
  },
  {
    id: "qc-street-09",
    file: "qc-09",
    caption: "Tire d'érable sur la neige. Si ça colle pas au bâton, c'est trop cuit.",
    city: "Montérégie",
  },
  {
    id: "qc-street-10",
    file: "qc-10",
    caption: "Bagels St-Viateur à 6h. Encore chauds. Le Mile End sent le sésame.",
    city: "Montréal",
  },
  {
    id: "qc-street-11",
    file: "qc-11",
    caption: "Hockey sur le lac. Pas de sifflet. Juste le froid et la rondelle.",
    city: "Laurentides",
  },
  {
    id: "qc-street-12",
    file: "qc-12",
    caption: "Mont-Royal au coucher. Toute la ville en bas. On respire.",
    city: "Montréal",
  },
  {
    id: "qc-street-13",
    file: "qc-13",
    caption: "Jean-Talon un samedi. Tomates, maïs, érable. Le marché parle français.",
    city: "Montréal",
  },
  {
    id: "qc-street-14",
    file: "qc-14",
    caption: "Le traversier Québec–Lévis. Le fleuve, le château, le froid dans la face.",
    city: "Québec",
  },
  {
    id: "qc-street-15",
    file: "qc-15",
    caption: "Smoked meat coupé à la main. Moutarde, seigle, c'est tout.",
    city: "Montréal",
  },
  {
    id: "qc-street-16",
    file: "qc-16",
    caption: "La souffleuse dans la ruelle. Les triplex, les lumières jaunes, l'hiver.",
    city: "Montréal",
  },
  {
    id: "qc-street-17",
    file: "qc-17",
    caption: "Un steamé à 2h. Chou, moutarde, pain vapeur. Montréal, icitte.",
    city: "Montréal",
  },
  {
    id: "qc-street-18",
    file: "qc-18",
    caption: "Phare en Gaspésie. Le golfe tape. On est encore au bout du monde.",
    city: "Gaspésie",
  },
  {
    id: "qc-street-19",
    file: "qc-19",
    caption: "Spa nordique dans les pins. L'eau chaude, la neige, on dit plus rien.",
    city: "Lanaudière",
  },
  {
    id: "qc-street-20",
    file: "qc-20",
    caption: "Accordéon dans le métro. Le corridor chante plus fort que le train.",
    city: "Montréal",
  },
  {
    id: "qc-street-21",
    file: "qc-21",
    caption: "Percé. Le rocher perce encore. Le golfe n'a pas changé.",
    city: "Gaspésie",
  },
  {
    id: "qc-street-22",
    file: "qc-22",
    caption: "Le fjord du Saguenay. Les falaises, l'eau noire, on se tait.",
    city: "Saguenay",
  },
  {
    id: "qc-street-23",
    file: "qc-23",
    caption: "La Saint-Jean dans la rue. Feu, bleu, blanc. C'est chez nous.",
    city: "Montréal",
  },
  {
    id: "qc-street-24",
    file: "qc-24",
    caption: "Cabane à sucre le matin. Fèves, œufs, oreilles de crisse.",
    city: "Montérégie",
  },
  {
    id: "qc-street-25",
    file: "qc-25",
    caption: "La glace, le rouge, le bruit. Hockey icitte, pas ailleurs.",
    city: "Montréal",
  },
  {
    id: "qc-street-26",
    file: "qc-26",
    caption: "Pêche blanche. Un trou, un café, le silence du lac.",
    city: "Lanaudière",
  },
  {
    id: "qc-street-27",
    file: "qc-27",
    caption: "Canal Lachine en été. Vélo, picnic, les briques encore chaudes.",
    city: "Montréal",
  },
  {
    id: "qc-street-28",
    file: "qc-28",
    caption: "L'Oratoire au crépuscule. Les marches, le dôme, la ville en bas.",
    city: "Montréal",
  },
  {
    id: "qc-street-29",
    file: "qc-29",
    caption: "Les Îles. Falaises rouges, eau turquoise, le vent décide.",
    city: "Îles-de-la-Madeleine",
  },
  {
    id: "qc-street-30",
    file: "qc-30",
    caption: "Tourtière qui sort du four. L'hiver sent ça, icitte.",
    city: "Québec",
  },
  {
    id: "qc-street-31",
    file: "qc-31",
    caption: "Bleuets du Saguenay. Le seau se remplit plus vite que les mains.",
    city: "Saguenay",
  },
  {
    id: "qc-street-32",
    file: "qc-32",
    caption: "Première neige sur le Plateau. Les escaliers jaunes, déjà glissants.",
    city: "Montréal",
  },
  {
    id: "qc-street-33",
    file: "qc-33",
    caption: "Tadoussac. La queue sort de l'eau. On oublie de respirer.",
    city: "Tadoussac",
  },
  {
    id: "qc-street-34",
    file: "qc-34",
    caption: "Montmorency gelée. La chute devient un mur.",
    city: "Québec",
  },
  {
    id: "qc-street-35",
    file: "qc-35",
    caption: "Canot à glace. On tire, on glisse, on gèle. Le fleuve décide.",
    city: "Québec",
  },
  {
    id: "qc-street-36",
    file: "qc-36",
    caption: "Charlevoix en automne. Les collines, les granges, le rouge partout.",
    city: "Charlevoix",
  },
  {
    id: "qc-street-37",
    file: "qc-37",
    caption: "Village de ski le soir. Les lumières, la neige, on rentre tard.",
    city: "Laurentides",
  },
  {
    id: "qc-street-38",
    file: "qc-38",
    caption: "Vieux-Port la nuit. La tour, le fleuve, Montréal se mire.",
    city: "Montréal",
  },
  {
    id: "qc-street-39",
    file: "qc-39",
    caption: "Les déneigeuses. Orange, bruit, la ville se dégage.",
    city: "Montréal",
  },
  {
    id: "qc-street-40",
    file: "qc-40",
    caption: "Pommes de l'Île d'Orléans. L'échelle, le fleuve, on croque icitte.",
    city: "Île d'Orléans",
  },
  {
    id: "qc-street-41",
    file: "qc-41",
    caption: "Pâté chinois du four. Bœuf, maïs, patates. Souper de semaine.",
    city: "Québec",
  },
  {
    id: "qc-street-42",
    file: "qc-42",
    caption: "Place Jacques-Cartier. Les terrasses, les artistes, les pavés.",
    city: "Montréal",
  },
  {
    id: "qc-street-43",
    file: "qc-43",
    caption: "Raquette dans le bois. Juste les pas et la neige qui tombe.",
    city: "Laurentides",
  },
  {
    id: "qc-street-44",
    file: "qc-44",
    caption: "Rimouski au coucher. Le quai, les bateaux, le Bas-du-Fleuve.",
    city: "Rimouski",
  },
];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getQcStreetPosts(sessionId = "zyeute"): Post[] {
  const copy = [...CLIPS];
  let seed = hashSeed(sessionId);
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  const now = Date.now();
  return copy.map((c, i) => {
    const created = new Date(now - i * 60_000).toISOString();
    return {
      id: c.id,
      user_id: HOUSE.id,
      userId: HOUSE.id,
      hive_id: "quebec",
      type: "video" as const,
      media_url: `/clips/${c.file}.mp4`,
      mediaUrl: `/clips/${c.file}.mp4`,
      thumbnail_url: `/clips/${c.file}.jpg`,
      thumbnailUrl: `/clips/${c.file}.jpg`,
      caption: c.caption,
      city: c.city,
      region: "QC",
      fire_count: 0,
      fireCount: 0,
      comment_count: 0,
      commentCount: 0,
      gift_count: 0,
      created_at: created,
      createdAt: created,
      processing_status: "completed" as const,
      processingStatus: "completed" as const,
      is_moderated: true,
      moderation_approved: true,
      is_hidden: false,
      is_ephemeral: false,
      view_count: 0,
      max_views: 1,
      user: HOUSE,
    } as Post;
  });
}
