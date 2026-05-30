/**
 * ⚜️ Quebec Specialist Bees
 * Specialized bees for Quebec-specific content and information
 * Hockey, Weather, News, Culture, Food recommendations
 */

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// 🏒 HOCKEY BEE - Canadiens de Montréal Expert
// ═══════════════════════════════════════════════════════════════

const NHL_API_BASE = "https://api-web.nhle.com/v1";

export class HockeyBee {
  /**
   * Get Canadiens current standings
   */
  async getStandings(): Promise<{
    success: boolean;
    standings?: any;
    response: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${NHL_API_BASE}/standings/now`);
      if (!response.ok) throw new Error("NHL API error");

      const data = await response.json();
      const habs = data.standings?.find(
        (team: any) => team.teamAbbrev?.default === "MTL",
      );

      if (!habs) {
        return {
          success: true,
          response:
            "J'ai pas trouvé les stats des Habs là! L'API de la NHL doit être down. 🏒",
        };
      }

      return {
        success: true,
        standings: habs,
        response:
          `🏒 **Canadiens de Montréal**\n` +
          `Position: ${habs.conferenceSequence}e dans l'Est\n` +
          `Fiche: ${habs.wins}V - ${habs.losses}D - ${habs.otLosses}OT\n` +
          `Points: ${habs.points}\n` +
          `Derniers 10: ${habs.l10Wins}V - ${habs.l10Losses}D\n\n` +
          `Go Habs Go! ⚜️🔵⚪🔴`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        response: "Oups, j'ai pas pu checker les stats des Habs! 🏒",
      };
    }
  }

  /**
   * Get next Canadiens game
   */
  async getNextGame(): Promise<{
    success: boolean;
    game?: any;
    response: string;
  }> {
    try {
      const response = await fetch(
        `${NHL_API_BASE}/club-schedule/MTL/week/now`,
      );
      if (!response.ok) throw new Error("NHL API error");

      const data = await response.json();
      const nextGame = data.games?.[0];

      if (!nextGame) {
        return {
          success: true,
          response:
            "Y'a pas de match prévu pour les Habs cette semaine! Ils doivent être en vacances. 🏒",
        };
      }

      const isHome = nextGame.homeTeam.abbrev === "MTL";
      const opponent = isHome ? nextGame.awayTeam : nextGame.homeTeam;
      const gameDate = new Date(nextGame.gameDate);

      return {
        success: true,
        game: nextGame,
        response:
          `🏒 **Prochain match des Habs**\n` +
          `${isHome ? "vs" : "@"} ${opponent.placeName?.default || opponent.abbrev}\n` +
          `📅 ${gameDate.toLocaleDateString("fr-CA", { weekday: "long", month: "long", day: "numeric" })}\n` +
          `⏰ ${gameDate.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}\n` +
          `📍 ${isHome ? "Centre Bell" : "À l'extérieur"}\n\n` +
          `Go Habs Go! 🔵⚪🔴`,
      };
    } catch (error) {
      return {
        success: false,
        response: "J'ai pas pu trouver le prochain match! 🏒",
      };
    }
  }

  /**
   * Get fun Habs facts
   */
  getHabsFacts(): string[] {
    return [
      "Les Canadiens ont gagné 24 Coupes Stanley, le plus de l'histoire de la NHL! 🏆",
      "Le premier match des Habs était le 19 janvier 1910 contre Cobalt. Ils ont gagné 7-6! ⚜️",
      "Maurice 'Rocket' Richard a été le premier à scorer 50 buts en 50 matchs! 🚀",
      "Le Centre Bell peut accueillir 21,302 fans - toujours sold out! 🏟️",
      "Jean Béliveau a joué 20 saisons avec les Habs et gagné 10 Coupes Stanley! 🎖️",
      "Patrick Roy a remporté 3 trophées Conn Smythe avec Montréal! 🥅",
      "Les Habs ont le record de la plus longue séquence sans défaite: 28 matchs en 1977-78! 🔥",
      "Guy Lafleur a été 3 fois champion compteur de la NHL! ⭐",
    ];
  }
}

// ═══════════════════════════════════════════════════════════════
// 🌤️ WEATHER BEE - Météo Québec
// ═══════════════════════════════════════════════════════════════

