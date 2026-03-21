/**
 * 🍁 TikTok Curation Dashboard
 * Allows finding and importing TikTok videos directly into Zyeuté V5
 */

import React, { useState } from "react";
import {
  Search,
  Download,
  CheckCircle2,
  Loader2,
  ExternalLink,
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TikTokVideo {
  video_id: string;
  caption: string;
  author: { handle: string; nickname: string; avatar: string };
  thumbnails: { cover_url: string };
  media: { video_url: string; hd_video_url: string };
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
      // In a real app, this would call your backend API which proxies to Omkar/TikTok API
      // For this demo, we'll simulate the search results based on the Omkar schema
      const response = await fetch(
        `/api/tiktok/search?q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) throw new Error("Échec de la recherche");
      const data = await response.json();
      setResults(data.videos || []);
    } catch (error) {
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
      const response = await fetch("/api/tiktok/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url:
            video.original_url ||
            `https://www.tiktok.com/@${video.author.handle}/video/${video.video_id}`,
          metadata: video,
        }),
      });

      if (!response.ok) throw new Error("Échec de l'importation");

      setImportedIds((prev) => new Set(prev).add(video.video_id));
      toast({
        title: "Vidéo importée !",
        description: "La vidéo est maintenant disponible dans le feed Zyeuté.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'importation",
        description: "Impossible d'ajouter cette vidéo au projet.",
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
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <Card className="bg-zinc-900 border-zinc-800 text-white shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-500 rounded-lg">
              <Search className="text-black" size={24} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Curation TikTok
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Trouvez et importez les meilleures vidéos pour la communauté
                Zyeuté.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              placeholder="Rechercher par mot-clé ou hashtag (ex: #quebec, poutine...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
            />
            <Button
              type="submit"
              disabled={isSearching}
              className="bg-gold-500 hover:bg-gold-600 text-black font-bold px-8 h-12"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((video) => (
            <Card
              key={video.video_id}
              className="bg-zinc-900 border-zinc-800 overflow-hidden group hover:border-gold-500/50 transition-all duration-300"
            >
              <div className="relative aspect-[9/16] bg-black">
                <img
                  src={video.thumbnails.cover_url}
                  alt={video.caption}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <img
                    src={video.author.avatar}
                    className="w-8 h-8 rounded-full border border-white/20"
                    alt=""
                  />
                  <span className="text-white text-xs font-bold shadow-sm">
                    @{video.author.handle}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 space-y-3">
                  <p className="text-white text-sm line-clamp-2 font-medium leading-snug">
                    {video.caption}
                  </p>
                  <div className="flex items-center gap-4 text-white/60 text-[10px] font-bold uppercase tracking-wider">
                    <span>{video.stats.views.toLocaleString()} Vues</span>
                    <span>{video.stats.likes.toLocaleString()} J'aime</span>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full w-12 h-12 bg-white/10 backdrop-blur-md hover:bg-white/20"
                    onClick={() =>
                      window.open(
                        `https://www.tiktok.com/@${video.author.handle}/video/${video.video_id}`,
                        "_blank",
                      )
                    }
                  >
                    <Play fill="white" className="text-white ml-1" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4 bg-zinc-900">
                <Button
                  className={cn(
                    "w-full font-bold transition-all",
                    importedIds.has(video.video_id)
                      ? "bg-green-600 hover:bg-green-600 text-white cursor-default"
                      : "bg-zinc-800 hover:bg-gold-500 hover:text-black text-white",
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
          <p>Aucune vidéo trouvée pour "{query}".</p>
          <p className="text-sm">Essayez un autre mot-clé ou hashtag.</p>
        </div>
      )}
    </div>
  );
}
