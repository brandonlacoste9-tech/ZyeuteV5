/**
 * LiveDiscover Page - Discover and browse live streams
 * Features: Grid/list view, search, filters, trending highlights
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';

/**
 * Interface for a live stream
 */
interface LiveStream {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_username: string;
  creator_avatar: string;
  title: string;
  thumbnail_url: string;
  viewer_count: number;
  category: string;
  tags: string[];
  is_trending: boolean;
  is_featured: boolean;
  started_at: string;
}

/**
 * Mock data for live streams
 */
const MOCK_LIVE_STREAMS: LiveStream[] = [
  {
    id: 'stream1',
    creator_id: 'user1',
    creator_name: 'Marie-Pier Dubois',
    creator_username: 'mariepier_mtl',
    creator_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mariepier',
    title: '🎨 Live painting session - Vieux-Port Montreal',
    thumbnail_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=450&fit=crop',
    viewer_count: 1247,
    category: 'Art',
    tags: ['art', 'painting', 'montreal'],
    is_trending: true,
    is_featured: true,
    started_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'stream2',
    creator_id: 'user2',
    creator_name: 'Jean-François Tremblay',
    creator_username: 'jf_quebec',
    creator_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jeanfrancois',
    title: 'Cuisine Québécoise - Poutine traditionnelle',
    thumbnail_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&h=450&fit=crop',
    viewer_count: 892,
    category: 'Cuisine',
    tags: ['cooking', 'food', 'poutine'],
    is_trending: true,
    is_featured: false,
    started_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 'stream3',
    creator_id: 'user3',
    creator_name: 'Émilie Gagnon',
    creator_username: 'emilie_music',
    creator_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emilie',
    title: '🎵 Live music - Chanson française covers',
    thumbnail_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=450&fit=crop',
    viewer_count: 567,
    category: 'Musique',
    tags: ['music', 'live', 'covers'],
    is_trending: false,
    is_featured: true,
    started_at: '2024-01-15T11:15:00Z',
  },
  {
    id: 'stream4',
    creator_id: 'user4',
    creator_name: 'Alex Bouchard',
    creator_username: 'alex_gaming',
    creator_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    title: 'Gaming Session - Let\'s play together!',
    thumbnail_url: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=450&fit=crop',
    viewer_count: 2134,
    category: 'Gaming',
    tags: ['gaming', 'twitch', 'streaming'],
    is_trending: true,
    is_featured: false,
    started_at: '2024-01-15T09:45:00Z',
  },
  {
    id: 'stream5',
    creator_id: 'user5',
    creator_name: 'Sophie Leblanc',
    creator_username: 'sophie_fitness',
    creator_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophie',
    title: 'Yoga matinal - Session relaxation 🧘‍♀️',
    thumbnail_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop',
    viewer_count: 345,
    category: 'Fitness',
    tags: ['yoga', 'fitness', 'wellness'],
    is_trending: false,
    is_featured: false,
    started_at: '2024-01-15T08:00:00Z',
  },
  {
    id: 'stream6',
    creator_id: 'user6',
    creator_name: 'Thomas Rivard',
    creator_username: 'thomas_tech',
    creator_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=thomas',
    title: 'Live coding - Building a React app',
    thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=450&fit=crop',
    viewer_count: 678,
    category: 'Tech',
    tags: ['coding', 'react', 'javascript'],
    is_trending: false,
    is_featured: true,
    started_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'stream7',
    creator_id: 'user7',
    creator_name: 'Isabelle Martin',
    creator_username: 'isa_makeup',
    creator_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=isabelle',
    title: 'Makeup Tutorial - Soirée look ✨',
    thumbnail_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=450&fit=crop',
    viewer_count: 1156,
    category: 'Beauté',
    tags: ['makeup', 'beauty', 'tutorial'],
    is_trending: true,
    is_featured: false,
    started_at: '2024-01-15T11:30:00Z',
  },
  {
    id: 'stream8',
    creator_id: 'user8',
    creator_name: 'Maxime Côté',
    creator_username: 'max_sports',
    creator_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maxime',
    title: 'Hockey talk - Les Canadiens analysis',
    thumbnail_url: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=450&fit=crop',
    viewer_count: 823,
    category: 'Sports',
    tags: ['hockey', 'sports', 'canadiens'],
    is_trending: false,
    is_featured: false,
    started_at: '2024-01-15T10:45:00Z',
  },
];

/**
 * Available categories for filtering
 */
const CATEGORIES = [
  { id: 'all', name: 'Tout', icon: '📺' },
  { id: 'Art', name: 'Art', icon: '🎨' },
  { id: 'Musique', name: 'Musique', icon: '🎵' },
  { id: 'Gaming', name: 'Gaming', icon: '🎮' },
  { id: 'Cuisine', name: 'Cuisine', icon: '🍳' },
  { id: 'Fitness', name: 'Fitness', icon: '💪' },
  { id: 'Tech', name: 'Tech', icon: '💻' },
  { id: 'Beauté', name: 'Beauté', icon: '💄' },
  { id: 'Sports', name: 'Sports', icon: '⚽' },
];

