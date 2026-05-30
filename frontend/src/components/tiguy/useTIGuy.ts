/**
 * 🦫 TI-GUY Hook
 * Manages TI-GUY chat state and interactions
 */

import { useState, useCallback } from "react";

export interface TIGuyState {
  isOpen: boolean;
  isExpanded: boolean;
  unreadCount: number;
  creditsRemaining: number;
}

export const useTIGuy = (userId: string) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState(813.16);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsExpanded(true);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const minimizeChat = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const expandChat = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const toggleChat = useCallback(() => {
    if (isOpen) {
      if (isExpanded) {
        minimizeChat();
      } else {
        closeChat();
      }
    } else {
      openChat();
    }
  }, [isOpen, isExpanded, openChat, closeChat, minimizeChat]);

  return {
    isOpen,
    isExpanded,
    unreadCount,
    creditsRemaining,
    openChat,
    closeChat,
    minimizeChat,
    expandChat,
    toggleChat,
    userId,
  };
};

export default useTIGuy;
