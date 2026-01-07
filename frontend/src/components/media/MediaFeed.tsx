import React, { useState } from "react";
import { useMediaFeed } from "@/hooks/useMediaFeed";
import { MediaFeedItem } from "./MediaFeedItem";
import { MediaViewer } from "./MediaViewer";
import { Media } from "@/types";
import { MapleSpinner } from "@/components/ui/MapleSpinner";
import { ErrorFallback } from "@/components/ErrorBoundary";

export const MediaFeed: React.FC = () => {
  const { items, loadMoreRef, isLoading, isFetchingNextPage, error, refetch } =
    useMediaFeed();
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  // Optimistic update handler for enhance
  const handleEnhanceTriggered = (mediaId: string) => {
    if (selectedMedia && selectedMedia.id === mediaId) {
      setSelectedMedia({ ...selectedMedia, enhanceStatus: "PROCESSING" });
    }
    // Also trigger refetch to update grid
    // refetch(); // Might be too aggressive, better to wait or use queryClient.setQueryData
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh] bg-black">
        <MapleSpinner className="text-gold-500" />
      </div>
    );
  }

  if (error) {
    return <ErrorFallback onRetry={() => refetch()} />;
  }

  return (
    <div className="min-h-screen w-full pb-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Header Spacer if needed or integrated in parent */}

      {/* Grid Feed */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
        {items.map((media) => (
          <MediaFeedItem
            key={media.id}
            media={media}
            onClick={setSelectedMedia}
          />
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-stone-500">
          <p>Aucun média pour le moment.</p>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      <div
        ref={loadMoreRef}
        className="h-20 flex justify-center items-center w-full"
      >
        {isFetchingNextPage && (
          <MapleSpinner size="sm" className="text-gold-500" />
        )}
      </div>

      {/* Modal Viewer */}
      {selectedMedia && (
        <MediaViewer
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onEnhanceTriggered={handleEnhanceTriggered}
        />
      )}
    </div>
  );
};
