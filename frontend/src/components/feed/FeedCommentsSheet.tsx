import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getPostComments, addComment } from "@/services/api";
import type { Comment } from "@/types";
import { toast } from "@/components/Toast";
import { SubscriberBadge } from "@/components/ui/SubscriberBadge";

type Props = {
  open: boolean;
  onClose: () => void;
  postId: string;
  canComment: boolean;
};

export function FeedCommentsSheet({
  open,
  onClose,
  postId,
  canComment,
}: Props) {
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !postId) return;
    setTimeout(() => {
      setLoading(true);
      getPostComments(postId)
        .then(setItems)
        .finally(() => setLoading(false));
    }, 0);
  }, [open, postId]);

  const send = async () => {
    const t = text.trim();
    if (!t || !canComment) return;
    setSending(true);
    const c = await addComment(postId, t);
    setSending(false);
    if (c) {
      setItems((prev) => [...prev, c]);
      setText("");
      toast.success("Commentaire envoyé");
    } else {
      toast.error("Impossible d’envoyer le commentaire");
    }
  };

  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[150] flex flex-col justify-end md:flex-row">
          <motion.button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default bg-black/80 backdrop-blur-sm"
            aria-label="Fermer"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="leather-overlay relative flex max-h-[70vh] w-full flex-col rounded-t-2xl border-t border-gold-500/30 shadow-[0_-8px_40px_rgba(0,0,0,0.7)] md:h-full md:max-h-full md:w-[400px] md:rounded-t-none md:rounded-l-2xl md:border-t-0 md:border-l"
            initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { type: "spring", damping: 32, stiffness: 360 }
            }
          >
            <div className="flex justify-center pt-2.5 pb-1 md:hidden">
              <span className="h-1 w-10 rounded-full bg-gold-500/40" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-gold-400 font-bold text-sm tracking-wide uppercase">
                Commentaires
              </span>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-lg px-2 text-zinc-400 text-sm transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60"
              >
                Fermer
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
              {loading ? (
                <p className="text-zinc-500 text-sm text-center py-8">
                  Chargement…
                </p>
              ) : items.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-8">
                  Aucun commentaire pour l’instant.
                </p>
              ) : (
                items.map((c) => (
                  <div key={c.id} className="text-sm">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-gold-500 font-semibold">
                        {(c as any).user?.username || "user"}
                      </span>
                      <SubscriberBadge
                        tier={(c as any).user?.subscription_tier}
                        size="xs"
                      />
                    </div>
                    <p className="text-white/90 mt-0.5">
                      {c.content || c.text || ""}
                    </p>
                  </div>
                ))
              )}
            </div>
            {canComment ? (
              <div className="p-3 border-t border-white/10 flex gap-2 pb-safe">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ajouter un commentaire…"
                  className="min-h-11 flex-1 rounded-xl bg-black/50 border border-gold-500/20 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60"
                  maxLength={500}
                />
                <button
                  type="button"
                  disabled={sending || !text.trim()}
                  onClick={send}
                  className="min-h-11 px-4 rounded-xl bg-gold-500 text-black font-bold text-sm transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 disabled:opacity-40"
                >
                  Envoyer
                </button>
              </div>
            ) : (
              <p className="p-3 text-center text-xs text-zinc-500 border-t border-white/10">
                Connecte-toi pour commenter.
              </p>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
