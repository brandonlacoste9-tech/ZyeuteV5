// src/lib/permissions.ts
import { useGuestMode } from '../contexts/GuestModeContext';

export function usePermissions() {
  const { guestSession } = useGuestMode();
  const isGuest = !!guestSession?.isGuest;

  return {
    canPost: !isGuest,
    canComment: !isGuest,
    canLike: !isGuest,
    canViewContent: true,
    isGuest,
  };
}

export function requireAuth(action: string, onUpgrade: () => void, canDo: boolean) {
  if (!canDo) {
    onUpgrade();
    throw new Error(`Guest users must sign up to ${action}`);
  }
}
