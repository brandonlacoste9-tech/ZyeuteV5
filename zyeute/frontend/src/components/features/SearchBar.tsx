/**
 * SearchBar - Enhanced search with suggestions and recent searches
 */

import React, { useState, useRef, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Avatar } from "../Avatar";
import { validateSearchQuery, sanitizeText } from "../../lib/validation";
import { toast } from "../Toast";
import type { Post, User } from "../../types";
import { logger } from "../../lib/logger";

const searchBarLogger = logger.withContext("SearchBar");

interface SearchBarProps {
  onSearchChange?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

interface SearchResult {
  type: "user" | "hashtag" | "post";
  data: User | string | Post;
}

const SearchBarComponent: React.FC<SearchBarProps> = ({
  onSearchChange,
  placeholder = "Recherche des posts, users, hashtags...",
  autoFocus = false,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem("recentSearches");
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // Handle search
  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      // Validate search query
      const validation = validateSearchQuery(query);
      if (!validation.valid) {
        toast.error(validation.error || "Requête de recherche invalide");
        setResults([]);
        return;
      }

      // Sanitize query
      const sanitizedQuery = sanitizeText(query);

      setIsLoading(true);
      try {
        const searchResults: SearchResult[] = [];

        // Search users
        const { data: users } = await supabase
          .from("user_profiles")
          .select("*")
          .or(
            `username.ilike.%${sanitizedQuery}%,display_name.ilike.%${sanitizedQuery}%`,
          )
          .limit(5);

        if (users) {
          searchResults.push(
            ...users.map((user: User) => ({
              type: "user" as const,
              data: user,
            })),
          );
        }

        // Search posts by caption
        const { data: posts } = await supabase
          .from("posts")
          .select("*, user:users(*)")
          .ilike("caption", `%${sanitizedQuery}%`)
          .limit(5);

        if (posts) {
          searchResults.push(
            ...posts.map((post: Post) => ({
              type: "post" as const,
              data: post,
            })),
          );
        }

        // If query starts with #, add hashtag suggestion
        if (sanitizedQuery.startsWith("#")) {
          searchResults.unshift({
            type: "hashtag",
            data: sanitizedQuery,
          });
        }

        setResults(searchResults);
      } catch (error) {
        searchBarLogger.error("Error searching:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save search to recent
  const saveRecentSearch = (searchQuery: string) => {
    const recent = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 10);
    setRecentSearches(recent);
    localStorage.setItem("recentSearches", JSON.stringify(recent));
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearchChange?.(value);
    setIsOpen(true);
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (result.type === "user") {
      const user = result.data as User;
      navigate(`/profile/${user.username}`);
      saveRecentSearch(`@${user.username}`);
    } else if (result.type === "hashtag") {
      navigate(`/hashtag/${(result.data as string).replace("#", "")}`);
      saveRecentSearch(result.data as string);
    } else if (result.type === "post") {
      const post = result.data as Post;
      navigate(`/post/${post.id}`);
    }

    setQuery("");
    setIsOpen(false);
  };

  // Handle recent search click
  const handleRecentClick = (search: string) => {
    setQuery(search);
    onSearchChange?.(search);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-white/40 focus:outline-none focus:border-gold-400 transition-colors"
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {query && (
          <button
            onClick={() => {
              setQuery("");
              onSearchChange?.("");
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
          >
            <svg
              className="w-5 h-5 text-white/60"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto card-edge"
        >
          {/* Loading */}
          {isLoading && (
            <div className="p-4 text-center text-white/60">Recherche...</div>
          )}

          {/* Results */}
          {!isLoading && results.length > 0 && (
            <div>
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                >
                  {result.type === "user" && (
                    <>
                      <Avatar
                        src={(result.data as User).avatar_url}
                        size="sm"
                        isVerified={(result.data as User).is_verified}
                        userId={(result.data as User).id}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">
                          {(result.data as User).display_name ||
                            (result.data as User).username}
                        </p>
                        <p className="text-white/60 text-sm truncate">
                          @{(result.data as User).username}
                        </p>
                      </div>
                    </>
                  )}
                  {result.type === "hashtag" && (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center">
                        <span className="text-black font-bold">#</span>
                      </div>
                      <p className="text-white font-semibold">
                        {result.data as string}
                      </p>
                    </>
                  )}
                  {result.type === "post" && (
                    <>
                      <img
                        src={(result.data as Post).media_url}
                        alt="Post"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">
                          {(result.data as Post).caption || "Sans titre"}
                        </p>
                        <p className="text-white/60 text-xs truncate">
                          Par {(result.data as Post).user?.username}
                        </p>
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading && query && results.length === 0 && (
            <div className="p-4 text-center text-white/60">
              Aucun résultat pour &quot;{query}&quot;
            </div>
          )}

          {/* Recent searches */}
          {!query && recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <p className="text-white/60 text-sm font-semibold">
                  Recherches récentes
                </p>
                <button
                  onClick={clearRecentSearches}
                  className="text-gold-400 text-sm hover:underline"
                >
                  Effacer
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentClick(search)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                >
                  <svg
                    className="w-5 h-5 text-white/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-white">{search}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Memoize SearchBar to prevent unnecessary re-renders
// Performance optimization: Only re-render when props change
export const SearchBar = memo(SearchBarComponent, (prevProps, nextProps) => {
  return (
    prevProps.onSearchChange === nextProps.onSearchChange &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.autoFocus === nextProps.autoFocus
  );
});

SearchBar.displayName = "SearchBar";

export default SearchBar;
