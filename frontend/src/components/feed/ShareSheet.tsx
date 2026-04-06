import { useCallback } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  postId: string;
  title?: string;
};

export function ShareSheet({ open, onClose, postId, title }: Props) {
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${postId}`;

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* */
    }
    onClose();
  }, [url, onClose]);

  const native = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title || "Zyeuté",
          text: "Regarde ça sur Zyeuté!",
          url,
        });
      }
    } catch {
      /* cancelled */
    }
    onClose();
  }, [url, title, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160] flex flex-col justify-end bg-black/60">
      <button
        type="button"
        className="flex-1 cursor-default"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="rounded-t-2xl bg-zinc-900 border-t border-gold-500/20 p-4 pb-safe">
        <p className="text-center text-gold-500 font-bold text-sm mb-3">
          Partager
        </p>
        <div className="space-y-2">
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              type="button"
              onClick={native}
              className="w-full py-3 rounded-xl bg-gold-500 text-black font-bold"
            >
              Partager via…
            </button>
          )}
          <button
            type="button"
            onClick={copy}
            className="w-full py-3 rounded-xl border border-gold-500/40 text-gold-200 font-semibold"
          >
            Copier le lien
          </button>
          <p className="text-[10px] text-zinc-500 break-all px-1">{url}</p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-zinc-400 text-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
