/**
 * 🔍 Smart Search Component
 * GenAI-powered multimodal search for Zyeute
 * Uses GenAI App Builder ($1,367.95 credits)
 */

import React, { useState, useCallback } from "react";
import { Search, Image, Sparkles, TrendingUp, MapPin } from "lucide-react";

interface SearchResult {
  id: string;
  type: "video" | "image";
  caption?: string;
  thumbnailUrl?: string;
  username?: string;
  relevanceScore: number;
  matchedOn: string;
}

export const SmartSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "visual" | "foryou">(
    "text",
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/genai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          filters: { type: ["video", "image"] },
          limit: 20,
        }),
      });

      if (!response.ok) {
        if (response.status === 503) {
          alert(
            "🛑 Les crédits AI sont temporairement épuisés! Réessaie plus tard.",
          );
          return;
        }
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get For You feed
  const getForYouFeed = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/genai/for-you?limit=20");
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error("For You error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get trending
  const getTrending = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/genai/trending?limit=20");
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error("Trending error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input
  const handleInputChange = async (value: string) => {
    setQuery(value);

    if (value.length > 2) {
      try {
        const response = await fetch(
          `/api/genai/suggestions?q=${encodeURIComponent(value)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions);
        }
      } catch {
        // Ignore suggestion errors
      }
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          Zyeute Smart Search
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Recherche intelligente avec AI • Comprend le joual québécois
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setActiveTab("text");
            setResults([]);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
            activeTab === "text"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Search className="w-4 h-4" />
          Recherche
        </button>
        <button
          onClick={() => {
            setActiveTab("visual");
            setResults([]);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
            activeTab === "visual"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Image className="w-4 h-4" />
          Par image
        </button>
        <button
          onClick={() => {
            setActiveTab("foryou");
            getForYouFeed();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
            activeTab === "foryou"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Pour toi
        </button>
        <button
          onClick={getTrending}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Tendance
        </button>
      </div>

      {/* Search Input */}
      {activeTab === "text" && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && performSearch(query)}
            placeholder="Recherche... (ex: poutine reviews, hockey moments, MTL nightlife)"
            className="w-full bg-gray-900 border border-gray-700 rounded-full py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          {query && (
            <button
              onClick={() => performSearch(query)}
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "..." : "Chercher"}
            </button>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden z-10">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(suggestion);
                    performSearch(suggestion);
                    setSuggestions([]);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{results.length} résultats trouvés</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Powered by GenAI
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-colors"
              >
                <div className="aspect-video bg-gray-800 relative">
                  {result.thumbnailUrl ? (
                    <img
                      src={result.thumbnailUrl}
                      alt={result.caption}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <Image className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-white text-sm line-clamp-2 mb-2">
                    {result.caption || "Sans titre"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {result.username || "Anonymous"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        result.relevanceScore > 0.8
                          ? "bg-green-900/50 text-green-400"
                          : result.relevanceScore > 0.6
                            ? "bg-blue-900/50 text-blue-400"
                            : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {Math.round(result.relevanceScore * 100)}% match
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Recherche intelligente en cours...</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-800 text-center text-xs text-gray-500">
        <p>
          🔍 Smart Search utilise GenAI App Builder ($1,367.95 crédits
          disponibles)
        </p>
        <p>Comprend le contexte québécois et le joual</p>
      </div>
    </div>
  );
};

export default SmartSearch;
