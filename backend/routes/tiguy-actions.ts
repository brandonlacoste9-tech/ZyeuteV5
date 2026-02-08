/**
 * 🦫 Ti-Guy Actions API
 * Extended capabilities for Ti-Guy including browser control, image/video generation,
 * Quebec specialists (hockey, weather, food, culture), and voice features
 */

import express from "express";
import {
  browserControlBee,
  BrowserActionSchema,
} from "../ai/bees/browser-control.js";
import {
  imageGeneratorBee,
  ImageGenerationSchema,
} from "../ai/bees/image-generator.js";
import {
  videoGeneratorBee,
  VideoGenerationSchema,
} from "../ai/bees/video-generator.js";
import { voiceBee, VoiceGenerationSchema } from "../ai/bees/voice-bee.js";
import {
  hockeyBee,
  weatherBee,
  foodBee,
  cultureBee,
  runHockey,
  runWeather,
  runFood,
  runCulture,
} from "../ai/bees/quebec-specialists.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
// 🌐 BROWSER CONTROL ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/tiguy/browser/navigate
 * Navigate to a URL
 */
router.post("/browser/navigate", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: "URL required",
        response: "Heille, tu m'as pas donné d'adresse web! 🦫",
      });
    }

    await browserControlBee.startSession();
    const result = await browserControlBee.navigate(url);
    await browserControlBee.closeSession();

    res.json({
      success: result.success,
      response: result.success
        ? `J'suis rendu sur ${url}! Qu'est-ce tu veux que j'fasse? 🌐`
        : `Oups, j'ai pas pu aller là: ${result.error} 😅`,
      result,
    });
  } catch (error: any) {
    console.error("Browser navigate error:", error);
    res.status(500).json({
      error: error.message,
      response: "Osti, le browser a planté! Réessaie! 🦫",
    });
  }
});

/**
 * POST /api/tiguy/browser/search
 * Search on a platform
 */
router.post("/browser/search", async (req, res) => {
  try {
    const { platform = "google", query } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Query required",
        response: "Chercher quoi? Dis-moi ce que tu veux trouver! 🔍",
      });
    }

    await browserControlBee.startSession();
    const result = await browserControlBee.search(platform, query);
    await browserControlBee.closeSession();

    res.json({
      success: result.success,
      response: result.success
        ? `J'ai cherché "${query}" sur ${platform}! Voici c'que j'ai trouvé... 🔍`
        : `J'ai pas pu chercher ça: ${result.error} 😅`,
      platform,
      query,
      result,
    });
  } catch (error: any) {
    console.error("Browser search error:", error);
    res.status(500).json({
      error: error.message,
      response: "La recherche a pas marché, mon ami! 🦫",
    });
  }
});

/**
 * POST /api/tiguy/browser/screenshot
 * Take a screenshot of current page
 */
router.post("/browser/screenshot", async (req, res) => {
  try {
    const { url } = req.body;

    await browserControlBee.startSession();

    if (url) {
      await browserControlBee.navigate(url);
    }

    const result = await browserControlBee.screenshot();
    await browserControlBee.closeSession();

    res.json({
      success: result.success,
      response: result.success
        ? "Voilà ta capture d'écran! 📸"
        : `J'ai pas pu prendre la photo: ${result.error}`,
      image: result.image,
    });
  } catch (error: any) {
    console.error("Screenshot error:", error);
    res.status(500).json({
      error: error.message,
      response: "La capture d'écran a pas marché! 📸",
    });
  }
});

/**
 * POST /api/tiguy/browser/extract
 * Extract content from a page
 */
