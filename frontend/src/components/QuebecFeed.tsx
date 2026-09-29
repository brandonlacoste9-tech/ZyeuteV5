/**
 * QuebecFeed — "Ce qui se passe au Québec"
 *
 * Live section powered by the Qlub.social public timeline (standard Mastodon
 * API, no auth required). Gives Zyeuté visitors a living Québec feed on day
 * one. Every post is credited to its author with a link back to the original
 * on Qlub — that's the fediverse etiquette.
 */
import React from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { logger } from "@/lib/logger";

const feedLogger = logger.withContext("QuebecFeed");

const QLUB_API =
  "https://qlub.social/api/v1/timelines/public?local=true&limit=12";

interface QlubAccount {
  display_name: string;
  username: string;
  acct: string;
  avatar: string;
}

interface QlubMedia {
  type: string;
  preview_url: string;
  url: string;
}

interface QlubStatus {
  id: string;
  created_at: string;
  content: string;
  url: string;
  account: QlubAccount;
  media_attachments: QlubMedia[];
}

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || "").trim().replace(/\s+/g, " ");
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[270px] leather-card rounded-xl p-3 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-full bg-white/10" />
        <div className="flex-1">
          <div className="h-3 w-24 rounded bg-white/10 mb-1" />
          <div className="h-2 w-16 rounded bg-white/10" />
        </div>
      </div>
      <div className="h-3 rounded bg-white/10 mb-1" />
      <div className="h-3 rounded bg-white/10 w-4/5" />
    </div>
  );
}

export const QuebecFeed: React.FC = () => {
  const [posts, setPosts] = React.useState<QlubStatus[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch(QLUB_API);
      if (!res.ok) throw new Error(`Qlub API: HTTP ${res.status}`);
      const data = (await res.json()) as QlubStatus[];
      setPosts(Array.isArray(data) ? data.slice(0, 12) : []);
    } catch (err) {
      feedLogger.warn("Impossible de charger le fil Qlub", { err });
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="mb-6" aria-label="Ce qui se passe au Québec">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-gold-400 font-bold embossed flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
          </span>
          <span>Ce qui se passe au Québec</span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-leather-400 text-xs">en direct de Qlub</span>
          <button
            type="button"
            onClick={load}
            disabled={isLoading}
            className="btn-leather rounded-full p-1.5 disabled:opacity-50"
            aria-label="Actualiser le fil Québec"
          >
            <RefreshCw
              className={`w-4 h-4 text-gold-400 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2 gold-scrollbar">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : hasError ? (
        <div className="leather-card rounded-xl p-4 text-center stitched">
          <p className="text-leather-300 text-sm mb-2">
            Le fil du Québec ne répond pas pour l&apos;instant.
          </p>
          <button
            type="button"
            onClick={load}
            className="btn-gold px-4 py-2 rounded-xl text-sm"
          >
            Réessayer
          </button>
        </div>
      ) : posts.length === 0 ? null : (
        <div className="flex gap-3 overflow-x-auto pb-2 gold-scrollbar">
          {posts.map((post) => {
            const text = stripHtml(post.content);
            const image = post.media_attachments?.find(
              (m) => m.type === "image",
            );
            const author = post.account;
            return (
              <article
                key={post.id}
                className="flex-shrink-0 w-[270px] leather-card rounded-xl p-3 stitched-subtle flex flex-col"
              >
                <div className="flex items-center gap-2 mb-2">
                  {author.avatar ? (
                    <img
                      src={author.avatar}
                      alt={author.display_name || author.username}
                      className="w-9 h-9 rounded-full object-cover border border-leather-600"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-leather-800 flex items-center justify-center text-xs font-bold text-gold-500">
                      {(author.display_name || author.username || "?")[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-bold truncate">
                      {author.display_name || author.username}
                    </div>
                    <div className="text-leather-400 text-[11px] truncate">
                      @{author.acct} · {timeAgo(post.created_at)}
                    </div>
                  </div>
                </div>
                {text && (
                  <p className="text-leather-100 text-[13px] leading-snug line-clamp-4 mb-2 flex-shrink-0">
                    {text}
                  </p>
                )}
                {image && (
                  <img
                    src={image.preview_url || image.url}
                    alt=""
                    className="w-full h-28 object-cover rounded-lg mb-2"
                    loading="lazy"
                  />
                )}
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto pt-1 text-gold-400 hover:text-gold-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  Voir sur Qlub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default QuebecFeed;
