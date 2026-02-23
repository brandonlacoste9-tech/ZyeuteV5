/**
 * 🎤 Voice Bee (Version Souveraine - Google Cloud)
 * Text-to-Speech et Speech-to-Text pour Ti-Guy
 * Branchement sur Google Cloud pour un accent québécois authentique.
 */

import { z } from "zod";
import speech from "@google-cloud/speech";
import textToSpeech from "@google-cloud/text-to-speech";

// Schéma de génération vocale
export const VoiceGenerationSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z.enum(["quebec-male", "quebec-female", "ti-guy"]).default("ti-guy"),
});

export type VoiceGenerationRequest = z.infer<typeof VoiceGenerationSchema>;

export class VoiceBee {
  private clientSTT: speech.SpeechClient;
  private clientTTS: textToSpeech.TextToSpeechClient;

  constructor() {
    this.clientSTT = new speech.SpeechClient();
    this.clientTTS = new textToSpeech.TextToSpeechClient();
  }

  /**
   * 🗣️ TEXT-TO-SPEECH (Génération de la voix de Ti-Guy)
   */
  async textToSpeech(request: VoiceGenerationRequest): Promise<{
    success: boolean;
    audioBase64?: string;
    error?: string;
  }> {
    try {
      console.log(
        `🎙️ Synthèse vocale pour : "${request.text.substring(0, 50)}..."`,
      );

      const [response] = await this.clientTTS.synthesizeSpeech({
        input: { text: request.text },
        voice: {
          languageCode: "fr-CA",
          name: "fr-CA-Standard-D", // Voix masculine québécoise robuste
          ssmlGender: "MALE",
        },
        audioConfig: { audioEncoding: "MP3" },
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
