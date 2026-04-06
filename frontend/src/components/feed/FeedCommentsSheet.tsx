import { useEffect, useState } from "react";
import {
  getPostComments,
  addComment,
} from "@/services/api";
import type { Comment } from "@/types";
import { toast } from "@/components/Toast";

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
    setLoading(true);
    getPostComments(postId)
      .then(setItems)
      .finally(() => setLoading(false));
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end bg-black/70">
      <button
        type="button"
        className="flex-1 cursor-default"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="max-h-[70vh] flex flex-col rounded-t-2xl bg-zinc-950 border-t border-gold-500/30">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-gold-400 font-bold text-sm">Commentaires</span>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 text-sm"
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
                <span className="text-gold-500 font-semibold">
                  {(c as any).user?.username || "user"}
                </span>
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
              className="flex-1 rounded-xl bg-black/50 border border-gold-500/20 px-3 py-2 text-sm text-white"
              maxLength={500}
            />
            <button
              type="button"
              disabled={sending || !text.trim()}
              onClick={send}
              className="px-4 rounded-xl bg-gold-500 text-black font-bold text-sm disabled:opacity-40"
            >
              Envoyer
            </button>
          </div>
        ) : (
          <p className="p-3 text-center text-xs text-zinc-500 border-t border-white/10">
            Connecte-toi pour commenter.
          </p>
        )}
      </div>
    </div>
  );
}