export class WeatherBee {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || "";
  }

  /**
   * Get weather for a Quebec city
   */
  async getWeather(city: string = "Montreal"): Promise<{
    success: boolean;
    weather?: any;
    response: string;
  }> {
    // Map Quebec cities to coordinates
    const quebecCities: Record<
      string,
      { lat: number; lon: number; name: string }
    > = {
      montreal: { lat: 45.5017, lon: -73.5673, name: "Montréal" },
      quebec: { lat: 46.8139, lon: -71.208, name: "Québec" },
      laval: { lat: 45.6066, lon: -73.7124, name: "Laval" },
      gatineau: { lat: 45.4765, lon: -75.7013, name: "Gatineau" },
      sherbrooke: { lat: 45.4042, lon: -71.8929, name: "Sherbrooke" },
      "trois-rivieres": { lat: 46.3432, lon: -72.5477, name: "Trois-Rivières" },
      saguenay: { lat: 48.428, lon: -71.0686, name: "Saguenay" },
    };

    const cityKey = city.toLowerCase().replace(/[- ]/g, "");
    const cityData = quebecCities[cityKey] || quebecCities.montreal;

    try {
      // If no API key, return mock data with Quebec humor
      if (!this.apiKey) {
        return this.getMockWeather(cityData.name);
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${cityData.lat}&lon=${cityData.lon}&appid=${this.apiKey}&units=metric&lang=fr`,
      );

      if (!response.ok) throw new Error("Weather API error");

      const data = await response.json();

      return {
        success: true,
        weather: data,
        response: this.formatWeatherResponse(cityData.name, data),
      };
    } catch (error) {
      return this.getMockWeather(cityData.name);
    }
  }

  private formatWeatherResponse(city: string, data: any): string {
    const temp = Math.round(data.main.temp);
    const feels = Math.round(data.main.feels_like);
    const desc = data.weather[0]?.description || "nuageux";
    const humidity = data.main.humidity;

    let comment = "";
    if (temp < -20) comment = "Tabarnak, reste en dedans! 🥶";
    else if (temp < -10) comment = "Habille-toi en pelure d'oignon! 🧥";
    else if (temp < 0) comment = "C'est frette mais c'est normal! ❄️";
    else if (temp < 10) comment = "Mets une p'tite laine! 🧣";
    else if (temp < 20) comment = "Belle température! 🌤️";
    else if (temp < 25) comment = "Parfait pour une terrasse! ☀️";
    else comment = "Ça va être chaud! Hydrate-toi! 🌡️";

    return (
      `🌤️ **Météo à ${city}**\n\n` +
      `🌡️ Température: ${temp}°C (ressenti ${feels}°C)\n` +
      `☁️ Conditions: ${desc}\n` +
      `💧 Humidité: ${humidity}%\n\n` +
      `${comment}`
    );
  }

  private getMockWeather(city: string): { success: boolean; response: string } {
    const month = new Date().getMonth();
    let temp, desc;

    // Seasonal mock data
    if (month >= 11 || month <= 2) {
      temp = Math.floor(Math.random() * 15) - 20; // -20 to -5
      desc = "neigeux";
    } else if (month >= 3 && month <= 5) {
      temp = Math.floor(Math.random() * 15) + 5; // 5 to 20
      desc = "variable";
    } else if (month >= 6 && month <= 8) {
      temp = Math.floor(Math.random() * 15) + 20; // 20 to 35
      desc = "ensoleillé";
    } else {
      temp = Math.floor(Math.random() * 15) + 5; // 5 to 20
      desc = "nuageux";
    }

    return {
      success: true,
      response:
        `🌤️ **Météo à ${city}** (estimation)\n\n` +
        `🌡️ Environ ${temp}°C\n` +
        `☁️ Probablement ${desc}\n\n` +
        `(J'ai pas accès à l'API météo, mais c'est à peu près ça au Québec! 🦫)`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 🍴 FOOD BEE - Quebec Food & Restaurant Expert
// ═══════════════════════════════════════════════════════════════

export class FoodBee {
  /**
   * Get poutine recommendations
   */
  getPoutineSpots(): {
    name: string;
    location: string;
    specialty: string;
    rating: string;
  }[] {
    return [
      {
        name: "La Banquise",
        location: "Plateau",
        specialty: "30+ variétés de poutine",
        rating: "⭐⭐⭐⭐⭐",
      },
      {
        name: "Chez Claudette",
        location: "Plateau",
        specialty: "Poutine classique depuis 1983",
        rating: "⭐⭐⭐⭐",
      },
      {
        name: "Patati Patata",
        location: "Plateau",
        specialty: "Poutine végétarienne",
        rating: "⭐⭐⭐⭐",
      },
      {
        name: "Ma Poule Mouillée",
        location: "Plateau",
        specialty: "Poutine portugaise",
        rating: "⭐⭐⭐⭐⭐",
      },
      {
        name: "Poutineville",
        location: "Multiple",
        specialty: "Poutine personnalisée",
        rating: "⭐⭐⭐⭐",
      },
      {
        name: "Paulo & Suzanne",
        location: "Verdun",
        specialty: "Poutine italienne",
        rating: "⭐⭐⭐⭐",
      },
      {
        name: "Dirty Dogs",
        location: "Mile End",
        specialty: "Poutine hot-dog",
        rating: "⭐⭐⭐⭐",
      },
      {
        name: "Le Roy Jucep",
        location: "Drummondville",
        specialty: "L'ORIGINALE depuis 1958",
        rating: "⭐⭐⭐⭐⭐",
      },
    ];
  }

  /**
   * Get smoked meat recommendations
   */
  getSmokedMeatSpots(): {
    name: string;
    location: string;
    specialty: string;
  }[] {
    return [
      {
        name: "Schwartz's",
        location: "Plateau (St-Laurent)",
        specialty: "Le classique depuis 1928",
      },
      {
        name: "Main Deli",
        location: "Plateau (St-Laurent)",
        specialty: "Rival de Schwartz's",
      },
      {
        name: "Lester's",
        location: "Outremont",
        specialty: "Plus tranquille, tout aussi bon",
      },
      {
        name: "Snowdon Deli",
        location: "Côte-des-Neiges",
        specialty: "Ambiance old-school",
      },
      { name: "Dunn's", location: "Centre-ville", specialty: "Open 24h" },
    ];
  }

  /**
   * Get bagel recommendations
   */
  getBagelSpots(): { name: string; location: string; specialty: string }[] {
    return [
      {
        name: "St-Viateur Bagel",
        location: "Mile End",
        specialty: "Four à bois 24/7",
      },
      {
        name: "Fairmount Bagel",
        location: "Mile End",
        specialty: "Le plus vieux (1919)",
      },
      { name: "Beauty's", location: "Plateau", specialty: "Brunch légendaire" },
      {
        name: "Kettleman's",
        location: "Côte-des-Neiges",
        specialty: "Style Ottawa",
      },
    ];
  }

  /**
   * Get Quebec food recommendations based on mood/craving
   */
  getRecommendation(craving: string): string {
    const cravingLower = craving.toLowerCase();

    if (cravingLower.includes("poutine")) {
      const spots = this.getPoutineSpots();
      const random = spots[Math.floor(Math.random() * 3)];
      return (
        `🍟 Pour une bonne poutine, j'te recommande **${random.name}** dans le ${random.location}!\n` +
        `Leur spécialité: ${random.specialty}\n` +
        `Rating: ${random.rating}\n\n` +
        `Autres options: La Banquise, Chez Claudette, Ma Poule Mouillée! 🦫`
      );
    }

    if (
      cravingLower.includes("smoked meat") ||
      cravingLower.includes("viande fumée")
    ) {
      return (
        `🥩 Pour du smoked meat, tu DOIS aller chez **Schwartz's** sur St-Laurent!\n` +
        `Commande: Medium-fat sur pain de seigle avec pickle et coleslaw.\n` +
        `Attends-toi à faire la file, mais ça vaut TELLEMENT la peine! 🤤`
      );
    }

    if (cravingLower.includes("bagel")) {
      return (
        `🥯 Pour les meilleurs bagels de la planète:\n` +
        `- **St-Viateur Bagel** - Four à bois 24/7\n` +
        `- **Fairmount Bagel** - Le plus vieux (1919)\n\n` +
        `Prends-les chauds avec du fromage à la crème! 😋`
      );
    }

    if (cravingLower.includes("brunch") || cravingLower.includes("déjeuner")) {
      return (
        `🍳 Pour un bon brunch montréalais:\n` +
        `- **Beauty's** - Le classique du Plateau\n` +
        `- **L'Avenue** - Portions généreuses\n` +
        `- **Régine Café** - Hipster mais bon\n` +
        `- **Chez Cora** - Si t'aimes les fruits\n\n` +
        `Arrive tôt le weekend, ça fill vite! ☕`
      );
    }

    return (
      `🍴 Qu'est-ce qui te tente?\n` +
      `- Poutine 🍟\n` +
      `- Smoked meat 🥩\n` +
      `- Bagels 🥯\n` +
      `- Brunch 🍳\n\n` +
      `Dis-moi pis j'te trouve le meilleur spot! 🦫`
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// 🗞️ CULTURE BEE - Quebec Events & Culture
// ═══════════════════════════════════════════════════════════════

export class CultureBee {
  /**
   * Get upcoming Quebec festivals
   */
  getFestivals(): {
    name: string;
    when: string;
    where: string;
    description: string;
  }[] {
    return [
      {
        name: "Festival de Jazz de Montréal",
        when: "Fin juin - début juillet",
        where: "Centre-ville",
        description: "Plus grand festival de jazz au monde!",
      },
      {
        name: "Osheaga",
        when: "Premier weekend d'août",
        where: "Parc Jean-Drapeau",
        description: "Musique indie et alternative",
      },
      {
        name: "Just For Laughs / Juste pour rire",
        when: "Juillet",
        where: "Quartier des spectacles",
        description: "Festival d'humour international",
      },
      {
        name: "Festival d'été de Québec",
        when: "Juillet",
        where: "Plaines d'Abraham",
        description: "11 jours de musique!",
      },
      {
        name: "Carnaval de Québec",
        when: "Février",
        where: "Québec City",
        description: "Le plus grand carnaval d'hiver au monde",
      },
      {
        name: "Francos de Montréal",
        when: "Juin",
        where: "Quartier des spectacles",
        description: "Musique francophone",
      },
      {
        name: "Nuits d'Afrique",
        when: "Juillet",
        where: "Centre-ville",
        description: "Musiques du monde",
      },
      {
        name: "POP Montréal",
        when: "Septembre",
        where: "Mile End",
        description: "Musique indépendante",
      },
      {
        name: "MURAL Festival",
        when: "Juin",
        where: "Boulevard Saint-Laurent",
        description: "Art urbain et murales",
      },
      {
        name: "Igloofest",
        when: "Janvier-février",
        where: "Vieux-Port",
        description: "Festival électro en plein hiver! 🥶",
      },
    ];
  }

  /**
   * Get Quebec music recommendations
   */
  getQuebecMusic(): { artist: string; genre: string; topSong: string }[] {
    return [
      {
        artist: "Les Cowboys Fringants",
        genre: "Folk/Rock",
        topSong: "Plus rien",
      },
      {
        artist: "Loud",
        genre: "Rap",
        topSong: "Toutes les femmes savent danser",
      },
      { artist: "Koriass", genre: "Rap", topSong: "Rue des Saules" },
      { artist: "2Frères", genre: "Pop/Folk", topSong: "La route" },
      { artist: "Marie-Mai", genre: "Pop/Rock", topSong: "Différents" },
      { artist: "Coeur de Pirate", genre: "Pop", topSong: "Comme des enfants" },
      { artist: "Dead Obies", genre: "Hip-Hop", topSong: "Montréal $ud" },
      {
        artist: "Hubert Lenoir",
        genre: "Indie",
        topSong: "Fille de personne II",
      },
      { artist: "Les Trois Accords", genre: "Rock", topSong: "Hawaienne" },
      { artist: "Jean Leloup", genre: "Rock/Folk", topSong: "1990" },
    ];
  }

  /**
   * Get Quebec expressions dictionary
   */
  getExpressions(): { expression: string; meaning: string; example: string }[] {
    return [
      {
        expression: "Tiguidou!",
        meaning: "Parfait, excellent",
        example: "T'as fini? Tiguidou!",
      },
      {
        expression: "Pantoute",
        meaning: "Pas du tout",
        example: "J'ai pas faim pantoute",
      },
      {
        expression: "Être dans les patates",
        meaning: "Se tromper",
        example: "T'es dans les patates, c'est pas ça",
      },
      {
        expression: "Avoir la langue à terre",
        meaning: "Être épuisé",
        example: "Après le déménagement, j'avais la langue à terre",
      },
      {
        expression: "Checker",
        meaning: "Regarder, vérifier",
        example: "Checke ça!",
      },
      {
        expression: "Gosser",
        meaning: "Agacer, embêter",
        example: "Arrête de me gosser!",
      },
      {
        expression: "Être sur la coche",
        meaning: "Être excellent",
        example: "Ce resto est sur la coche!",
      },
      {
        expression: "Virer sur le top",
        meaning: "Devenir fou",
        example: "J'ai viré sur le top quand j'ai vu le prix",
      },
      {
        expression: "Faire du pouce",
        meaning: "Faire de l'auto-stop",
        example: "On a fait du pouce jusqu'à Québec",
      },
      {
        expression: "Niaiser",
        meaning: "Plaisanter, perdre son temps",
        example: "Arrête de niaiser pis travaille!",
      },
    ];
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS & BEE RUNNERS
// ═══════════════════════════════════════════════════════════════

export const hockeyBee = new HockeyBee();
export const weatherBee = new WeatherBee();
export const foodBee = new FoodBee();
export const cultureBee = new CultureBee();

/**
 * Hockey bee runner
 */
export async function runHockey(task: any) {
  const payload = task.payload || {};
  const action = payload.action || "standings";

  const bee = new HockeyBee();

  switch (action) {
    case "next-game":
      return await bee.getNextGame();
    case "facts": {
      const facts = bee.getHabsFacts();
      const randomFact = facts[Math.floor(Math.random() * facts.length)];
      return {
        success: true,
        response: `🏒 Fun fact des Habs:\n\n${randomFact}`,
      };
    }
    case "standings":
    default:
      return await bee.getStandings();
  }
}

/**
 * Weather bee runner
 */
export async function runWeather(task: any) {
  const payload = task.payload || {};
  const city = payload.city || "Montreal";

  const bee = new WeatherBee();
  return await bee.getWeather(city);
}

/**
 * Food bee runner
 */
export async function runFood(task: any) {
  const payload = task.payload || {};
  const craving = payload.craving || payload.message || "";

  const bee = new FoodBee();
  return { success: true, response: bee.getRecommendation(craving) };
}

/**
 * Culture bee runner
 */
export async function runCulture(task: any) {
  const payload = task.payload || {};
  const action = payload.action || "festivals";

  const bee = new CultureBee();

  switch (action) {
    case "music": {
      const music = bee.getQuebecMusic();
      const randomArtists = music.sort(() => 0.5 - Math.random()).slice(0, 5);
      return {
        success: true,
        response:
          `🎵 **Artistes québécois à écouter:**\n\n` +
          randomArtists
            .map((a) => `- **${a.artist}** (${a.genre}) - "${a.topSong}"`)
            .join("\n") +
          `\n\nÉcoute ça pis tu vas voir c'est bon! 🦫`,
      };
    }
    case "expressions": {
      const expressions = bee.getExpressions();
      const randomExpr = expressions
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      return {
        success: true,
        response:
          `📚 **Expressions québécoises:**\n\n` +
          randomExpr
            .map(
              (e) =>
                `**${e.expression}**\n→ ${e.meaning}\n→ Ex: "${e.example}"`,
            )
            .join("\n\n") +
          `\n\nAstheure tu parles québécois! ⚜️`,
      };
    }
    case "festivals":
    default: {
      const festivals = bee.getFestivals();
      const randomFests = festivals.sort(() => 0.5 - Math.random()).slice(0, 4);
      return {
        success: true,
        response:
          `🎉 **Festivals québécois:**\n\n` +
          randomFests
            .map(
              (f) =>
                `**${f.name}**\n📅 ${f.when}\n📍 ${f.where}\n→ ${f.description}`,
            )
            .join("\n\n") +
          `\n\nY'a toujours de quoi à faire au Québec! 🦫`,
      };
    }
  }
}
