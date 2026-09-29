/**
 * QuebecFeed — "Ce qui se passe au Québec"
 * Affiche la timeline publique de Qlub.social (le réseau social québécois)
 * directement dans Zyeuté, dans le style cuir & or de l'app.
 *
 * Source : API publique Mastodon de Qlub — aucun auth requis.
 *   GET https://qlub.social/api/v1/timelines/public?local=true&limit=12
 *
 * Étiquette du fédiverse : chaque post est crédité à son auteur avec un
 * lien vers son profil Qlub. Les cartes s'ouvrent en ligne (expand inline)
 * pour garder la lecture à l'intérieur de Zyeuté.
 */
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ChevronDown } from "lucide-react";
import { logger } from "@/lib/logger";

const feedLogger = logger.withContext("QuebecFeed");

const QLUB_API =
  "https://qlub.social/api/v1/timelines/public?local=true&limit=12";
const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

interface QlubAccount {
  id: string;
  username: string;
  acct: string;
  display_name: string;
  url: string;
  avatar: string;
}

interface QlubAttachment {
  id: string;
  type: string;
  url: string;
  preview_url: string;
}

interface QlubStatus {
  id: string;
  created_at: string;
  content: string;
  url: string;
  account: QlubAccount;
  media_attachments: QlubAttachment[];
  favourites_count: number;
  reblogs_count: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function QuebecFeed() {
  const [items, setItems] = useState<QlubStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch(QLUB_API);
      if (!res.ok) throw new Error(`Qlub API: ${res.status}`);
      const data: QlubStatus[] = await res.json();
      setItems(data);
    } catch (err) {
      feedLogger.warn("Impossible de charger le fil Qlub", { err });
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const toggle = (id: string) =>
    setExpandedId((cur) => (cur === id ? null : id));

  return (
    <section aria-label="Ce qui se passe au Québec" className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gold-400 embossed">
            Ce qui se passe au Québec
          </h2>
          <p className="text-xs text-leather-400">
            En direct de{" "}
            <a
              href="https://qlub.social"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-gold-500/40 underline-offset-2 hover:text-gold-300"
            >
              Qlub.social
            </a>{" "}
            — le réseau social québécois
          </p>
        </div>
        <button
          onClick={load}
          aria-label="Actualiser le fil"
          className="p-2 rounded-full btn-leather text-gold-400 hover:text-gold-300 transition-colors"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && items.length === 0 && (
        <div className="flex gap-3 overflow-hidden pb-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="leather-card stitched rounded-2xl p-4 w-72 shrink-0 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-leather-800" />
                <div className="flex-1">
                  <div className="h-3 w-24 rounded bg-leather-800 mb-1.5" />
                  <div className="h-2 w-16 rounded bg-leather-800" />
                </div>
              </div>
              <div className="h-3 w-full rounded bg-leather-800 mb-2" />
              <div className="h-3 w-5/6 rounded bg-leather-800" />
            </div>
          ))}
        </div>
      )}

      {error && items.length === 0 && !loading && (
        <div className="leather-card stitched rounded-2xl p-6 text-center">
          <p className="text-sm text-leather-300 mb-3">
            Le fil du Québec est indisponible pour le moment.
          </p>
          <button
            onClick={load}
            className="px-4 py-2 rounded-xl btn-gold text-sm font-semibold"
          >
            Réessayer
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 gold-scrollbar snap-x">
          {items.map((item) => {
            const expanded = expandedId === item.id;
            const authorName =
              item.account.display_name || `@${item.account.username}`;
            const images = item.media_attachments.filter(
              (a) => a.type === "image"
            );
            const shownImages = expanded ? images : images.slice(0, 1);
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => toggle(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(item.id);
                  }
                }}
                className="leather-card stitched rounded-2xl p-4 w-72 shrink-0 snap-start cursor-pointer hover:border-gold-500/50 transition-colors text-left"
                aria-expanded={expanded}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  {item.account.avatar ? (
                    <img
                      src={item.account.avatar}
                      alt=""
                      loading="lazy"
                      className="w-10 h-10 rounded-full object-cover border border-gold-500/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-leather-800 border border-gold-500/30 flex items-center justify-center text-gold-400 text-sm font-bold">
                      {initials(authorName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <a
                      href={item.account.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block text-sm font-semibold text-white truncate hover:text-gold-300"
                      title={`Voir ${authorName} sur Qlub`}
                    >
                      {authorName}
                    </a>
                    <span className="block text-xs text-leather-400 truncate">
                      @{item.account.acct} · {timeAgo(item.created_at)}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-gold-500/70 transition-transform ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </div>

                <div
                  className={`text-sm text-leather-100 leading-relaxed break-words ${
                    expanded ? "" : "line-clamp-4"
                  } [&_a]:text-gold-300 [&_a]:underline [&_p]:mb-2`}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />

                {shownImages.length > 0 && (
                  <div
                    className={`mt-3 grid gap-2 ${
                      shownImages.length > 1 ? "grid-cols-2" : ""
                    }`}
                  >
                    {shownImages.map((att) => (
                      <img
                        key={att.id}
                        src={att.preview_url || att.url}
                        alt=""
                        loading="lazy"
                        className="rounded-xl object-cover w-full max-h-40 border border-leather-600"
                      />
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-leather-400">
                  <span>
                    {item.reblogs_count > 0 &&
                      `${item.reblogs_count} partages · `}
                    {item.favourites_count > 0 &&
                      `${item.favourites_count} favoris`}
                  </span>
                  <span className="text-gold-500/70">
                    {expanded ? "Réduire" : "Lire plus"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
