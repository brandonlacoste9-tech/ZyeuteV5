import { useState } from "react";
import { IoShieldOutline } from "react-icons/io5";
import {
  useFeedPostActions,
  type FeedActionSource,
  type FeedActionsLang,
} from "@/hooks/useFeedPostActions";
import { SheetShell } from "@/components/ui/SheetShell";
import { SheetActionRow } from "@/components/ui/SheetActionRow";

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
    <SheetShell
      open={open}
      onClose={close}
      className="z-[155]"
      panelClassName="max-h-[80vh] overflow-y-auto px-4 pb-safe"
      closeLabel={t.close}
    >
      <div className="mb-3 mt-1 flex items-center justify-between">
        <p className="text-gold-400 font-bold text-sm tracking-wide uppercase">
          {t.title}
        </p>
        <div
          className="flex overflow-hidden rounded-md border border-gold-500/30 text-[10px] font-semibold"
          role="group"
          aria-label="Language"
        >
          {(["fr", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              className={`px-2.5 py-1 uppercase transition-colors ${
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
            <SheetActionRow disabled={busy} onClick={onNotInterested}>
              {t.notInterested}
            </SheetActionRow>
          ) : null}

          <SheetActionRow
            variant="report"
            disabled={busy}
            onClick={() => setShowReportReasons(true)}
          >
            {t.report}
          </SheetActionRow>

          {authorUserId ? (
            <SheetActionRow variant="danger" disabled={busy} onClick={onBlock}>
              {t.block}
            </SheetActionRow>
          ) : null}

          {isAdmin ? (
            <SheetActionRow
              variant="moderation"
              disabled={busy}
              onClick={onModDelete}
              center
              icon={<IoShieldOutline className="h-4 w-4" />}
            >
              {t.modDelete}
            </SheetActionRow>
          ) : null}

          <button
            type="button"
            onClick={close}
            className="w-full py-2 text-zinc-500 text-sm transition-colors hover:text-zinc-300"
          >
            {t.cancel}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="mb-2 text-center text-xs text-zinc-400">
            {t.chooseReason}
          </p>
          {t.reasons.map((r) => (
            <SheetActionRow
              key={r.id}
              variant="report"
              disabled={busy}
              onClick={() => onReport(r.id)}
            >
              {r.label}
            </SheetActionRow>
          ))}
          <button
            type="button"
            onClick={() => setShowReportReasons(false)}
            className="w-full py-2 text-zinc-500 text-sm transition-colors hover:text-zinc-300"
          >
            {t.back}
          </button>
        </div>
      )}
    </SheetShell>
  );
}
