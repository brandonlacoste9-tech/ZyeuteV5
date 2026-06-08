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

export function useFeedPostActions(source: FeedActionSource = "feed") {
  const { isAdmin, user } = useAuth();
  const { impact } = useHaptics();
  const [busy, setBusy] = useState(false);

  const handleModeratorDelete = useCallback(
    async (postId: string): Promise<boolean> => {
      if (!isAdmin) return false;
      if (
        !window.confirm(
          "Supprimer définitivement cette publication du fil? Cette action est irréversible.",
        )
      ) {
        return false;
      }
      setBusy(true);
      try {
        const ok = await moderatorDeletePost(postId, source);
        if (ok) {
          toast.success("Publication retirée par modération");
          impact();
          return true;
        }
        toast.error("Échec de la suppression modération");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [isAdmin, impact, source],
  );

  const handleNotInterested = useCallback(
    async (postId: string): Promise<boolean> => {
      if (!user) {
        toast.error("Connexion requise");
        return false;
      }
      setBusy(true);
      try {
        const ok = await markPostNotInterested(postId);
        if (ok) {
          toast.success("Tu verras moins de contenu comme ça");
          return true;
        }
        toast.error("Impossible de masquer ce contenu");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [user],
  );

  const handleReport = useCallback(
    async (postId: string, category: string): Promise<boolean> => {
      setBusy(true);
      try {
        const ok = await reportPostContent(postId, category, category);
        if (ok) {
          toast.success("Merci — notre équipe va examiner ce contenu.");
          return true;
        }
        toast.error("Connexion requise ou erreur serveur.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const handleBlockUser = useCallback(
    async (authorUserId: string): Promise<boolean> => {
      if (!authorUserId) return false;
      setBusy(true);
      try {
        const ok = await requestBlockUser(authorUserId);
        if (ok) {
          toast.success("Demande de blocage enregistrée.");
          return true;
        }
        toast.error("Impossible d'enregistrer le blocage.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [],
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