/**
 * Format viewer count for display
 */
const formatViewerCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

/**
 * LiveDiscover component - Main page for discovering live streams
 */
const LiveDiscover: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Filter streams based on search query and selected category
   */
  const filteredStreams = useMemo(() => {
    let streams = [...MOCK_LIVE_STREAMS];

    // Filter by category
    if (selectedCategory !== 'all') {
      streams = streams.filter((stream) => stream.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      streams = streams.filter((stream) => 
        stream.title.toLowerCase().includes(query) ||
        stream.creator_name.toLowerCase().includes(query) ||
        stream.creator_username.toLowerCase().includes(query) ||
        stream.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return streams;
  }, [searchQuery, selectedCategory]);

  /**
   * Handle navigation to watch a live stream
   */
  const handleWatchStream = (streamId: string) => {
    navigate(`/live/watch/${streamId}`);
  };

  /**
   * Handle navigation to go live
   */
  const handleGoLive = () => {
    navigate('/live/go');
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              🔴 Live Discover
            </h1>
            <p className="text-white/60 mt-1">
              {MOCK_LIVE_STREAMS.length} streams en direct
            </p>
          </div>
          <Button
            onClick={handleGoLive}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            🎥 Go Live
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher streams, créateurs, tags..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-white font-bold mb-3">Catégories</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gold-gradient text-black'
                    : 'bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white/5 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-white/10" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredStreams.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Aucun stream trouvé
            </h3>
            <p className="text-white/60 mb-6">
              {searchQuery || selectedCategory !== 'all'
                ? 'Essaye une autre recherche ou catégorie'
                : 'Sois le premier à aller live!'}
            </p>
            <Button onClick={handleGoLive} className="bg-red-600 hover:bg-red-700">
              🎥 Go Live
            </Button>
          </div>
        ) : (
          <>
            {/* Trending/Featured Section */}
            {selectedCategory === 'all' && !searchQuery && (
              <div className="mb-8">
                <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                  🔥 Tendances & En vedette
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                  {filteredStreams
                    .filter((stream) => stream.is_trending || stream.is_featured)
                    .slice(0, 2)
                    .map((stream) => (
                      <div
                        key={stream.id}
                        onClick={() => handleWatchStream(stream.id)}
                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer group"
                      >
                        <div className="relative aspect-video overflow-hidden">
                          <img
                            src={stream.thumbnail_url}
                            alt={stream.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Live Badge */}
                          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            LIVE
                          </div>
                          {/* Viewer Count */}
                          <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold">
                            👁️ {formatViewerCount(stream.viewer_count)}
                          </div>
                          {/* Trending/Featured Badge */}
                          {stream.is_trending && (
                            <div className="absolute bottom-3 left-3 bg-gold-500 text-black px-2 py-1 rounded text-xs font-bold">
                              🔥 TRENDING
                            </div>
                          )}
                          {stream.is_featured && (
                            <div className="absolute bottom-3 right-3 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                              ⭐ FEATURED
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <img
                              src={stream.creator_avatar}
                              alt={stream.creator_name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white mb-1 line-clamp-2">
                                {stream.title}
                              </h3>
                              <p className="text-white/60 text-sm">
                                {stream.creator_name}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded">
                                  {stream.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* All Streams Grid */}
            <div className="mb-6">
              <h2 className="text-white font-bold mb-4">
                {selectedCategory !== 'all' || searchQuery
                  ? 'Résultats'
                  : 'Tous les streams'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStreams.map((stream) => (
                  <div
                    key={stream.id}
                    onClick={() => handleWatchStream(stream.id)}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={stream.thumbnail_url}
                        alt={stream.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Live Badge */}
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        LIVE
                      </div>
                      {/* Viewer Count */}
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs font-bold">
                        👁️ {formatViewerCount(stream.viewer_count)}
                      </div>
                      {/* Trending Badge */}
                      {stream.is_trending && (
                        <div className="absolute bottom-2 left-2 bg-gold-500 text-black px-2 py-0.5 rounded text-xs font-bold">
                          🔥
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-start gap-2">
                        <img
                          src={stream.creator_avatar}
                          alt={stream.creator_name}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm mb-0.5 line-clamp-2">
                            {stream.title}
                          </h3>
                          <p className="text-white/60 text-xs truncate">
                            {stream.creator_name}
                          </p>
                          <span className="inline-block text-xs bg-white/10 text-white/70 px-1.5 py-0.5 rounded mt-1">
                            {stream.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default LiveDiscover;
