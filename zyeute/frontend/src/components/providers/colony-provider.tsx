import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { colonyLink } from "../../lib/colony-link";

interface ColonyContextType {
  isConnected: boolean;
  connectionStatus: string;
  broadcastPost: (post: any) => void;
  broadcastLike: (postId: string, userId: string) => void;
  broadcastComment: (comment: any) => void;
  requestTiGuyResponse: (message: string, context?: any) => void;
  requestJoualBeeModeration: (content: string) => void;
  broadcastVirtualGift: (gift: any) => void;
  // subscribeToKryptoAlerts removed
  subscribeToVraieQuebecEvents: (callback: (event: any) => void) => void;
  subscribeToAdGenCampaigns: (callback: (campaign: any) => void) => void;
}

const ColonyContext = createContext<ColonyContextType | undefined>(undefined);

interface ColonyProviderProps {
  children: ReactNode;
}

export function ColonyProvider({ children }: ColonyProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("not_initialized");

  useEffect(() => {
    // Monitor connection status
    const checkConnection = () => {
      setIsConnected(colonyLink.isConnected());
      setConnectionStatus(colonyLink.getConnectionStatus());
    };

    // Initial check
    checkConnection();

    // Set up periodic checks
    const interval = setInterval(checkConnection, 5000);

    // Listen for connection events
    colonyLink.on("connect", () => {
      setIsConnected(true);
      setConnectionStatus("connected");
      console.log("⚜️ Zyeuté: Colony Provider - Connected to Colony OS");
    });

    colonyLink.on("disconnect", () => {
      setIsConnected(false);
      setConnectionStatus("disconnected");
      console.log("⚜️ Zyeuté: Colony Provider - Disconnected from Colony OS");
    });

    colonyLink.on("connect_error", () => {
      setIsConnected(false);
      setConnectionStatus("error");
    });

    return () => {
      clearInterval(interval);
      colonyLink.off("connect");
      colonyLink.off("disconnect");
      colonyLink.off("connect_error");
    };
  }, []);

  const contextValue: ColonyContextType = {
    isConnected,
    connectionStatus,
    broadcastPost: colonyLink.broadcastPost.bind(colonyLink),
    broadcastLike: colonyLink.broadcastLike.bind(colonyLink),
    broadcastComment: colonyLink.broadcastComment.bind(colonyLink),
    requestTiGuyResponse: colonyLink.requestTiGuyResponse.bind(colonyLink),
    requestJoualBeeModeration:
      colonyLink.requestJoualBeeModeration.bind(colonyLink),
    broadcastVirtualGift: colonyLink.broadcastVirtualGift.bind(colonyLink),
    // subscribeToKryptoAlerts removed
    subscribeToVraieQuebecEvents:
      colonyLink.subscribeToVraieQuebecEvents.bind(colonyLink),
    subscribeToAdGenCampaigns:
      colonyLink.subscribeToAdGenCampaigns.bind(colonyLink),
  };

  return (
    <ColonyContext.Provider value={contextValue}>
      {children}
    </ColonyContext.Provider>
  );
}

export function useColony(): ColonyContextType {
  const context = useContext(ColonyContext);
  if (context === undefined) {
    throw new Error("useColony must be used within a ColonyProvider");
  }
  return context;
}

// Colony Status Component for debugging
export function ColonyStatus() {
  const { isConnected, connectionStatus } = useColony();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      case "disconnected":
        return "text-red-500";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return "🐝";
      case "connecting":
        return "🔄";
      case "disconnected":
        return "💤";
      case "error":
        return "⚠️";
      default:
        return "❓";
    }
  };

  // Only show status when connected or in development mode
  // Hide disconnected/error states to avoid user confusion
  if (connectionStatus === "disconnected" || connectionStatus === "error") {
    // Only log to console in development, don't show in UI
    if (import.meta.env.DEV) {
      return (
        <div className={`flex items-center space-x-2 text-xs text-gray-500 opacity-50`}>
          <span>{getStatusIcon()}</span>
          <span className="hidden sm:inline">Offline</span>
        </div>
      );
    }
    // In production, hide completely
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${getStatusColor()}`}>
      <span>{getStatusIcon()}</span>
      <span className="hidden sm:inline">Colony OS: {connectionStatus}</span>
      {isConnected && (
        <span className="text-xs text-green-400">(Hive Active)</span>
      )}
    </div>
  );
}
