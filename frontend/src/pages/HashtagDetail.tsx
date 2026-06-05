import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { supabase } from "../lib/supabase";
import type { Post } from "../types";
import { VideoCard } from "../components/features/VideoCard";

export const HashtagDetail: React.FC = () => {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tag) return;

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        // Fetch posts that contain the hashtag in their hashtags array or caption
        // For simplicity with Supabase, we can use a contained-in array filter or text search
        const { data, error } = await supabase
          .from("publications")
          .select("*, user:users(*)")
          .filter("visibility", "eq", "public")
          .filter("is_hidden", "eq", false)
          .contains("hashtags", [tag])
          .order("created_at", { ascending: false })
          .limit(30);

        if (error) throw error;
        setPosts(data as Post[]);
      } catch (err) {
        console.error("Error fetching hashtag posts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [tag]);

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />
      <div className="max-w-screen-xl mx-auto px-4 pt-4">
        {/* Header section */}
        <div className="flex items-center gap-4 mb-6 mt-4">
          <div className="w-20 h-20 rounded-full border-2 border-[#FFD700] flex items-center justify-center bg-zinc-900 shadow-[0_0_15px_rgba(255,215,0,0.3)]">
            <span className="text-4xl text-[#FFD700] font-bold">#</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">#{tag}</h1>
            <p className="text-white/60 text-sm">
              {posts.length} {posts.length === 1 ? "vidéo" : "vidéos"}
            </p>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFD700]"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-white/50">
            Aucune vidéo trouvée pour ce hashtag.
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 md:gap-4">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="cursor-pointer group relative aspect-[9/16] overflow-hidden rounded-md md:rounded-lg"
                onClick={() => navigate(`/p/${post.id}`)}
              >
                <img
                  src={post.thumbnail_url || post.thumbnailUrl || ""}
                  alt={post.caption || "Vidéo"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold">
                    <span>▶</span> {post.view_count || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default HashtagDetail;
