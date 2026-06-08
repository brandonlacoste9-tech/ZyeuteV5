import { useState } from "react";
import { IoShieldOutline } from "react-icons/io5";
import {
  useFeedPostActions,
  type FeedActionSource,
} from "@/hooks/useFeedPostActions";

const REASONS = [
  { id: "spam", label: "Spam ou trompeur" },
  { id: "nudity", label: "Nudité / contenu adulte" },
  { id: "violence", label: "Violence" },
  { id: "harassment", label: "Harcèlement" },
  { id: "other", label: "Autre" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  postId: string;
  authorUserId?: string;
  source?: FeedActionSource;
  onPostRemoved?: (postId: string) => void;
};

export function FeedPostActionsSheet({
  open,
  onClose,
  postId,
  authorUserId,
  source = "feed",
  onPostRemoved,
}: Props) {
  const {
    isAdmin,
    isAuthenticated,
    busy,
    handleModeratorDelete,
    handleNotInterested,
    handleReport,
    handleBlockUser,
  } = useFeedPostActions(source);
  const [showReportReasons, setShowReportReasons] = useState(false);

  if (!open) return null;

  const close = () => {
    setShowReportReasons(false);
    onClose();
  };

  const onNotInterested = async () => {
    const ok = await handleNotInterested(postId);
    if (ok) {
      onPostRemoved?.(postId);
      close();
    }
  };

  const onModDelete = async () => {
    const ok = await handleModeratorDelete(postId);
    if (ok) {
      onPostRemoved?.(postId);
      close();
    }
  };

  const onReport = async (category: string) => {
    const ok = await handleReport(postId, category);
    if (ok) close();
  };

  const onBlock = async () => {
    if (!authorUserId) return;
    const ok = await handleBlockUser(authorUserId);
    if (ok) close();
  };

  return (
    <div className="fixed inset-0 z-[155] flex flex-col justify-end bg-black/70">
      <button
        type="button"
        className="flex-1 cursor-default"
        aria-label="Fermer"
        onClick={close}
      />
      <div className="rounded-t-2xl bg-zinc-900 border-t border-gold-500/30 p-4 pb-safe max-h-[80vh] overflow-y-auto">
        <p className="text-center text-gold-400 font-bold text-sm mb-3">
          Options
        </p>

        {!showReportReasons ? (
          <div className="space-y-2">
            {isAuthenticated ? (
              <button
                type="button"
                disabled={busy}
                onClick={onNotInterested}
                className="w-full py-2.5 rounded-xl bg-white/5 text-left px-3 text-sm text-white border border-white/10 hover:border-gold-500/40"
              >
                Pas intéressé
              </button>
            ) : null}

            <button
              type="button"
              disabled={busy}
              onClick={() => setShowReportReasons(true)}
              className="w-full py-2.5 rounded-xl bg-white/5 text-left px-3 text-sm text-white border border-white/10 hover:border-red-500/40"
            >
              Signaler ce contenu
            </button>

            {authorUserId ? (
              <button
                type="button"
                disabled={busy}
                onClick={onBlock}
                className="w-full py-2.5 rounded-xl bg-red-950/50 text-red-200 text-sm font-semibold border border-red-500/30"
              >
                Bloquer ce créateur
              </button>
            ) : null}

            {isAdmin ? (
              <button
                type="button"
                disabled={busy}
                onClick={onModDelete}
                className="w-full py-2.5 rounded-xl bg-orange-950/80 text-orange-200 text-sm font-semibold border border-orange-500/50 flex items-center justify-center gap-2"
              >
                <IoShieldOutline className="w-4 h-4" />
                Supprimer (modération)
              </button>
            ) : null}

            <button
              type="button"
              onClick={close}
              className="w-full py-2 text-zinc-500 text-sm"
            >
              Annuler
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-zinc-400 mb-2 text-center">
              Choisis une raison
            </p>
            {REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                disabled={busy}
                onClick={() => onReport(r.id)}
                className="w-full py-2.5 rounded-xl bg-white/5 text-left px-3 text-sm text-white border border-white/10 hover:border-gold-500/40"
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowReportReasons(false)}
              className="w-full py-2 text-zinc-500 text-sm"
            >
              Retour
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