router.post("/browser/extract", async (req, res) => {
  try {
    const { url, selector } = req.body;

    if (!url) {
      return res.status(400).json({
        error: "URL required",
        response: "Donne-moi une URL à lire! 📖",
      });
    }

    await browserControlBee.startSession();
    await browserControlBee.navigate(url);
    const result = await browserControlBee.extractContent(selector);
    await browserControlBee.closeSession();

    res.json({
      success: result.success,
      response: result.success
        ? "J'ai lu la page pour toi! Voici c'que j'ai trouvé... 📖"
        : `J'ai pas pu lire la page: ${result.error}`,
      content: result.content,
    });
  } catch (error: any) {
    console.error("Extract error:", error);
    res.status(500).json({
      error: error.message,
      response: "J'ai pas pu extraire le contenu! 📖",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🎨 IMAGE GENERATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/tiguy/image/generate
 * Generate an image from prompt
 */
router.post("/image/generate", async (req, res) => {
  try {
    const validation = ImageGenerationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.issues || [],
        response:
          "Ta demande est pas claire! Dis-moi c'que tu veux comme image! 🎨",
      });
    }

    const result = await imageGeneratorBee.generate(validation.data);

    res.json({
      success: result.success,
      response: result.success
        ? "Tadam! 🎨 Voici ton image! J'espère que ça te plaît! 🦫✨"
        : `Ayoye! J'ai pas pu créer ton image: ${result.error}`,
      imageUrl: result.imageUrl,
      prompt: result.prompt,
      cost: result.cost,
    });
  } catch (error: any) {
    console.error("Image generation error:", error);
    res.status(500).json({
      error: error.message,
      response: "La génération d'image a planté! Réessaie! 🎨",
    });
  }
});

/**
 * POST /api/tiguy/image/avatar
 * Generate an avatar image
 */
router.post("/image/avatar", async (req, res) => {
  try {
    const { description, style = "cartoon" } = req.body;

    if (!description) {
      return res.status(400).json({
        error: "Description required",
        response:
          "Décris-moi ton avatar! Genre 'un castor cool avec des lunettes' 🦫",
      });
    }

    const result = await imageGeneratorBee.generateAvatar(description, style);

    res.json({
      success: result.success,
      response: result.success
        ? "Voici ton nouvel avatar! T'as ben du style! 😎🦫"
        : `J'ai pas pu créer ton avatar: ${result.error}`,
      imageUrl: result.imageUrl,
    });
  } catch (error: any) {
    console.error("Avatar generation error:", error);
    res.status(500).json({
      error: error.message,
      response: "L'avatar a pas marché! 😅",
    });
  }
});

/**
 * POST /api/tiguy/image/thumbnail
 * Generate a thumbnail for content
 */
router.post("/image/thumbnail", async (req, res) => {
  try {
    const { topic, mood = "exciting" } = req.body;

    if (!topic) {
      return res.status(400).json({
        error: "Topic required",
        response: "C'est quoi le sujet de ton thumbnail? 🖼️",
      });
    }

    const result = await imageGeneratorBee.generateThumbnail(topic, mood);

    res.json({
      success: result.success,
      response: result.success
        ? "Voici ton thumbnail! Ça va faire des clics certain! 🔥🖼️"
        : `J'ai pas pu créer le thumbnail: ${result.error}`,
      imageUrl: result.imageUrl,
    });
  } catch (error: any) {
    console.error("Thumbnail generation error:", error);
    res.status(500).json({
      error: error.message,
      response: "Le thumbnail a pas marché! 🖼️",
    });
  }
});

/**
 * GET /api/tiguy/image/ideas
 * Get Quebec-themed image ideas
 */
router.get("/image/ideas", (req, res) => {
  const ideas = imageGeneratorBee.getQuebecImageIdeas();
  const randomIdeas = ideas.sort(() => 0.5 - Math.random()).slice(0, 5);

  res.json({
    success: true,
    response: "Voici quelques idées d'images québécoises! 🎨🍁",
    ideas: randomIdeas,
  });
});

// ═══════════════════════════════════════════════════════════════
// 🧠 COMBINED ACTIONS (Ti-Guy decides what to do)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/tiguy/action
 * Smart action router - Ti-Guy analyzes request and picks the right tool
 */
router.post("/action", async (req, res) => {
  try {
    const { message, type } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message required",
        response: "Dis-moi c'que tu veux que j'fasse! 🦫",
      });
    }

    const lowerMessage = message.toLowerCase();

    // Determine action type based on message content
    let actionType = type;

    if (!actionType) {
      // Image generation
      if (
        lowerMessage.includes("image") ||
        lowerMessage.includes("génère") ||
        lowerMessage.includes("crée") ||
        lowerMessage.includes("dessine") ||
        lowerMessage.includes("picture") ||
        lowerMessage.includes("photo")
      ) {
        actionType = "image";
      }
      // Video generation
      else if (
        lowerMessage.includes("vidéo") ||
        lowerMessage.includes("video") ||
        lowerMessage.includes("anime") ||
        lowerMessage.includes("clip")
      ) {
        actionType = "video";
      }
      // Web search
      else if (
        lowerMessage.includes("cherche") ||
        lowerMessage.includes("search") ||
        lowerMessage.includes("trouve") ||
        lowerMessage.includes("google")
      ) {
        actionType = "search";
      }
      // Navigation
      else if (
        lowerMessage.includes("va sur") ||
        lowerMessage.includes("ouvre") ||
        lowerMessage.includes("navigate") ||
        lowerMessage.includes("website")
      ) {
        actionType = "navigate";
      }
      // Screenshot
      else if (
        lowerMessage.includes("screenshot") ||
        lowerMessage.includes("capture")
      ) {
        actionType = "screenshot";
      }
      // Avatar
      else if (lowerMessage.includes("avatar")) {
        actionType = "avatar";
      }
      // Thumbnail
      else if (
        lowerMessage.includes("thumbnail") ||
        lowerMessage.includes("vignette")
      ) {
        actionType = "thumbnail";
      }
      // Hockey / Habs
      else if (
        lowerMessage.includes("habs") ||
        lowerMessage.includes("canadiens") ||
        lowerMessage.includes("hockey") ||
        lowerMessage.includes("match")
      ) {
        actionType = "hockey";
      }
      // Weather
      else if (
        lowerMessage.includes("météo") ||
        lowerMessage.includes("weather") ||
        lowerMessage.includes("température") ||
        lowerMessage.includes("temps")
      ) {
        actionType = "weather";
      }
      // Food
      else if (
        lowerMessage.includes("poutine") ||
        lowerMessage.includes("manger") ||
        lowerMessage.includes("restaurant") ||
        lowerMessage.includes("faim") ||
        lowerMessage.includes("smoked meat") ||
        lowerMessage.includes("bagel")
      ) {
        actionType = "food";
      }
      // Music
      else if (
        lowerMessage.includes("musique") ||
        lowerMessage.includes("artiste") ||
        lowerMessage.includes("chanson") ||
        lowerMessage.includes("écouter")
      ) {
        actionType = "music";
      }
      // Culture / Festivals
      else if (
        lowerMessage.includes("festival") ||
        lowerMessage.includes("culture") ||
        lowerMessage.includes("expression") ||
        lowerMessage.includes("événement")
      ) {
        actionType = "culture";
      }
    }

    // Route to appropriate handler
    switch (actionType) {
      case "image": {
        const imageResult = await imageGeneratorBee.generate({
          prompt: message,
          enhancePrompt: true,
          size: "square",
        });
        return res.json({
          action: "image",
          ...imageResult,
          response: imageResult.success
            ? "Voilà ton image! 🎨🦫"
            : `Oups: ${imageResult.error}`,
        });
      }

      case "avatar": {
        const avatarResult = await imageGeneratorBee.generateAvatar(message);
        return res.json({
          action: "avatar",
          ...avatarResult,
          response: avatarResult.success
            ? "Voici ton avatar! 😎"
            : `Oups: ${avatarResult.error}`,
        });
      }

      case "thumbnail": {
        const thumbResult = await imageGeneratorBee.generateThumbnail(message);
        return res.json({
          action: "thumbnail",
          ...thumbResult,
          response: thumbResult.success
            ? "Voici ton thumbnail! 🖼️"
            : `Oups: ${thumbResult.error}`,
        });
      }

      case "search": {
        await browserControlBee.startSession();
        const searchResult = await browserControlBee.search("google", message);
        await browserControlBee.closeSession();
        return res.json({
          action: "search",
          ...searchResult,
          response: searchResult.success
            ? "J'ai trouvé ça! 🔍"
            : `Oups: ${searchResult.error}`,
        });
      }

      case "navigate": {
        // Extract URL from message
        const urlMatch = message.match(/https?:\/\/[^\s]+/);
        if (!urlMatch) {
          return res.json({
            action: "navigate",
            success: false,
            response:
              "J'ai pas trouvé d'URL dans ton message! Donne-moi le lien! 🔗",
          });
        }
        await browserControlBee.startSession();
        const navResult = await browserControlBee.navigate(urlMatch[0]);
        await browserControlBee.closeSession();
        return res.json({
          action: "navigate",
          ...navResult,
          response: navResult.success
            ? `J'suis rendu sur ${urlMatch[0]}! 🌐`
            : `Oups: ${navResult.error}`,
        });
      }

      case "video": {
        const videoResult = await videoGeneratorBee.generate({
          prompt: message,
          duration: "5",
          aspectRatio: "9:16",
        });
        return res.json({
          action: "video",
          ...videoResult,
          response: videoResult.success
            ? "Voilà ton vidéo! 🎬🦫"
            : `Oups: ${videoResult.error}`,
        });
      }

      case "hockey": {
        const hockeyResult = await runHockey({
          payload: { action: "standings" },
        });
        return res.json({
          action: "hockey",
          ...hockeyResult,
        });
      }

      case "weather": {
        const weatherResult = await runWeather({
          payload: { city: "Montreal" },
        });
        return res.json({
          action: "weather",
          ...weatherResult,
        });
      }

      case "food": {
        const foodResult = await runFood({ payload: { craving: message } });
        return res.json({
          action: "food",
          ...foodResult,
        });
      }

      case "culture": {
        const cultureResult = await runCulture({
          payload: { action: "festivals" },
        });
        return res.json({
          action: "culture",
          ...cultureResult,
        });
      }

      case "music": {
        const musicResult = await runCulture({ payload: { action: "music" } });
        return res.json({
          action: "music",
          ...musicResult,
        });
      }

      default:
        return res.json({
          action: "unknown",
          success: false,
          response:
            "J'suis pas sûr de c'que tu veux! Tu peux me demander de:\n" +
            "- Générer une image 🎨\n" +
            "- Créer un vidéo 🎬\n" +
            "- Chercher sur le web 🔍\n" +
            "- Stats des Habs 🏒\n" +
            "- Météo au Québec 🌤️\n" +
            "- Recommandations bouffe 🍟\n" +
            "- Musique québécoise 🎵\n" +
            "- Festivals & culture ⚜️",
        });
    }
  } catch (error: any) {
    console.error("Ti-Guy action error:", error);
    res.status(500).json({
      error: error.message,
      response: "Oups, y'a eu un problème! Réessaie! 🦫",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🎬 VIDEO GENERATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/tiguy/video/generate
 * Generate a video from text
 */
router.post("/video/generate", async (req, res) => {
  try {
    const { prompt, duration = "5", aspectRatio = "9:16", style } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt required",
        response: "Décris-moi le vidéo que tu veux! 🎬",
      });
    }

    const result = await videoGeneratorBee.generate({
      prompt,
      duration,
      aspectRatio,
      style,
    });

    res.json({
      success: result.success,
      response: result.success
        ? "Tadam! 🎬 Voici ton vidéo! Ça a pris du temps mais ça valait la peine! 🦫✨"
        : `Ayoye! J'ai pas pu créer ton vidéo: ${result.error}`,
      videoUrl: result.videoUrl,
      prompt: result.prompt,
      duration: result.duration,
      cost: result.cost,
    });
  } catch (error: any) {
    console.error("Video generation error:", error);
    res.status(500).json({
      error: error.message,
      response: "La génération vidéo a planté! 🎬",
    });
  }
});

/**
 * GET /api/tiguy/video/ideas
 * Get Quebec-themed video ideas
 */
router.get("/video/ideas", (req, res) => {
  const ideas = videoGeneratorBee.getQuebecVideoIdeas();
  const randomIdeas = ideas.sort(() => 0.5 - Math.random()).slice(0, 5);

  res.json({
    success: true,
    response: "Voici quelques idées de vidéos québécoises! 🎬🍁",
    ideas: randomIdeas,
  });
});

// ═══════════════════════════════════════════════════════════════
// 🏒 HOCKEY ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/tiguy/hockey/standings
 * Get Canadiens standings
 */
router.get("/hockey/standings", async (req, res) => {
  const result = await hockeyBee.getStandings();
  res.json(result);
});

/**
 * GET /api/tiguy/hockey/next-game
 * Get next Canadiens game
 */
router.get("/hockey/next-game", async (req, res) => {
  const result = await hockeyBee.getNextGame();
  res.json(result);
});

/**
 * GET /api/tiguy/hockey/facts
 * Get random Habs fact
 */
router.get("/hockey/facts", (req, res) => {
  const facts = hockeyBee.getHabsFacts();
  const randomFact = facts[Math.floor(Math.random() * facts.length)];
  res.json({
    success: true,
    response: `🏒 Fun fact des Habs:\n\n${randomFact}`,
    fact: randomFact,
  });
});

// ═══════════════════════════════════════════════════════════════
// 🌤️ WEATHER ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/tiguy/weather/:city
 * Get weather for a Quebec city
 */
router.get("/weather", async (req, res) => {
  const city = (req.query.city as string) || "Montreal";
  const result = await weatherBee.getWeather(city);
  res.json(result);
});

router.get("/weather/:city", async (req, res) => {
  const city = req.params.city || "Montreal";
  const result = await weatherBee.getWeather(city);
  res.json(result);
});

// ═══════════════════════════════════════════════════════════════
// 🍴 FOOD ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/tiguy/food/poutine
 * Get poutine recommendations
 */
router.get("/food/poutine", (req, res) => {
  const spots = foodBee.getPoutineSpots();
  const randomSpots = spots.sort(() => 0.5 - Math.random()).slice(0, 4);
  res.json({
    success: true,
    response:
      "🍟 **Les meilleurs spots de poutine:**\n\n" +
      randomSpots
        .map(
          (s) => `**${s.name}** (${s.location})\n→ ${s.specialty} ${s.rating}`,
        )
        .join("\n\n"),
    spots: randomSpots,
  });
});

/**
 * GET /api/tiguy/food/smoked-meat
 * Get smoked meat recommendations
 */
router.get("/food/smoked-meat", (req, res) => {
  const spots = foodBee.getSmokedMeatSpots();
  res.json({
    success: true,
    response:
      "🥩 **Les meilleurs spots de smoked meat:**\n\n" +
      spots
        .map((s) => `**${s.name}** (${s.location})\n→ ${s.specialty}`)
        .join("\n\n"),
    spots,
  });
});

/**
 * GET /api/tiguy/food/bagels
 * Get bagel recommendations
 */
router.get("/food/bagels", (req, res) => {
  const spots = foodBee.getBagelSpots();
  res.json({
    success: true,
    response:
      "🥯 **Les meilleurs bagels de Montréal:**\n\n" +
      spots
        .map((s) => `**${s.name}** (${s.location})\n→ ${s.specialty}`)
        .join("\n\n"),
    spots,
  });
});

/**
 * POST /api/tiguy/food/recommend
 * Get food recommendation based on craving
 */
router.post("/food/recommend", (req, res) => {
  const { craving } = req.body;
  const response = foodBee.getRecommendation(craving || "");
  res.json({
    success: true,
    response,
  });
});

// ═══════════════════════════════════════════════════════════════
// 🎵 CULTURE ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/tiguy/culture/festivals
 * Get Quebec festivals
 */
router.get("/culture/festivals", (req, res) => {
  const festivals = cultureBee.getFestivals();
  const randomFests = festivals.sort(() => 0.5 - Math.random()).slice(0, 5);
  res.json({
    success: true,
    response:
      "🎉 **Festivals québécois:**\n\n" +
      randomFests
        .map(
          (f) =>
            `**${f.name}**\n📅 ${f.when}\n📍 ${f.where}\n→ ${f.description}`,
        )
        .join("\n\n"),
    festivals: randomFests,
  });
});

/**
 * GET /api/tiguy/culture/music
 * Get Quebec music recommendations
 */
router.get("/culture/music", (req, res) => {
  const music = cultureBee.getQuebecMusic();
  const randomArtists = music.sort(() => 0.5 - Math.random()).slice(0, 5);
  res.json({
    success: true,
    response:
      "🎵 **Artistes québécois à écouter:**\n\n" +
      randomArtists
        .map((a) => `**${a.artist}** (${a.genre})\n→ "${a.topSong}"`)
        .join("\n\n"),
    artists: randomArtists,
  });
});

/**
 * GET /api/tiguy/culture/expressions
 * Get Quebec expressions
 */
router.get("/culture/expressions", (req, res) => {
  const expressions = cultureBee.getExpressions();
  const randomExpr = expressions.sort(() => 0.5 - Math.random()).slice(0, 5);
  res.json({
    success: true,
    response:
      "📚 **Expressions québécoises:**\n\n" +
      randomExpr
        .map((e) => `**${e.expression}**\n→ ${e.meaning}\n→ Ex: "${e.example}"`)
        .join("\n\n"),
    expressions: randomExpr,
  });
});

// ═══════════════════════════════════════════════════════════════
// 🎤 VOICE ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/tiguy/voice/speak
 * Text-to-speech
 */
router.post("/voice/speak", async (req, res) => {
  try {
    const { text, voice = "ti-guy", speed = 1.0, emotion = "happy" } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Text required",
        response: "Qu'est-ce que tu veux que je dise? 🎤",
      });
    }

    const result = await voiceBee.textToSpeech({ text, voice, speed, emotion });

    res.json({
      success: result.success,
      response: result.success
        ? "🎤 Voici ta version audio! Écoute ben!"
        : `J'ai pas pu parler: ${result.error}`,
      audioBase64: result.audioBase64,
    });
  } catch (error: any) {
    console.error("Voice error:", error);
    res.status(500).json({
      error: error.message,
      response: "La voix a pas marché! 🎤",
    });
  }
});

