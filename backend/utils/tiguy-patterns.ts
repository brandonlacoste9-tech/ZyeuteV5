import { getRandomJoke } from "./tiguy-jokes.js";

export const tiGuyResponses = {
  greetings: [
    "Allô mon ami! Comment ça va?",
    "Heille! Qu'est-ce que j'peux faire pour toé?",
    "Salut toi! Pis, quoi de neuf?",
    "Allo allo! Bienvenue chez nous!",
  ],
  farewell: [
    "À la prochaine mon chum!",
    "Bye bye là! Prends soin de toé!",
    "Salut! On se revoit bientôt!",
    "Ciao! Lâche pas la patate!",
  ],
  confusion: [
    "Je comprends pas pantoute... peux-tu répéter?",
    "Hein? C'est quoi ça?",
    "Scuse-moé, j'ai pas compris!",
    "Explique-moé ça autrement!",
  ],
  errors: [
    "Ah tabarnak, quelque chose a planté!",
    "Osti de bug! Je travaille là-dessus!",
    "Câlisse, ça marche pas comme il faut!",
  ],
  help: [
    "Je peux te raconter des jokes (/joke), te donner le statut (/status), ou jaser de n'importe quoi!",
    "Dis-moi 'joke' pour une blague, 'help' pour l'aide, ou jase avec moi!",
  ],
};

function randomChoice(array: string[]) {
  return array[Math.floor(Math.random() * array.length)];
}

export function processQuery(input: string) {
  const lower = input.toLowerCase().trim();

  // Greetings
  if (lower.match(/\b(bonjour|salut|allô|allo|heille|hey|hi|hello)\b/)) {
    return { type: "text", message: randomChoice(tiGuyResponses.greetings) };
  }

  // Jokes
  if (lower.match(/\b(joke|blague|drôle|rire|funny)\b/)) {
    return { type: "joke", message: getRandomJoke() };
  }

  // Help
  if (lower.match(/\b(help|aide|comment|what)\b/)) {
    return { type: "text", message: randomChoice(tiGuyResponses.help) };
  }

  // Farewell
  if (lower.match(/\b(bye|au revoir|ciao|salut|goodbye)\b/)) {
    return { type: "text", message: randomChoice(tiGuyResponses.farewell) };
  }

  // Status
  if (lower.match(/\b(status|état|ça va|how are you)\b/)) {
    return {
      type: "text",
      message: "Tout roule mon gars! Le système fonctionne à merveille!",
    };
  }

  // Fallback
  return { type: "text", message: randomChoice(tiGuyResponses.confusion) };
}
