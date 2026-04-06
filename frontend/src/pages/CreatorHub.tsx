/**
 * Creator tools: lightweight analytics (stub + API-ready) and text drafts.
 */
import React from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { loadDrafts, removeDraft, type DraftPost } from "@/lib/draftPosts";
import { BottomNav } from "@/components/BottomNav";

export default function CreatorHub() {
  const [tab, setTab] = React.useState<"stats" | "drafts">("stats");
  const [drafts, setDrafts] = React.useState<DraftPost[]>([]);

  React.useEffect(() => {
    setDrafts(loadDrafts());
  }, [tab]);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <Header title="Créateur" showBack />
      <div className="px-4 pt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("stats")}
          className={`flex-1 py-2 rounded-xl text-sm font-bold ${
            tab === "stats"
              ? "bg-gold-500 text-black"
              : "bg-white/10 text-zinc-300"
          }`}
        >
          Statistiques
        </button>
        <button
          type="button"
          onClick={() => setTab("drafts")}
          className={`flex-1 py-2 rounded-xl text-sm font-bold ${
            tab === "drafts"
              ? "bg-gold-500 text-black"
              : "bg-white/10 text-zinc-300"
          }`}
        >
          Brouillons
        </button>
      </div>

      <div className="p-4">
        {tab === "stats" ? (
          <div className="space-y-4">
            <p className="text-zinc-400 text-sm">
              Aperçu des performances (données détaillées branchées sur l’API
              analytics quand disponible).
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Vues (7j)", value: "—" },
                { label: "Complétions", value: "—" },
                { label: "Partages", value: "—" },
                { label: "Profil", value: "—" },
              ].map((c) => (
                <div
                  key={c.label}
                  className="rounded-xl border border-gold-500/20 p-4 bg-zinc-900/80"
                >
                  <p className="text-2xl font-black text-gold-400">{c.value}</p>
                  <p className="text-xs text-zinc-500 mt-1">{c.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
              Trafic par source · à venir
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.length === 0 ? (
              <p className="text-zinc-500 text-sm">
                Aucun brouillon. Sur{" "}
                <Link to="/upload" className="text-gold-400 underline">
                  Téléverser
                </Link>
                , enregistre une légende comme brouillon (bientôt intégré au
                flux d’upload).
              </p>
            ) : (
              drafts.map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl border border-white/10 p-3 flex justify-between gap-2"
                >
                  <div>
                    <p className="text-sm text-white line-clamp-2">{d.caption}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {new Date(d.savedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeDraft(d.id);
                      setDrafts(loadDrafts());
                    }}
                    className="text-red-400 text-xs shrink-0"
                  >
                    Supprimer
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="px-4 mt-6 space-y-2 text-sm text-zinc-500">
        <p>
          <strong className="text-zinc-300">Attribution :</strong> si ton
          contenu reprend une tendance ou un son, cite la source dans la
          légende (#tendance + lien).
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
