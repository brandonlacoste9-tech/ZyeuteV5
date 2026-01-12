/**
 * Pexels Gallery - Browse Pexels photo and video collections
 * Clean, simple gallery to test Pexels integration
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import {
  getPexelsCollection,
  type PexelsPhoto,
  type PexelsVideo,
} from "@/services/api";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";
import { Image } from "@/components/Image";

export const PexelsGallery: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tap } = useHaptics();

  const [collectionId, setCollectionId] = useState(
    searchParams.get("id") || "featured",
  );
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [videos, setVideos] = useState<PexelsVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionTitle, setCollectionTitle] = useState<string>("");

  useEffect(() => {
    const loadCollection = async () => {
      if (!collectionId) return;

      setIsLoading(true);
      setError(null);

      try {
        const collection = await getPexelsCollection(collectionId, 30);

        if (!collection) {
          setError("Collection introuvable ou erreur de chargement");
          setIsLoading(false);
          return;
        }

        setCollectionTitle(collection.title || "Collection Pexels");
        setPhotos(collection.photos || []);
        setVideos(collection.videos || []);
      } catch (err) {
        console.error("Pexels collection error:", err);
        setError("Erreur lors du chargement de la collection");
        toast.error("Impossible de charger la collection");
      } finally {
        setIsLoading(false);
      }
    };

    loadCollection();
  }, [collectionId]);

  const handleMediaClick = (media: PexelsPhoto | PexelsVideo) => {
    tap();
    // Navigate to upload page with the media URL
    if ("src" in media) {
      // It's a photo
      navigate(`/upload?mediaUrl=${encodeURIComponent(media.src.large)}`);
    } else {
      // It's a video - use the first video file
      const videoUrl = media.video_files?.[0]?.link || media.image;
      navigate(`/upload?mediaUrl=${encodeURIComponent(videoUrl)}`);
    }
  };

  const allMedia = [
    ...photos.map((p) => ({ ...p, type: "photo" as const })),
    ...videos.map((v) => ({ ...v, type: "video" as const })),
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header title="Pexels Gallery" showBack />

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Collection Selector */}
        <div className="leather-card rounded-2xl p-4 stitched">
          <label className="block text-gold-400 font-bold mb-2">
            Collection ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              placeholder="featured, nature, people..."
              className="flex-1 px-4 py-2 bg-zinc-900 border border-gold-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            />
            <button
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set("id", collectionId);
                navigate(`/pexels?${newParams.toString()}`, { replace: true });
                window.location.reload(); // Simple reload to trigger useEffect
              }}
              className="px-6 py-2 bg-gold-gradient text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Charger
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Essayez: featured, nature, people, animals, travel, food
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-gold-500 text-4xl mb-4">
              ⚙️
            </div>
            <p className="text-white">Chargement de la collection...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="leather-card rounded-2xl p-6 text-center">
            <p className="text-red-400 font-bold text-lg mb-2">❌ Erreur</p>
            <p className="text-stone-300">{error}</p>
          </div>
        )}

        {/* Collection Info */}
        {!isLoading && !error && collectionTitle && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gold-400 mb-2">
              {collectionTitle}
            </h2>
            <p className="text-stone-400">
              {photos.length} photos • {videos.length} vidéos
            </p>
          </div>
        )}

        {/* Media Grid */}
        {!isLoading && !error && allMedia.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {allMedia.map((media) => {
              const isVideo = media.type === "video";
              const thumbnailUrl = isVideo
                ? media.image
                : (media as PexelsPhoto).src.medium;

              return (
                <button
                  key={media.id}
                  onClick={() => handleMediaClick(media)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border-2 border-gold-500/20 hover:border-gold-500/50 transition-all group"
                >
                  <Image
                    src={thumbnailUrl}
                    alt={
                      isVideo
                        ? "Pexels video"
                        : (media as PexelsPhoto).alt || "Pexels photo"
                    }
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />

                  {/* Video Badge */}
                  {isVideo && (
                    <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                      <span>▶</span>
                      <span>
                        {Math.round((media as PexelsVideo).duration)}s
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      {isVideo ? "📹 Vidéo" : "📸 Photo"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && allMedia.length === 0 && (
          <div className="text-center py-12 leather-card rounded-2xl p-6">
            <p className="text-stone-400 text-lg">
              Aucun média dans cette collection
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PexelsGallery;
