import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { supabase } from "../lib/supabase";
import type { Post } from "../types";
import { Music } from "lucide-react";

export const SoundDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const decodedSound = decodeURIComponent(id || "");
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!decodedSound) return;

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const pattern = `%${decodedSound}%`;
        const { data, error } = await supabase
          .from("publications")
          .select("*, user:users(*)")
          .filter("visibility", "eq", "public")
          .filter("is_hidden", "eq", false)
          .or(`sound_title.ilike.${pattern},soundTitle.ilike.${pattern}`)
          .order("created_at", { ascending: false })
          .limit(30);

        if (error) throw error;
        setPosts(data as Post[]);
      } catch (err) {
        console.error("Error fetching sound posts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [decodedSound]);

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />
      <div className="max-w-screen-xl mx-auto px-4 pt-4">
        {/* Header section */}
        <div className="flex items-center gap-4 mb-6 mt-4">
          <div className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center bg-zinc-900 shadow-[0_0_15px_rgba(255,215,0,0.2)] animate-[spin_4s_linear_infinite]">
            <Music className="w-10 h-10 text-[#FFD700]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{decodedSound}</h1>
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
            Aucune vidéo trouvée pour ce son.
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 md:gap-4">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="cursor-pointer group relative aspect-[3/4] overflow-hidden rounded-md md:rounded-lg"
                onClick={() => navigate(`/p/${post.id}`)}
              >
                <img
                  src={post.thumbnail_url || post.thumbnailUrl || post.media_url || ""}
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
export default SoundDetail;
