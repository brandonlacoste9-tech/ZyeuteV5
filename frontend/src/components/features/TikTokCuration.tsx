/**
 * TikTok curation dashboard — search/import via backend (Bearer auth, staff-only).
 */

import React, { useState } from "react";
import {
  Search,
  Download,
  CheckCircle2,
  Loader2,
  Play,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiCall } from "@/services/api";

interface TikTokVideo {
  video_id: string;
  caption: string;
  author: { handle: string; nickname: string; avatar: string };
  thumbnails: { cover_url: string };
  media: { video_url: string; hd_video_url?: string };
  stats: { likes: number; views: number; shares: number };
  original_url?: string;
}

export function TikTokCuration() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<TikTokVideo[]>([]);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await apiCall<{ videos: TikTokVideo[] }>(
        `/tiktok/search?q=${encodeURIComponent(query.trim())}`,
      );
      if (error) throw new Error(error);
      setResults(data?.videos || []);
      if (!data?.videos?.length) {
        toast({
          title: "Aucun résultat",
          description:
            "Essaie un autre mot-clé, ou vérifie TIKTOK_SCRAPER_API_KEY sur le serveur.",
        });
      }
    } catch {
      toast({
        title: "Erreur de recherche",
        description: "Impossible de contacter le service de curation TikTok.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (video: TikTokVideo) => {
    setImportingIds((prev) => new Set(prev).add(video.video_id));

    try {
      const { error } = await apiCall<{ post?: { id: string } }>(
        "/tiktok/import",
        {
          method: "POST",
          body: JSON.stringify({
            video,
            video_url:
              video.original_url ||
              `https://www.tiktok.com/@${video.author.handle}/video/${video.video_id}`,
            metadata: video,
          }),
        },
      );

      if (error) throw new Error(error);

      setImportedIds((prev) => new Set(prev).add(video.video_id));
      toast({
        title: "Vidéo importée !",
        description: "La vidéo est maintenant disponible dans le fil Zyeuté.",
      });
    } catch {
      toast({
        title: "Erreur d'importation",
        description: "Impossible d'ajouter cette vidéo.",
        variant: "destructive",
      });
    } finally {
      setImportingIds((prev) => {
        const next = new Set(prev);
        next.delete(video.video_id);
        return next;
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <Card className="border-zinc-800 bg-zinc-900 text-white shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-600 p-2">
              <Search className="text-black" size={24} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Curation TikTok
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Trouve et importe des vidéos (compte équipe requis). Clé serveur
                : TIKTOK_SCRAPER_API_KEY.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              placeholder="Mot-clé ou hashtag (ex: #quebec, poutine...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
            />
            <Button
              type="submit"
              disabled={isSearching}
              className="h-12 bg-amber-600 px-8 font-bold text-black hover:bg-amber-500"
            >
              {isSearching ? (
                <Loader2 className="animate-spin" />
              ) : (
                "RECHERCHER"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((video) => (
            <Card
              key={video.video_id}
              className="group overflow-hidden border-zinc-800 bg-zinc-900 transition-all duration-300 hover:border-amber-600/50"
            >
              <div className="relative aspect-[9/16] bg-black">
                <img
                  src={video.thumbnails.cover_url}
                  alt={video.caption}
                  className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                <div className="absolute left-3 top-3 flex items-center gap-2">
                  <img
                    src={video.author.avatar}
                    className="h-8 w-8 rounded-full border border-white/20"
                    alt=""
                  />
                  <span className="text-xs font-bold text-white shadow-sm">
                    @{video.author.handle}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 space-y-3">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-white">
                    {video.caption}
                  </p>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-white/60">
                    <span>{video.stats.views.toLocaleString()} vues</span>
                    <span>{video.stats.likes.toLocaleString()} j&apos;aime</span>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    type="button"
                    className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20"
                    onClick={() =>
                      window.open(
                        `https://www.tiktok.com/@${video.author.handle}/video/${video.video_id}`,
                        "_blank",
                      )
                    }
                  >
                    <Play fill="white" className="ml-1 text-white" />
                  </Button>
                </div>
              </div>
              <CardContent className="bg-zinc-900 p-4">
                <Button
                  type="button"
                  className={cn(
                    "w-full font-bold transition-all",
                    importedIds.has(video.video_id)
                      ? "cursor-default bg-green-600 text-white hover:bg-green-600"
                      : "bg-zinc-800 text-white hover:bg-amber-600 hover:text-black",
                  )}
                  disabled={
                    importingIds.has(video.video_id) ||
                    importedIds.has(video.video_id)
                  }
                  onClick={() => handleImport(video)}
                >
                  {importingIds.has(video.video_id) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      IMPORTATION...
                    </>
                  ) : importedIds.has(video.video_id) ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> DÉJÀ SUR ZYEUTÉ
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" /> IMPORTER SUR ZYEUTÉ
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {results.length === 0 && !isSearching && query && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <AlertCircle size={48} className="mb-4 opacity-20" />
          <p>Aucune vidéo trouvée pour &quot;{query}&quot;.</p>
          <p className="text-sm">Essaie un autre mot-clé ou hashtag.</p>
        </div>
      )}
    </div>
  );
}
