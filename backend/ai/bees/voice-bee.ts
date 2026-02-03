/**
 * 🎤 Voice Bee
 * Text-to-Speech and Speech-to-Text capabilities for Ti-Guy
 * Enables voice interactions with Quebec French pronunciation
 */

import { z } from "zod";

// Voice generation schema
export const VoiceGenerationSchema = z.object({
  text: z.string().min(1).max(1000),
  voice: z
    .enum([
      "quebec-male", // Québécois male voice
      "quebec-female", // Québécoise female voice
      "ti-guy", // Ti-Guy's signature voice (fun, energetic)
      "narrator", // Neutral narrator
    ])
    .default("ti-guy"),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  emotion: z.enum(["neutral", "happy", "excited", "calm"]).default("happy"),
});

export type VoiceGenerationRequest = z.infer<typeof VoiceGenerationSchema>;

// ElevenLabs or alternative TTS API
const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

/**
 * Ti-Guy Voice Bee
 * Provides voice synthesis and transcription with Quebec personality
 */
export class VoiceBee {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || "";
  }

  /**
   * Convert text to speech with Quebec accent
   */
  async textToSpeech(request: VoiceGenerationRequest): Promise<{
    success: boolean;
    audioUrl?: string;
    audioBase64?: string;
    error?: string;
  }> {
    if (!this.apiKey) {
      // Return mock response for demo
      return {
        success: true,
        audioUrl: undefined,
        audioBase64: undefined,
        error: "Voice API not configured - using text fallback",
      };
    }

    try {
      // Map our voice types to ElevenLabs voices
      const voiceMap: Record<string, string> = {
        "quebec-male": "21m00Tcm4TlvDq8ikWAM", // Default male
        "quebec-female": "EXAVITQu4vr4xnSDxMaL", // Default female
        "ti-guy": "pNInz6obpgDQGcFmaJgB", // Energetic male
        narrator: "onwK4e9ZLuTAKqWW03F9", // Neutral
      };

      const response = await fetch(
        `${ELEVENLABS_API}/text-to-speech/${voiceMap[request.voice]}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: request.text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: request.emotion === "excited" ? 0.8 : 0.5,
              use_speaker_boost: true,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(audioBuffer).toString("base64");

      return {
        success: true,
        audioBase64: base64,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Transcribe audio to text (Speech-to-Text)
   */
  async speechToText(audioBase64: string): Promise<{
    success: boolean;
    text?: string;
    language?: string;
    error?: string;
  }> {
    // Using OpenAI Whisper or similar
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return {
        success: false,
        error: "Speech-to-text not configured",
      };
    }

    try {
      const audioBuffer = Buffer.from(audioBase64, "base64");

      const formData = new FormData();
      formData.append(
        "file",
        new Blob([audioBuffer], { type: "audio/webm" }),
        "audio.webm",
      );
      formData.append("model", "whisper-1");
      formData.append("language", "fr"); // French for Quebec

      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        text: data.text,
        language: "fr-CA",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate Ti-Guy's signature sound effects
   */
  getSoundEffect(type: string): string {
    const effects: Record<string, string> = {
      greeting: "🎵 *bruit de castor content*",
      thinking: "🎵 *son de réflexion*",
      success: "🎵 *ding de victoire québécoise*",
      error: "🎵 *oups sonore*",
      excited: "🎵 *tabarnak d'excitation*",
      approval: "🎵 *tiguidou musical*",
    };

    return effects[type] || "🎵";
  }

  /**
   * Ti-Guy pronunciation guide for Quebec terms
   */
  getPronunciationGuide(): Record<string, string> {
    return {
      poutine: "poo-TEEN",
      tabarnak: "ta-bar-NAK",
      câlice: "KA-liss",
      ostie: "oss-TEE",
      sacrement: "sa-kra-MAN",
      tiguidou: "ti-gui-DOO",
      icitte: "i-SITT",
      pantoute: "pan-TOOT",
      char: "SHAR",
      dépanneur: "day-pa-NER",
      tuque: "TOOK",
      pis: "PEE",
      tsé: "SAY",
    };
  }
}

/**
 * Bee task runner for voice operations
 */
export async function run(task: any) {
  const payload = task.payload || {};
  const action = payload.action || "tts";

  const bee = new VoiceBee();

  switch (action) {
    case "tts":
    case "text-to-speech": {
      const ttsResult = await bee.textToSpeech({
        text: payload.text || payload.message,
        voice: payload.voice || "ti-guy",
        speed: payload.speed || 1.0,
        emotion: payload.emotion || "happy",
      });
      return {
        ...ttsResult,
        response: ttsResult.success
          ? "🎤 Voici ta version audio! Écoute ben!"
          : `Oups, j'ai pas pu parler: ${ttsResult.error}`,
      };
    }

    case "stt":
    case "speech-to-text": {
      const sttResult = await bee.speechToText(payload.audio);
      return {
        ...sttResult,
        response: sttResult.success
          ? `🎧 J'ai compris: "${sttResult.text}"`
          : `J'ai pas pu comprendre l'audio: ${sttResult.error}`,
      };
    }

    case "pronunciation": {
      const guide = bee.getPronunciationGuide();
      const word = payload.word?.toLowerCase();
      if (word && guide[word]) {
        return {
          success: true,
          response: `📖 **${word}** se prononce: ${guide[word]}`,
        };
      }
      return {
        success: true,
        response:
          `📖 **Guide de prononciation québécoise:**\n\n` +
          Object.entries(guide)
            .slice(0, 5)
            .map(([w, p]) => `- ${w}: ${p}`)
            .join("\n"),
      };
    }

    case "effect":
      return {
        success: true,
        response: bee.getSoundEffect(payload.type || "greeting"),
      };

    default:
      return {
        success: false,
        response:
          "Action vocale non reconnue! Essaie 'tts', 'stt', ou 'pronunciation'.",
      };
  }
}

export const voiceBee = new VoiceBee();
