/**
 * 🎤 Voice Bee (Version Souveraine - Google Cloud)
 * Text-to-Speech et Speech-to-Text pour Ti-Guy
 * Branchement sur Google Cloud pour un accent québécois authentique.
 *
 * 🌟 VOIX CÉLÈBRES DU QUÉBEC:
 * - "celine" → Céline Dion (style diva)
 * - "ginette" → Ginette Reno (style maman Québécoise)
 * - "denis" → Denis Lévesque (style animateur TVA)
 * - "jean" → Jean Lapointe (style humoriste)
 * - "ti-guy" → Notre castor national 🦫
 */

import { z } from "zod";
import { SpeechClient } from "@google-cloud/speech";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

// Schéma de génération vocale avec voix célèbres
export const VoiceGenerationSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z
    .enum([
      "ti-guy",
      "celine", // Céline Dion style
      "ginette", // Ginette Reno style
      "denis", // Denis Lévesque style
      "jean", // Jean Lapointe style
      "julie", // Julie Snyder style
      "mike", // Mike Ward style
      "mario", // Mario Dumont style
    ])
    .default("ti-guy"),
  speed: z.number().optional().default(1.0),
  emotion: z.string().optional().default("happy"),
});

export type VoiceGenerationRequest = z.infer<typeof VoiceGenerationSchema>;

// 🌟 Configuration des voix célèbres
const CELEBRITY_VOICES: Record<
  string,
  {
    name: string;
    gender: string;
    pitch: number;
    speakingRate: number;
    effects?: string;
  }
> = {
  "ti-guy": {
    name: "fr-CA-Standard-D",
    gender: "MALE",
    pitch: 0,
    speakingRate: 1.0,
  },
  celine: {
    name: "fr-CA-Standard-A", // Voix féminine
    gender: "FEMALE",
    pitch: 2.5, // Plus aigu comme Céline
    speakingRate: 0.9, // Un peu plus lent (dramatique)
    effects: "Céline Dion style: 'Mon dieu, c'est fantastique!'",
  },
  ginette: {
    name: "fr-CA-Standard-C",
    gender: "FEMALE",
    pitch: -1.5, // Plus grave (maman)
    speakingRate: 1.1,
    effects: "Ginette Reno style: chaleureuse et maternelle",
  },
  denis: {
    name: "fr-CA-Standard-D",
    gender: "MALE",
    pitch: -2, // Grave comme animateur
    speakingRate: 1.2, // Rapide comme au journal
    effects: "Denis Lévesque style: journaliste dynamique",
  },
  jean: {
    name: "fr-CA-Standard-B",
    gender: "MALE",
    pitch: -1,
    speakingRate: 0.95,
    effects: "Jean Lapointe style: humoriste charismatique",
  },
  julie: {
    name: "fr-CA-Standard-A",
    gender: "FEMALE",
    pitch: 1.5,
    speakingRate: 1.3, // Très rapide
    effects: "Julie Snyder style: énergique et rapide",
  },
  mike: {
    name: "fr-CA-Standard-D",
    gender: "MALE",
    pitch: -0.5,
    speakingRate: 1.1,
    effects: "Mike Ward style: comédien sarcastique",
  },
  mario: {
    name: "fr-CA-Standard-B",
    gender: "MALE",
    pitch: 0.5,
    speakingRate: 0.9, // Lent et posé
    effects: "Mario Dumont style: politique calme",
  },
};

export class VoiceBee {
  private clientSTT: SpeechClient;
  private clientTTS: TextToSpeechClient;

  constructor() {
    this.clientSTT = new SpeechClient();
    this.clientTTS = new TextToSpeechClient();
  }

