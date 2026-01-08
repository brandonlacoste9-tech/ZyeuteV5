
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// --- Translations ---
const resources = {
  en: {
    translation: {
      arcade: {
        title: "Zyeuté Arcade",
        play: "PLAY NOW",
        status: {
          live: "LIVE",
          soon: "SOON",
        },
        games: {
          poutine: {
            title: "Poutine Royale",
            desc: "Stack your poutine as high as possible. Daily competition.",
          },
          hive: {
            title: "Hive Tap",
            desc: "Quick NFC check-in for territorial domination.",
          },
          trivia: {
            title: "Zyeuté Quiz",
            desc: "Test your knowledge of Quebec.",
          },
        },
      },
      lobby: {
        title: "Poutine Royale",
        active_tournaments: "Active Tournaments",
        prize_pool: "Prize Pool",
        entry: "Entry",
        insert_coin: "INSERT COIN",
        leaderboard_soon: "Hall of Fame (Coming Soon)",
        king: "Poutine King: ???",
        balance: "Cash",
      },
      game: {
        score: "Score",
        time: "Time",
        tap_hint: "Tap to Drop",
        game_over: "OOPS!",
        game_over_desc: "Your poutine toppled over.",
        good_job: "Not bad at all!",
        bad_job: "Missed a spot.",
        final_score: "Final Score",
        rank: "Global Rank",
        submitting: "BEAMING UP...",
        submit: "SUBMIT SCORE",
        retry: "RETRY",
        start_title: "POUTINE STACK",
        start_edition: "Tourist Trap Edition 🇨🇦",
        start_desc:
          "Stack as high as possible without making a mess.\n(Real ones know this isn't where you get the best ones)",
        start_btn: "START GAME",
        blocked: "Access Blocked",
        blocked_desc:
          "Parental controls enabled. Come back later or move to a safe zone!",
        back_arcade: "Back to Arcade",
      },
      hivetap: {
        title: "HIVE TAP RITUAL",
        scanning: "SCANNING NFC FREQUENCIES...",
        hold_phone: "HOLD PHONE AGAINST TERMINAL",
        connection_established: "NEURAL CONNECTION EXTABLISHED",
        syncing: "SYNCING HIVE DATA...",
        upload_complete: "UPLOAD COMPLETE",
        points_earned: "POINTS EARNED",
        dominance: "SECTOR DOMINANCE",
        close: "CLOSE",
      },
    },
  },
  fr: {
    translation: {
      arcade: {
        title: "Zyeuté Arcade",
        play: "JOUER MAINTENANT",
        status: {
          live: "EN DIRECT",
          soon: "BIENTÔT",
        },
        games: {
          poutine: {
            title: "Poutine Royale",
            desc: "Stacke ta poutine le plus haut possible. Compétition journalière.",
          },
          hive: {
            title: "Hive Tap",
            desc: "Check-in rapide NFC pour domination territoriale.",
          },
          trivia: {
            title: "Zyeuté Quiz",
            desc: "Test tes connaissances sur le Québec.",
          },
        },
      },
      lobby: {
        title: "Poutine Royale",
        active_tournaments: "Tournois Actifs",
        prize_pool: "Prize Pool",
        entry: "Entrée",
        insert_coin: "INSERT COIN",
        leaderboard_soon: "Temple de la Renommée (Bientôt)",
        king: "Roi de la Poutine: ???",
        balance: "Piasses",
      },
      game: {
        score: "Score",
        time: "Temps",
        tap_hint: "Tape pour Lâcher",
        game_over: "OUPELAYE!",
        game_over_desc: "Ta poutine a revollé.",
        good_job: "Pas pire pentoute!",
        bad_job: "Y'en a manqué un boute.",
        final_score: "Score Final",
        rank: "Rang Mondial",
        submitting: "SOUCOUPAGE...",
        submit: "SOUMETTRE LE SCORE",
        retry: "RÉESSAYER",
        start_title: "POUTINE STACK",
        start_edition: "Édition \"Piège à Touristes\" 🇨🇦",
        start_desc:
          "Stack le plus haut possible sans tout faire revollé par terre.\n(Les vrais savent que c'est pas là qu'on mange la meilleure)",
        start_btn: "START GAME",
        blocked: "Accès Bloqué",
        blocked_desc:
          "Tes parents ont mis en place des limites. Reviens plus tard ou déplace-toi!",
        back_arcade: "Retour à l'Arcade",
      },
      hivetap: {
        title: "RITUEL HIVE TAP",
        scanning: "SCAN DES FRÉQUENCES NFC...",
        hold_phone: "MAINTENIR TÉLÉPHONE SUR LE TERMINAL",
        connection_established: "CONNEXION NEURONALE ÉTABLIE",
        syncing: "SYNCHRONISATION DU HIVE...",
        upload_complete: "TÉLÉVERSEMENT COMPLÉTÉ",
        points_earned: "POINTS GAGNÉS",
        dominance: "DOMINATION SECTEUR",
        close: "FERMER",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lang",
      lookupLocalStorage: "zyeute_lang",
      caches: ["localStorage"],
    },
  });

export { useTranslation };
export default i18n;
