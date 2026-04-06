import { useState } from "react";
import { reportPostContent, requestBlockUser } from "@/services/api";
import { toast } from "@/components/Toast";

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
};

export function ReportPostSheet({
  open,
  onClose,
  postId,
  authorUserId,
}: Props) {
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (category: string) => {
    setBusy(true);
    const ok = await reportPostContent(postId, category, category);
    setBusy(false);
    if (ok) {
      toast.success("Merci — notre équipe va examiner ce contenu.");
      onClose();
    } else {
      toast.error("Connexion requise ou erreur serveur.");
    }
  };

  const block = async () => {
    if (!authorUserId) return;
    setBusy(true);
    const ok = await requestBlockUser(authorUserId);
    setBusy(false);
    if (ok) {
      toast.success("Demande de blocage enregistrée.");
      onClose();
    } else {
      toast.error("Impossible d’enregistrer le blocage.");
    }
  };

  return (
    <div className="fixed inset-0 z-[155] flex flex-col justify-end bg-black/70">
      <button
        type="button"
        className="flex-1 cursor-default"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="rounded-t-2xl bg-zinc-900 border-t border-red-500/30 p-4 pb-safe max-h-[80vh] overflow-y-auto">
        <p className="text-center text-gold-400 font-bold text-sm mb-3">
          Signaler ou bloquer
        </p>
        <p className="text-xs text-zinc-400 mb-3 text-center">
          Aide-nous à garder Zyeuté sécuritaire.
        </p>
        <div className="space-y-2">
          {REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              disabled={busy}
              onClick={() => submit(r.id)}
              className="w-full py-2.5 rounded-xl bg-white/5 text-left px-3 text-sm text-white border border-white/10 hover:border-gold-500/40"
            >
              Signaler : {r.label}
            </button>
          ))}
          {authorUserId ? (
            <button
              type="button"
              disabled={busy}
              onClick={block}
              className="w-full py-2.5 rounded-xl bg-red-950/50 text-red-200 text-sm font-semibold border border-red-500/30"
            >
              Bloquer ce créateur
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-zinc-500 text-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