  /**
   * 🎭 Get available celebrity voices
   */
  getCelebrityVoices(): Array<{
    id: string;
    name: string;
    description: string;
    emoji: string;
  }> {
    return [
      {
        id: "ti-guy",
        name: "TI-GUY",
        description: "Le castor québécois",
        emoji: "🦫",
      },
      {
        id: "celine",
        name: "Céline",
        description: "Style diva internationale",
        emoji: "🎤",
      },
      {
        id: "ginette",
        name: "Ginette",
        description: "La maman du Québec",
        emoji: "❤️",
      },
      {
        id: "denis",
        name: "Denis",
        description: "Animateur TVA dynamique",
        emoji: "📺",
      },
      {
        id: "jean",
        name: "Jean",
        description: "Humoriste charismatique",
        emoji: "😄",
      },
      {
        id: "julie",
        name: "Julie",
        description: "Énergie débordante",
        emoji: "⚡",
      },
      {
        id: "mike",
        name: "Mike",
        description: "Comédien sarcastique",
        emoji: "🎭",
      },
      {
        id: "mario",
        name: "Mario",
        description: "Voix posée politique",
        emoji: "🏛️",
      },
    ];
  }

  getPronunciationGuide(): Record<string, string> {
    return {
      zyeuté: "zi-yeu-té",
      poutine: "pou-tsine",
      québec: "ké-bek",
      "ti-guy": "tsi-ghi",
      chum: "tchum",
      char: "tchar",
      frette: "frette",
    };
  }

  /**
   * 🗣️ TEXT-TO-SPEECH (Génération de la voix de Ti-Guy ou Célébrités)
   */
  async textToSpeech(request: VoiceGenerationRequest): Promise<{
    success: boolean;
    audioBase64?: string;
    voiceUsed?: string;
    error?: string;
  }> {
    try {
      const voiceConfig =
        CELEBRITY_VOICES[request.voice] || CELEBRITY_VOICES["ti-guy"];

      console.log(
        `🎙️ Synthèse vocale [${request.voice}] pour : "${request.text.substring(0, 50)}..."`,
      );

      // Ajouter une signature vocale selon la célébrité
      let textToSpeak = request.text;
      if (request.voice === "celine" && !textToSpeak.includes("mon dieu")) {
        textToSpeak = textToSpeak + "! Mon dieu!";
      } else if (request.voice === "ginette") {
        textToSpeak = "Mon chum, " + textToSpeak;
      } else if (request.voice === "denis") {
        textToSpeak = "Alors là! " + textToSpeak;
      }

      const [response] = await this.clientTTS.synthesizeSpeech({
        input: { text: textToSpeak },
        voice: {
          languageCode: "fr-CA",
          name: voiceConfig.name,
          ssmlGender: voiceConfig.gender as any,
        },
        audioConfig: {
          audioEncoding: "MP3",
          pitch: voiceConfig.pitch,
          speakingRate: voiceConfig.speakingRate * request.speed,
        },
      });

      if (!response.audioContent) {
        throw new Error("Contenu audio vide reçu de Google TTS.");
      }

      const base64 = Buffer.from(response.audioContent as Uint8Array).toString(
        "base64",
      );

      return {
        success: true,
        audioBase64: base64,
        voiceUsed: request.voice,
      };
    } catch (erreur) {
      console.error("❌ Échec TTS Google Cloud :", erreur);
      return {
        success: false,
        error: erreur instanceof Error ? erreur.message : "Erreur TTS inconnue",
      };
    }
  }

  /**
   * 🎧 SPEECH-TO-TEXT (Les oreilles de Ti-Guy)
   */
  async speechToText(audioBase64: string): Promise<{
    success: boolean;
    text?: string;
    error?: string;
  }> {
    try {
      console.log("👂 Transcription audio en cours (fr-CA)...");

      const request = {
        audio: { content: audioBase64 },
        config: {
          encoding: "WEBM_OPUS" as any, // Format standard des blobs média navigateur
          sampleRateHertz: 48000,
          languageCode: "fr-CA", // On écoute le Joual !
        },
      };

      const [response] = await this.clientSTT.recognize(request as any);
      const transcription = response.results
        ?.map((result) => result.alternatives?.[0].transcript)
        .join("\n");

      if (!transcription) {
        return { success: false, error: "J'ai rien entendu, mon chum!" };
      }

      return {
        success: true,
        text: transcription,
      };
    } catch (erreur) {
      console.error("❌ Échec STT Google Cloud :", erreur);
      return {
        success: false,
        error: erreur instanceof Error ? erreur.message : "Erreur STT inconnue",
      };
    }
  }
}

export const voiceBee = new VoiceBee();
