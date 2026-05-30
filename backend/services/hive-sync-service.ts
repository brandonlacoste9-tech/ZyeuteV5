/**
 * 🐝 HIVE-SYNC-SERVICE
 * Centralise les événements provenant de la Ruche (Q-emplois, AdGenXAI, etc.)
 * via n8n et les distribue aux citoyens sur Zyeuté.
 */

import { storage } from "../storage.js";
import { generateText } from "ai";
import { getVertexModel } from "../ai/vertex-ai.js";
import { TIGUY_SYSTEM_PROMPT } from "../ai/orchestrator.js";

const getTIGuyModel = () => {
  return getVertexModel("gemini-2.0-flash");
};

export interface HiveEvent {
  source: "zyeute" | "q-emplois" | "adgenxai";
  targetUserId: string;
  eventType: "achievement" | "notification" | "alert";
  payload: {
    title: string;
    message: string;
    priority: "low" | "normal" | "high"; // high = Vocal Ti-Guy + Visuel
    metadata?: any;
  };
  timestamp: string;
}

export class HiveSyncService {
  private static instance: HiveSyncService;
  private io: any;

  private constructor() {}

  static getInstance(): HiveSyncService {
    if (!HiveSyncService.instance) {
      HiveSyncService.instance = new HiveSyncService();
    }
    return HiveSyncService.instance;
  }

  setIo(io: any) {
    this.io = io;
  }

  /**
   * Traite un événement entrant de la Ruche
   */
  async handleIncomingEvent(event: HiveEvent) {
    console.log(
      `🐝 [HiveSync] Événement reçu de ${event.source}: ${event.eventType}`,
    );

    try {
      // 1. Persistance de la notification
      const notification = await storage.createNotification({
        userId: event.targetUserId,
        type: event.eventType === "achievement" ? "achievement" : "system",
        message: `${event.payload.title}: ${event.payload.message}`,
        fromUserId: "system", // Événement système/AI
        metadata: {
          ...event.payload.metadata,
          hiveSource: event.source,
          priority: event.payload.priority,
        },
      } as any);

      let processedMessage = event.payload.message;

      // 1.5 Réflexion Intelligente (Joualizer) si priorité haute 🧠
      if (event.payload.priority === "high") {
        try {
          const { text } = await generateText({
            model: getTIGuyModel(),
            system:
              TIGUY_SYSTEM_PROMPT +
              `\n
              RÔLE CRITIQUE: Tu dois réécrire le message de notification pour qu'il soit par-fait pour la synthèse vocale québécoise.
              RÈGLES DE PHONÉTIQUE:
              - Remplace "piastres" par "piasses".
              - Utilise des contractions naturelles (ex: "d'déneiger", "t'as", "c'est").
              - Garde le message court et punché.
              - Garde l'essence de l'information (quoi, combien, félicitations).`,
            prompt: `Réécris ceci pour ma voix: ${event.payload.message}`,
          });
          processedMessage = text;
          console.log(
            `🤖 [Joualizer] Message original: ${event.payload.message}`,
          );
          console.log(`🤖 [Joualizer] Message optimisé: ${processedMessage}`);
        } catch (err) {
          console.error("❌ Erreur Joualizer:", err);
          // On garde le message original si l'AI flanche
        }
      }

      // 2. Broadcast temps réel via Socket.IO
      if (this.io) {
        this.io.to(`user:${event.targetUserId}`).emit("hive_event", {
          id: notification.id,
          ...event,
          payload: {
            ...event.payload,
            message: processedMessage, // On envoie le message "joualisé" pour le TTS
          },
        });
      }

      // 3. Logique spécifique Ti-Guy pour les événements High Priority (Vocal)
      if (event.payload.priority === "high") {
        // Note: Le frontend recevra l'event et pourra déclencher le TTS via /api/tiguy/voice
        // ou Ti-Guy pourra "interrompre" pour annoncer la nouvelle.
        console.log(`📢 [HiveSync] Priorité HAUTE : Ti-Guy doit jaser.`);
      }

      return { success: true, notificationId: notification.id };
    } catch (error: any) {
      console.error("❌ [HiveSync] Erreur traitement:", error);
      throw error;
    }
  }
}

export const hiveSyncService = HiveSyncService.getInstance();
