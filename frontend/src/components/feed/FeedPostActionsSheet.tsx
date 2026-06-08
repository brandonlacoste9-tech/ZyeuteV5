import { useState } from "react";
import { IoShieldOutline } from "react-icons/io5";
import {
  useFeedPostActions,
  type FeedActionSource,
  type FeedActionsLang,
} from "@/hooks/useFeedPostActions";

const LANG_KEY = "zyeute_feed_actions_lang";

function readLang(): FeedActionsLang {
  try {
    return sessionStorage.getItem(LANG_KEY) === "en" ? "en" : "fr";
  } catch {
    return "fr";
  }
}

function persistLang(lang: FeedActionsLang) {
  try {
    sessionStorage.setItem(LANG_KEY, lang);
  } catch {
    /* sessionStorage unavailable */
  }
}

const COPY = {
  fr: {
    close: "Fermer",
    title: "Options",
    notInterested: "Pas intéressé",
    report: "Signaler ce contenu",
    block: "Bloquer ce créateur",
    modDelete: "Supprimer (modération)",
    cancel: "Annuler",
    chooseReason: "Choisis une raison",
    back: "Retour",
    reasons: [
      { id: "spam", label: "Spam ou trompeur" },
      { id: "nudity", label: "Nudité / contenu adulte" },
      { id: "violence", label: "Violence" },
      { id: "harassment", label: "Harcèlement" },
      { id: "other", label: "Autre" },
    ],
  },
  en: {
    close: "Close",
    title: "Options",
    notInterested: "Not interested",
    report: "Report content",
    block: "Block creator",
    modDelete: "Delete (moderation)",
    cancel: "Cancel",
    chooseReason: "Choose a reason",
    back: "Back",
    reasons: [
      { id: "spam", label: "Spam or misleading" },
      { id: "nudity", label: "Nudity / adult content" },
      { id: "violence", label: "Violence" },
      { id: "harassment", label: "Harassment" },
      { id: "other", label: "Other" },
    ],
  },
} as const;

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
  const [lang, setLang] = useState<FeedActionsLang>(readLang);
  const t = COPY[lang];
  const {
    isAdmin,
    isAuthenticated,
    busy,
    handleModeratorDelete,
    handleNotInterested,
    handleReport,
    handleBlockUser,
  } = useFeedPostActions(source, lang);
  const [showReportReasons, setShowReportReasons] = useState(false);

  if (!open) return null;

  const setLanguage = (next: FeedActionsLang) => {
    setLang(next);
    persistLang(next);
  };

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
        aria-label={t.close}
        onClick={close}
      />
      <div className="rounded-t-2xl bg-zinc-900 border-t border-gold-500/30 p-4 pb-safe max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gold-400 font-bold text-sm">{t.title}</p>
          <div
            className="flex text-[10px] font-semibold rounded-md border border-gold-500/30 overflow-hidden"
            role="group"
            aria-label="Language"
          >
            {(["fr", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                className={`px-2 py-0.5 uppercase transition-colors ${
                  lang === code
                    ? "bg-gold-500/20 text-gold-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {!showReportReasons ? (
          <div className="space-y-2">
            {isAuthenticated ? (
              <button
                type="button"
                disabled={busy}
                onClick={onNotInterested}
                className="w-full py-2.5 rounded-xl bg-white/5 text-left px-3 text-sm text-white border border-white/10 hover:border-gold-500/40"
              >
                {t.notInterested}
              </button>
            ) : null}

            <button
              type="button"
              disabled={busy}
              onClick={() => setShowReportReasons(true)}
              className="w-full py-2.5 rounded-xl bg-white/5 text-left px-3 text-sm text-white border border-white/10 hover:border-red-500/40"
            >
              {t.report}
            </button>

            {authorUserId ? (
              <button
                type="button"
                disabled={busy}
                onClick={onBlock}
                className="w-full py-2.5 rounded-xl bg-red-950/50 text-red-200 text-sm font-semibold border border-red-500/30"
              >
                {t.block}
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
                {t.modDelete}
              </button>
            ) : null}

            <button
              type="button"
              onClick={close}
              className="w-full py-2 text-zinc-500 text-sm"
            >
              {t.cancel}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-zinc-400 mb-2 text-center">
              {t.chooseReason}
            </p>
            {t.reasons.map((r) => (
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
              {t.back}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
