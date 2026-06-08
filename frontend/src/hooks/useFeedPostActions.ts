import { useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  moderatorDeletePost,
  markPostNotInterested,
  reportPostContent,
  requestBlockUser,
} from "@/services/api";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";

export type FeedActionSource = "feed" | "profile";
export type FeedActionsLang = "fr" | "en";

const MESSAGES = {
  fr: {
    modDeleteConfirm:
      "Supprimer définitivement cette publication du fil? Cette action est irréversible.",
    modDeleteSuccess: "Publication retirée par modération",
    modDeleteError: "Échec de la suppression modération",
    signInRequired: "Connexion requise",
    notInterestedSuccess: "Tu verras moins de contenu comme ça",
    notInterestedError: "Impossible de masquer ce contenu",
    reportSuccess: "Merci — notre équipe va examiner ce contenu.",
    reportError: "Connexion requise ou erreur serveur.",
    blockSuccess: "Demande de blocage enregistrée.",
    blockError: "Impossible d'enregistrer le blocage.",
  },
  en: {
    modDeleteConfirm:
      "Permanently remove this post from the feed? This cannot be undone.",
    modDeleteSuccess: "Post removed by moderation",
    modDeleteError: "Moderation delete failed",
    signInRequired: "Sign-in required",
    notInterestedSuccess: "You'll see less content like this",
    notInterestedError: "Couldn't hide this content",
    reportSuccess: "Thanks — our team will review this content.",
    reportError: "Sign-in required or server error.",
    blockSuccess: "Block request recorded.",
    blockError: "Couldn't record block request.",
  },
} as const;

export function useFeedPostActions(
  source: FeedActionSource = "feed",
  lang: FeedActionsLang = "fr",
) {
  const { isAdmin, user } = useAuth();
  const { impact } = useHaptics();
  const [busy, setBusy] = useState(false);
  const t = MESSAGES[lang];

  const handleModeratorDelete = useCallback(
    async (postId: string): Promise<boolean> => {
      if (!isAdmin) return false;
      if (!window.confirm(t.modDeleteConfirm)) {
        return false;
      }
      setBusy(true);
      try {
        const ok = await moderatorDeletePost(postId, source);
        if (ok) {
          toast.success(t.modDeleteSuccess);
          impact();
          return true;
        }
        toast.error(t.modDeleteError);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [isAdmin, impact, source, t],
  );

  const handleNotInterested = useCallback(
    async (postId: string): Promise<boolean> => {
      if (!user) {
        toast.error(t.signInRequired);
        return false;
      }
      setBusy(true);
      try {
        const ok = await markPostNotInterested(postId);
        if (ok) {
          toast.success(t.notInterestedSuccess);
          return true;
        }
        toast.error(t.notInterestedError);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [user, t],
  );

  const handleReport = useCallback(
    async (postId: string, category: string): Promise<boolean> => {
      setBusy(true);
      try {
        const ok = await reportPostContent(postId, category, category);
        if (ok) {
          toast.success(t.reportSuccess);
          return true;
        }
        toast.error(t.reportError);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  const handleBlockUser = useCallback(
    async (authorUserId: string): Promise<boolean> => {
      if (!authorUserId) return false;
      setBusy(true);
      try {
        const ok = await requestBlockUser(authorUserId);
        if (ok) {
          toast.success(t.blockSuccess);
          return true;
        }
        toast.error(t.blockError);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  return {
    isAdmin,
    isAuthenticated: !!user,
    busy,
    handleModeratorDelete,
    handleNotInterested,
    handleReport,
    handleBlockUser,
  };
}
