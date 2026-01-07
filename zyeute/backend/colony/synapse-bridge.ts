/**
 * Colony OS Synapse Bridge
 * Real-time Socket.io connection between Zyeuté backend and Colony OS Python kernel
 */

import { io, Socket } from "socket.io-client";
import { EventEmitter } from "events";

class SynapseBridge extends EventEmitter {
  private socket: Socket | null = null;
  private colonyUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  constructor() {
    super();
    this.colonyUrl = process.env.COLONY_OS_URL || "http://localhost:10000";
  }

  async connect(): Promise<void> {
    if (this.isConnecting || this.socket?.connected) return;

    this.isConnecting = true;

    this.socket = io(this.colonyUrl, {
      auth: {
        hive: "zyeute",
        token: process.env.COLONY_API_KEY || "dev-key",
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on("connect", () => {
      console.log("⚜️ [Synapse] Connected to Colony OS kernel");
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.emit("connected");

      // Join Quebec hive channel
      this.socket?.emit("join_channel", "quebec_social");
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`⚜️ [Synapse] Disconnected: ${reason}`);
      this.isConnecting = false;
      this.emit("disconnected", reason);
    });

    this.socket.on("connect_error", (error) => {
      this.reconnectAttempts++;
      console.warn(
        `⚜️ [Synapse] Connection error (${this.reconnectAttempts}/${this.maxReconnectAttempts}):`,
        error.message,
      );
      this.isConnecting = false;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error(
          "⚜️ [Synapse] Max reconnection attempts reached. Operating in standalone mode.",
        );
        this.emit("connection_failed");
      }
    });

    // Handle Colony OS events
    this.socket.on("colony.task.assigned", (task) => {
      console.log("⚜️ [Synapse] Task assigned by Colony OS:", task.id);
      this.emit("task", task);
    });

    this.socket.on("colony.intelligence", (data) => {
      console.log("⚜️ [Synapse] Intelligence received from Colony OS");
      this.emit("intelligence", data);
    });
  }

  async publishEvent(event: string, data: any): Promise<void> {
    if (!this.socket?.connected) {
      console.warn(`⚜️ [Synapse] Not connected, queuing event: ${event}`);
      // Could implement event queue here for offline events
      return;
    }

    this.socket.emit("hive.event", {
      hive: "zyeute",
      event,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  async requestIntelligence(query: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error("Synapse bridge not connected to Colony OS"));
        return;
      }

      const requestId = crypto.randomUUID();

      const handler = (response: any) => {
        if (response.requestId === requestId) {
          this.socket?.off("colony.intelligence.response", handler);
          resolve(response.data);
        }
      };

      this.socket.on("colony.intelligence.response", handler);

      this.socket.emit("hive.request.intelligence", {
        requestId,
        query,
        hive: "zyeute",
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        this.socket?.off("colony.intelligence.response", handler);
        reject(new Error("Colony OS intelligence request timeout"));
      }, 15000);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus():
    | "connected"
    | "disconnected"
    | "connecting"
    | "failed" {
    if (this.isConnecting) return "connecting";
    if (this.socket?.connected) return "connected";
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return "failed";
    return "disconnected";
  }
}

export const synapseBridge = new SynapseBridge();
