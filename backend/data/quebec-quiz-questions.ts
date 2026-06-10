export interface QuebecQuizQuestion {
  id: string;
  prompt: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

export const QUEBEC_QUIZ_QUESTIONS: QuebecQuizQuestion[] = [
  {
    id: "q1",
    prompt: "Quelle est la capitale du Québec?",
    choices: ["Montréal", "Québec", "Gatineau", "Sherbrooke"],
    correctIndex: 1,
  },
  {
    id: "q2",
    prompt: "En quelle année le Québec a-t-il organisé les Olympiques d'hiver?",
    choices: ["1968", "1976", "1980", "1988"],
    correctIndex: 1,
  },
  {
    id: "q3",
    prompt: "Quel plat est devenu emblématique du Québec?",
    choices: ["Tacos", "Poutine", "Sushi", "Pad thaï"],
    correctIndex: 1,
  },
  {
    id: "q4",
    prompt: "Quelle équipe de hockey joue au Centre Bell?",
    choices: [
      "Les Nordiques",
      "Le Canadien de Montréal",
      "Les Sénateurs",
      "Les Maple Leafs",
    ],
    correctIndex: 1,
  },
  {
    id: "q5",
    prompt: "Le fleuve Saint-Laurent se jette dans quel golfe?",
    choices: [
      "Golfe du Mexique",
      "Golfe du Saint-Laurent",
      "Baie d'Hudson",
      "Baie de Fundy",
    ],
    correctIndex: 1,
  },
  {
    id: "q6",
    prompt: "Quel festival de musique est célèbre à Montréal en été?",
    choices: ["Coachella", "Osheaga", "Glastonbury", "Burning Man"],
    correctIndex: 1,
  },
  {
    id: "q7",
    prompt: "Quelle langue est la langue officielle du Québec?",
    choices: ["Anglais", "Français", "Espagnol", "Créole"],
    correctIndex: 1,
  },
  {
    id: "q8",
    prompt: "La cabane à sucre sert surtout quel produit?",
    choices: ["Miel", "Sirop d'érable", "Confiture", "Sirop de maïs"],
    correctIndex: 1,
  },
  {
    id: "q9",
    prompt: "Quel pont relie Québec et Lévis?",
    choices: [
      "Pont Jacques-Cartier",
      "Pont de Québec",
      "Pont Champlain",
      "Pont Victoria",
    ],
    correctIndex: 1,
  },
  {
    id: "q10",
    prompt: "Quelle région est connue pour le Mont-Tremblant?",
    choices: ["Gaspésie", "Laurentides", "Outaouais", "Bas-Saint-Laurent"],
    correctIndex: 1,
  },
  {
    id: "q11",
    prompt: "Quel animal figure sur le drapeau du Québec?",
    choices: ["Orignal", "Castor", "Ours", "Loup"],
    correctIndex: 0,
  },
  {
    id: "q12",
    prompt: "La Fête nationale du Québec est le 24 de quel mois?",
    choices: ["Mai", "Juin", "Juillet", "Août"],
    correctIndex: 1,
  },
  {
    id: "q13",
    prompt: "Quelle ville est surnommée la Vieille Capitale?",
    choices: ["Montréal", "Québec", "Trois-Rivières", "Laval"],
    correctIndex: 1,
  },
  {
    id: "q14",
    prompt: "Quel fromage est typique dans une poutine classique?",
    choices: ["Mozzarella", "Cheddar", "Fromage en grains", "Brie"],
    correctIndex: 2,
  },
  {
    id: "q15",
    prompt: "Quel océan borde le Québec par le nord?",
    choices: ["Pacifique", "Atlantique", "Arctique", "Indien"],
    correctIndex: 2,
  },
  {
    id: "q16",
    prompt: "Quel groupe québécois a chanté « Comme un million de gens »?",
    choices: ["Les Colocs", "2Frères", "Corridor", "Harmonium"],
    correctIndex: 1,
  },
  {
    id: "q17",
    prompt: "Où se trouve le CHUM, un grand hôpital universitaire?",
    choices: ["Québec", "Montréal", "Saguenay", "Rimouski"],
    correctIndex: 1,
  },
  {
    id: "q18",
    prompt: "Quelle saison attire le plus de skieurs au Mont-Sainte-Anne?",
    choices: ["Printemps", "Été", "Automne", "Hiver"],
    correctIndex: 3,
  },
  {
    id: "q19",
    prompt: "Le smoked meat montréalais est surtout servi sur quel pain?",
    choices: ["Baguette", "Pain de seigle", "Pita", "Croissant"],
    correctIndex: 1,
  },
  {
    id: "q20",
    prompt: "Quelle île accueille le festival de jazz de Montréal?",
    choices: [
      "Île d'Orléans",
      "Île Sainte-Hélène",
      "Île d'Anticosti",
      "Île Perrot",
    ],
    correctIndex: 1,
  },
  {
    id: "q21",
    prompt: "Quel fleuve traverse Trois-Rivières?",
    choices: ["Ottawa", "Saint-Maurice", "Saguenay", "Richelieu"],
    correctIndex: 1,
  },
  {
    id: "q22",
    prompt: "Quelle couleur domine sur le drapeau du Québec?",
    choices: ["Rouge", "Bleu", "Vert", "Jaune"],
    correctIndex: 1,
  },
  {
    id: "q23",
    prompt: "Quel sport est roi dans les arénas du Québec en hiver?",
    choices: ["Soccer", "Hockey", "Basketball", "Football"],
    correctIndex: 1,
  },
  {
    id: "q24",
    prompt: "La Gaspésie est surtout connue pour quel paysage?",
    choices: ["Désert", "Falaises et mer", "Prairies", "Volcans"],
    correctIndex: 1,
  },
  {
    id: "q25",
    prompt: "Quel célèbre cirque est né à Québec?",
    choices: ["Ringling", "Cirque du Soleil", "Barnum", "Cirque Médrano"],
    correctIndex: 1,
  },
];
