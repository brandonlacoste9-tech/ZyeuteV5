// @ts-expect-error - socket.io-client types being stubborn
import { io, Socket } from "socket.io-client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
);

const COLONY_API_URL =
  import.meta.env.VITE_COLONY_API_URL || "http://localhost:10000";

class ColonyLink {
  public socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    if (typeof window !== "undefined") {
      this.connect();
    }
  }

  private async connect() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Guest users don't get a socket connection
      if (!token) {
        console.log("🌱 Zyeuté: Guest mode (No Socket)");
        return;
      }

      this.socket = io(COLONY_API_URL, {
        auth: { token },
        transports: ["websocket"],
        autoConnect: true,
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      this.socket.on("connect", () => {
        console.log("⚜️ Zyeuté: Connected to Colony OS Core.");
        this.reconnectAttempts = 0;
        // Join Quebec social channels
        this.socket?.emit("join_channel", "quebec_social");
        this.socket?.emit("join_channel", "global_feed");
      });

      this.socket.on("disconnect", (reason: string) => {
        console.log("⚜️ Zyeuté: Disconnected from Colony OS:", reason);
      });

      this.socket.on("connect_error", (error: Error) => {
        console.log("⚜️ Zyeuté: Connection error:", error.message);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log(
            "⚜️ Zyeuté: Max reconnection attempts reached. Operating in standalone mode.",
          );
        }
      });

      this.socket.on("reconnect", () => {
        console.log("⚜️ Zyeuté: Reconnected to Colony OS.");
        this.reconnectAttempts = 0;
      });
    } catch (error) {
      console.error("⚜️ Zyeuté: Failed to establish Colony connection:", error);
    }
  }

  // Social Media Events
  public broadcastPost(post: any) {
    this.socket?.emit("social_post", {
      platform: "zyeute",
      type: "new_post",
      data: post,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastLike(postId: string, userId: string) {
    this.socket?.emit("social_interaction", {
      platform: "zyeute",
      type: "like",
      postId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastComment(comment: any) {
    this.socket?.emit("social_interaction", {
      platform: "zyeute",
      type: "comment",
      data: comment,
      timestamp: new Date().toISOString(),
    });
  }

  // AI Agent Communication
  public requestTiGuyResponse(message: string, context?: any) {
    this.socket?.emit("ai_request", {
      agent: "ti-guy",
      platform: "zyeute",
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  public requestJoualBeeModeration(content: string) {
    this.socket?.emit("ai_request", {
      agent: "joualbee",
      platform: "zyeute",
      type: "moderation",
      content,
      timestamp: new Date().toISOString(),
    });
  }

  // Commerce Events
  public broadcastVirtualGift(gift: any) {
    this.socket?.emit("commerce_event", {
      platform: "zyeute",
      type: "virtual_gift",
      data: gift,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastSubscription(subscription: any) {
    this.socket?.emit("commerce_event", {
      platform: "zyeute",
      type: "subscription",
      data: subscription,
      timestamp: new Date().toISOString(),
    });
  }

  // Cross-Organ Synergies

  public subscribeToVraieQuebecEvents(callback: (event: any) => void) {
    this.socket?.on("vraie_quebec_event", callback);
  }

  public subscribeToAdGenCampaigns(callback: (campaign: any) => void) {
    this.socket?.on("adgen_campaign", callback);
  }

  // General Event Handling
  public emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  public on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  public off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  // Health Check
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getConnectionStatus(): string {
    if (!this.socket) return "not_initialized";
    if (this.socket.connected) return "connected";
    if (this.socket.disconnected) return "disconnected";
    return "connecting";
  }

  // Cleanup
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const colonyLink = new ColonyLink();

// Export for React components
export default colonyLink;
