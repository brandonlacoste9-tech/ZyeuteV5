/**
 * StoriesRow — horizontal scrollable stories bar at top of feed
 * Shows story circles for users with active stories + "Add Story" button
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StoryCircle } from "./StoryCircle";
import { StoryViewer } from "./StoryViewer";
import { supabase } from "../../lib/supabase";
import type { Story, User } from "../../types";

interface StoryGroup {
  user: User;
  stories: Story[];
}

// Map raw API story data to the Story type
function mapApiStory(raw: any): Story {
  return {
    id: raw.id,
    user_id: raw.user_id,
    media_url: raw.media_url || raw.mediaUrl || "",
    type: raw.media_type === "video" ? "video" : "photo",
    duration: raw.duration || 5,
    created_at: raw.created_at || new Date().toISOString(),
    expires_at: raw.expires_at || new Date().toISOString(),
    is_viewed: false,
    user: raw.user
      ? {
          id: raw.user.id,
          username: raw.user.username || "",
          display_name: raw.user.display_name || raw.user.username || "",
          avatar_url: raw.user.avatar_url || null,
          is_verified: raw.user.is_verified || false,
          created_at: new Date().toISOString(),
          coins: 0,
          piasse_balance: 0,
          total_karma: 0,
          fire_score: 0,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          is_following: false,
          role: "citoyen" as const,
          tiGuyCommentsEnabled: true,
          nectar_points: 0,
        }
      : undefined,
  };
}

// Map raw API user to the User type
function mapApiUser(raw: any): User {
  return {
    id: raw.id,
    username: raw.username || "",
    display_name: raw.display_name || raw.username || "",
    avatar_url: raw.avatar_url || null,
    is_verified: raw.is_verified || false,
    created_at: new Date().toISOString(),
    coins: 0,
    piasse_balance: 0,
    total_karma: 0,
    fire_score: 0,
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
    is_following: false,
    role: "citoyen" as const,
    tiGuyCommentsEnabled: true,
    nectar_points: 0,
  };
}

export const StoriesRow: React.FC = () => {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [viewingStories, setViewingStories] = useState<Story[] | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) setCurrentUser(session.user);

        const res = await fetch("/api/stories", {
          headers: session
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        if (!res.ok) return;
        const data = await res.json();

        const groups: StoryGroup[] = (data.storyGroups || []).map((g: any) => ({
          user: mapApiUser(g.user || {}),
          stories: (g.stories || []).map(mapApiStory),
        }));
        setStoryGroups(groups);
      } catch {
        // fail silently — stories are optional
      }
    };
    fetchStories();
  }, []);

  // Don't render if no stories to show — avoids dark overlay on empty feed
  if (storyGroups.length === 0) return null;

  return (
    <>
      {/* Stories bar — sits just below the fixed header */}
      <div
        className="fixed left-0 right-0 z-40 flex gap-3 px-4 py-2 overflow-x-auto scrollbar-hide"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 56px)",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
          backdropFilter: "blur(2px)",
        }}
      >
        {/* Story circles */}
        {storyGroups.map((group) => (
          <button
            key={group.user.id}
            onClick={() => setViewingStories(group.stories)}
            className="flex flex-col items-center gap-1 flex-shrink-0 bg-transparent border-none p-0"
          >
            <StoryCircle
              user={group.user}
              story={group.stories[0]}
              isViewed={false}
            />
          </button>
        ))}
      </div>

      {/* Story Viewer */}
      {viewingStories && viewingStories.length > 0 && (
        <StoryViewer
          stories={viewingStories}
          initialIndex={0}
          onClose={() => setViewingStories(null)}
        />
      )}
    </>
  );
};

export default StoriesRow;