/**
 * GET /api/tiguy/voice/pronunciation/:word
 * Get pronunciation guide
 */
router.get("/voice/pronunciation", (req, res) => {
  const guide = voiceBee.getPronunciationGuide();
  res.json({
    success: true,
    response:
      "📖 **Guide de prononciation québécoise:**\n\n" +
      Object.entries(guide)
        .map(([w, p]) => `- **${w}**: ${p}`)
        .join("\n"),
    guide,
  });
});

router.get("/voice/pronunciation/:word", (req, res) => {
  const guide = voiceBee.getPronunciationGuide();
  const word = req.params.word?.toLowerCase();

  if (word && guide[word]) {
    res.json({
      success: true,
      response: `📖 **${word}** se prononce: ${guide[word]}`,
      word,
      pronunciation: guide[word],
    });
  } else {
    res.json({
      success: true,
      response:
        "📖 **Guide de prononciation québécoise:**\n\n" +
        Object.entries(guide)
          .map(([w, p]) => `- **${w}**: ${p}`)
          .join("\n"),
      guide,
    });
  }
});

/**
 * GET /api/tiguy/capabilities
 * List all Ti-Guy capabilities
 */
router.get("/capabilities", (req, res) => {
  res.json({
    response: "Voici tout c'que j'peux faire pour toi! 🦫",
    capabilities: [
      {
        name: "Image Generation",
        description: "Crée des images avec l'IA",
        commands: [
          "génère une image de...",
          "dessine-moi...",
          "crée un avatar",
        ],
        icon: "🎨",
      },
      {
        name: "Video Generation",
        description: "Crée des vidéos courtes avec l'IA",
        commands: ["crée un vidéo de...", "anime cette image..."],
        icon: "🎬",
      },
      {
        name: "Web Search",
        description: "Cherche sur Google, YouTube, TikTok",
        commands: ["cherche...", "trouve...", "search for..."],
        icon: "🔍",
      },
      {
        name: "Web Navigation",
        description: "Va sur des sites web",
        commands: ["va sur...", "ouvre...", "navigate to..."],
        icon: "🌐",
      },
      {
        name: "Screenshot",
        description: "Capture des pages web",
        commands: ["screenshot de...", "capture..."],
        icon: "📸",
      },
      {
        name: "Hockey (Canadiens)",
        description: "Stats, matchs, fun facts des Habs",
        commands: ["stats des habs", "prochain match", "go habs go"],
        icon: "🏒",
      },
      {
        name: "Weather",
        description: "Météo des villes québécoises",
        commands: ["météo à montréal", "quel temps fait-il"],
        icon: "🌤️",
      },
      {
        name: "Food Recommendations",
        description: "Poutine, smoked meat, bagels, restaurants",
        commands: ["meilleure poutine", "où manger", "j'ai faim"],
        icon: "🍟",
      },
      {
        name: "Quebec Music",
        description: "Artistes et musique québécoise",
        commands: ["musique québécoise", "artistes à écouter"],
        icon: "🎵",
      },
      {
        name: "Festivals & Culture",
        description: "Festivals, événements, expressions",
        commands: ["festivals à montréal", "expressions québécoises"],
        icon: "🎉",
      },
      {
        name: "Voice",
        description: "Text-to-speech et prononciation",
        commands: ["dis...", "prononce...", "parle-moi"],
        icon: "🎤",
      },
      {
        name: "Quebec Culture",
        description: "Expertise culturelle québécoise",
        commands: ["c'est quoi...", "recommande-moi...", "parle-moi de..."],
        icon: "⚜️",
      },
    ],
  });
});

export default router;
