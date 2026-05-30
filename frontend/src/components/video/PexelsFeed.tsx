/**
 * PexelsFeed - Search and browse Pexels stock videos
 * Zyeuté V5 - Quebec social media
 */

import { useState, useCallback } from "react";
import { Search, Loader2, Film, ExternalLink } from "lucide-react";
import { apiCall } from "@/services/api";
import { cn } from "@/lib/utils";

interface PexelsVideoFile {
  id: string;
  quality: "hd" | "sd" | "hls";
  file_type: string;
  link: string;
}

interface PexelsVideo {
  id: string;
  url: string;
  image: string;
  video_files: PexelsVideoFile[];
  duration: number;
  width: number;
  height: number;
  user: { name: string; url: string };
}

interface PexelsFeedProps {
  onSelectVideo: (video: {
    pexelsId: string;
    videoUrl: string;
    thumbnail: string;
    duration: number;
    width: number;
    height: number;
  }) => void;
}

export function PexelsFeed({ onSelectVideo }: PexelsFeedProps) {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<PexelsVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchVideos = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    const { data, error } = await apiCall<{ videos: PexelsVideo[] }>(
      `/pexels/search?query=${encodeURIComponent(searchQuery)}&per_page=15&page=1`,
    );

    if (error) {
      setVideos([]);
    } else {
      setVideos(data?.videos || []);
    }

    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchVideos(query);
  };

  const getBestVideoUrl = (video: PexelsVideo): string => {
    const hd = video.video_files.find((f) => f.quality === "hd");
    const sd = video.video_files.find((f) => f.quality === "sd");
    const hls = video.video_files.find((f) => f.quality === "hls");
    return hd?.link || sd?.link || hls?.link || video.video_files[0]?.link || "";
  };

  const handleSelect = (video: PexelsVideo) => {
    const videoUrl = getBestVideoUrl(video);
    if (videoUrl) {
      onSelectVideo({
        pexelsId: String(video.id),
        videoUrl,
        thumbnail: video.image,
        duration: video.duration,
        width: video.width || 1920,
        height: video.height || 1080,
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-leather-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher des vidéos (nature, ville, musique...)"
            className="input-premium w-full pl-10"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="btn-gold px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Rechercher"
          )}
        </button>
      </form>

      {!hasSearched && (
        <div className="text-center py-12 text-leather-400">
          <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Recherche des vidéos libres de droits</p>
          <p className="text-sm mt-2">
            Des milliers de vidéos HD gratuites via Pexels
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        </div>
      )}

      {!isLoading && hasSearched && videos.length === 0 && (
        <div className="text-center py-12 text-leather-400">
          <p>Aucune vidéo trouvée pour &quot;{query}&quot;</p>
        </div>
      )}

      {!isLoading && videos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-1 gold-scrollbar">
          {videos.map((video) => (
            <button
              key={video.id}
              onClick={() => handleSelect(video)}
              className="group relative aspect-9/16 rounded-xl overflow-hidden bg-leather-900 hover:ring-2 hover:ring-gold-500 transition-all"
            >
              <img
                src={video.image}
                alt={`Vidéo par ${video.user.name}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white truncate">{video.user.name}</p>
                <p className="text-xs text-leather-400">
                  {video.duration}s • {video.width}x{video.height}
                </p>
              </div>
              {video.video_files.some((f) => f.quality === "hd") && (
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-gold-500 text-black text-xs font-bold rounded">
                  HD
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <p className="text-xs text-center text-leather-500">
          Vidéos fournies par{" "}
          <a
            href="https://www.pexels.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-500 hover:underline inline-flex items-center gap-1"
          >
            Pexels <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      )}
    </div>
  );
}
