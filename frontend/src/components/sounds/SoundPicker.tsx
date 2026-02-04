/**
 * Sound Picker Component (TikTok-style)
 * Browse and select sounds for videos
 */

import React, { useState, useEffect } from "react";
import { Search, Music, TrendingUp, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { apiCall } from "@/services/api";

export interface Sound {
  id: string;
  title: string;
  artist?: string;
  audioUrl: string;
  coverImageUrl?: string;
  duration?: number;
  category?: string;
  useCount: number;
  isOriginal: boolean;
}

interface SoundPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sound: Sound, startTime?: number) => void;
  selectedSoundId?: string;
}

export const SoundPicker: React.FC<SoundPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedSoundId,
}) => {
  const { tap } = useHaptics();
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [trendingSounds, setTrendingSounds] = useState<Sound[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"trending" | "browse" | "search">(
    "trending",
  );

  // Load trending sounds
  useEffect(() => {
    if (isOpen && activeTab === "trending") {
      loadTrendingSounds();
    }
  }, [isOpen, activeTab]);

  // Load sounds based on tab
  useEffect(() => {
    if (isOpen) {
      if (activeTab === "browse") {
        loadSounds();
      } else if (activeTab === "search" && searchQuery) {
        searchSounds();
      }
    }
  }, [isOpen, activeTab, searchQuery]);

  const loadTrendingSounds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await apiCall<{ sounds: Sound[] }>(
        "/sounds/trending?limit=20",
      );
      if (!error && data?.sounds) {
        setTrendingSounds(data.sounds);
      }
    } catch (error) {
      console.error("Error loading trending sounds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSounds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await apiCall<{ sounds: Sound[] }>(
        "/sounds?limit=50",
      );
      if (!error && data?.sounds) {
        setSounds(data.sounds);
      }
    } catch (error) {
      console.error("Error loading sounds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchSounds = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const { data, error } = await apiCall<{ sounds: Sound[] }>(
        `/sounds?search=${encodeURIComponent(searchQuery)}&limit=30`,
      );
      if (!error && data?.sounds) {
        setSounds(data.sounds);
      }
    } catch (error) {
      console.error("Error searching sounds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSoundSelect = (sound: Sound) => {
    onSelect(sound, 0); // Default start time is 0
    tap();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  const displaySounds = activeTab === "trending" ? trendingSounds : sounds;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Dark Mode OLED Style - UI Pro Max Style #7 */}
      <div
        className="rounded-t-2xl sm:rounded-2xl border-t sm:border w-full sm:max-w-2xl max-h-[80vh] flex flex-col"
        style={{
          background: "#000000", // Deep black for OLED
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Sons</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => {
              setActiveTab("trending");
              tap();
            }}
            className={cn(
              "flex-1 py-3 px-4 text-sm font-medium transition-colors",
              activeTab === "trending"
                ? "text-gold-400 border-b-2 border-gold-400"
                : "text-white/60 hover:text-white",
            )}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Tendance
          </button>
          <button
            onClick={() => {
              setActiveTab("browse");
              tap();
            }}
            className={cn(
              "flex-1 py-3 px-4 text-sm font-medium transition-colors",
              activeTab === "browse"
                ? "text-gold-400 border-b-2 border-gold-400"
                : "text-white/60 hover:text-white",
            )}
          >
            <Music className="w-4 h-4 inline mr-2" />
            Parcourir
          </button>
          <button
            onClick={() => {
              setActiveTab("search");
              tap();
            }}
            className={cn(
              "flex-1 py-3 px-4 text-sm font-medium transition-colors",
              activeTab === "search"
                ? "text-gold-400 border-b-2 border-gold-400"
                : "text-white/60 hover:text-white",
            )}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Rechercher
          </button>
        </div>

        {/* Search Bar (for search tab) */}
        {activeTab === "search" && (
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Rechercher un son..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>
        )}

        {/* Sounds List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div>
            </div>
          ) : displaySounds.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun son trouvé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Touch target: 44x44px minimum, Micro-interaction: 200-300ms (UI Pro Max) */}
              {displaySounds.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => handleSoundSelect(sound)}
                  className={cn(
                    "w-full min-h-[44px] p-3 rounded-lg border transition-all duration-200 text-left touch-manipulation",
                    selectedSoundId === sound.id
                      ? "border-[#39FF14] bg-[#39FF14]/10" // Neon green accent (OLED style)
                      : "border-white/10 bg-[#121212] hover:bg-[#1A1A1A] focus:ring-2 focus:ring-[#39FF14] focus:ring-offset-2",
                  )}
                  style={{
                    touchAction: "manipulation",
                    backgroundColor:
                      selectedSoundId === sound.id
                        ? "rgba(57, 255, 20, 0.1)"
                        : "#121212",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Cover Image */}
                    {sound.coverImageUrl ? (
                      <img
                        src={sound.coverImageUrl}
                        alt={sound.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gold-500/20 flex items-center justify-center">
                        <Music className="w-6 h-6 text-gold-400" />
                      </div>
                    )}

                    {/* Sound Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">
                        {sound.title}
                      </div>
                      {sound.artist && (
                        <div className="text-sm text-white/60 truncate">
                          {sound.artist}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                        {sound.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(sound.duration)}
                          </span>
                        )}
                        {sound.useCount > 0 && (
                          <span>
                            {sound.useCount.toLocaleString()} utilisations
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {selectedSoundId === sound.id && (
                      <div className="text-gold-400">
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
