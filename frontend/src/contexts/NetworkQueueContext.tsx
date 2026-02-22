import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  togglePostFire,
  addComment,
  followUser,
  toggleFollow,
} from "@/services/api"; // Import your API functions
import { logger } from "@/lib/logger";
import { toast } from "@/components/Toast";

const queueLogger = logger.withContext("NetworkQueue");

export type ActionType =
  | "FIRE_POST"
  | "COMMENT_POST"
  | "FOLLOW_USER"
  | "UNFOLLOW_USER";

export interface QueueAction {
  id: string;
  type: ActionType;
  payload: any;
  timestamp: number;
  retryCount: number;
}

interface NetworkQueueContextType {
  queue: QueueAction[];
  addToQueue: (type: ActionType, payload: any) => void;
  isOnline: boolean;
  processQueue: () => Promise<void>;
}

const NetworkQueueContext = createContext<NetworkQueueContextType | undefined>(
  undefined,
);

export const useNetworkQueue = () => {
  const context = useContext(NetworkQueueContext);
  if (!context) {
    throw new Error(
      "useNetworkQueue must be used within a NetworkQueueProvider",
    );
  }
  return context;
};

const MAX_RETRIES = 3;
const STORAGE_KEY = "zyeute_offline_queue";

export const NetworkQueueProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isOnline = useNetworkStatus();
  const [queue, setQueue] = useState<QueueAction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      queueLogger.error("Failed to load queue from storage", e);
      return [];
    }
  });

  // Persist queue
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  const addToQueue = useCallback(
    (type: ActionType, payload: any) => {
      const action: QueueAction = {
        id: crypto.randomUUID(),
        type,
        payload,
        timestamp: Date.now(),
        retryCount: 0,
      };

      setQueue((prev) => [...prev, action]);

      if (!isOnline) {
        toast.info("Pas de connexion. Action mise en file d'attente. 📡");
      }
    },
    [isOnline],
  );

  const processAction = async (action: QueueAction) => {
    try {
      switch (action.type) {
        case "FIRE_POST":
          await togglePostFire(action.payload.postId, action.payload.userId);
          break;
        case "COMMENT_POST":
          await addComment(action.payload.postId, action.payload.content);
          break;
        case "FOLLOW_USER":
          await followUser(action.payload.userId);
          break;
        case "UNFOLLOW_USER":
          await toggleFollow(
            action.payload.followerId,
            action.payload.followingId,
            true,
          );
          break;
        default:
          console.warn("Unknown action type", action.type);
      }
      return true; // Success
    } catch (error) {
      console.error(`Failed to process action ${action.type}`, error);
      return false; // Failed
    }
  };

  const processQueue = useCallback(async () => {
    if (queue.length === 0 || !isOnline) return;

    queueLogger.info(`Processing ${queue.length} offline actions...`);

    const remainingQueue: QueueAction[] = [];

    // Process sequentially to maintain order
    for (const action of queue) {
      const success = await processAction(action);
      if (!success) {
        if (action.retryCount < MAX_RETRIES) {
          remainingQueue.push({ ...action, retryCount: action.retryCount + 1 });
        } else {
          queueLogger.error(
            `Action ${action.id} failed max retries, dropping.`,
          );
        }
      }
    }

    if (queue.length > remainingQueue.length) {
      const processedCount = queue.length - remainingQueue.length;
      toast.success(`${processedCount} actions synchronisées! ☁️`);
    }

    setQueue(remainingQueue);
  }, [queue, isOnline]);

  // Auto-process when coming online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      processQueue();
    }
  }, [isOnline, processQueue, queue.length]);

  const value = React.useMemo(() => ({ queue, addToQueue, isOnline, processQueue }), [queue, addToQueue, isOnline, processQueue]);

  return (
    <NetworkQueueContext.Provider
      value={value}
    >
      {children}
    </NetworkQueueContext.Provider>
  );
};
