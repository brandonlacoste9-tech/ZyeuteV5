import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Avatar } from "@/components/Avatar";
import { GoldButton } from "@/components/GoldButton";
import {
  getUserProfile,
  getFollowers,
  getFollowing,
  getFriends,
  toggleFollow,
  checkFollowing,
  getCurrentUser,
} from "@/services/api";
import type { User } from "@/types";

type NetworkTab = "amis" | "abonnes" | "abonnements";

const UserRow = ({
  user,
  currentUserId,
  onNavigate,
}: {
  user: User;
  currentUserId: string;
  onNavigate: (username: string) => void;
}) => {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isOwnProfile = currentUserId === user.id;

  useEffect(() => {
    if (isOwnProfile || !currentUserId) return;
    let mounted = true;
    checkFollowing(currentUserId, user.id).then((status) => {
      if (mounted) setIsFollowing(status);
    });
    return () => {
      mounted = false;
    };
  }, [currentUserId, user.id, isOwnProfile]);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowing === null || isOwnProfile || !currentUserId) return;

    setIsLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing); // Optimistic update

    const success = await toggleFollow(currentUserId, user.id, wasFollowing);
    if (!success) {
      setIsFollowing(wasFollowing); // Revert on failure
    }
    setIsLoading(false);
  };

  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors mb-2"
      onClick={() => onNavigate(user.username || user.id)}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Avatar
          src={user.avatar_url || undefined}
          alt={user.display_name || user.username || ""}
          size="md"
        />
        <div className="flex flex-col overflow-hidden">
          <span className="text-white font-bold text-sm truncate">
            {user.display_name || user.username || "Utilisateur"}
          </span>
          <span className="text-white/60 text-xs truncate">
            @{user.username || user.id.slice(0, 8)}
          </span>
        </div>
      </div>

      {!isOwnProfile && isFollowing !== null && (
        <GoldButton
          onClick={handleFollowToggle}
          isInverse={isFollowing}
          size="sm"
          className="ml-2 min-w-[90px]"
          disabled={isLoading}
        >
          {isFollowing ? "Abonné" : "S'abonner"}
        </GoldButton>
      )}
    </div>
  );
};

export const Network: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<NetworkTab>(
    (searchParams.get("tab") as NetworkTab) || "abonnes"
  );
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // First fetch the target user to get their UUID
  useEffect(() => {
    if (!username) return;
    setIsLoading(true);
    getUserProfile(username).then((u) => {
      setTargetUser(u);
      if (!u) setIsLoading(false);
    });
    getCurrentUser().then((u) => {
      if (u) setCurrentUserId(u.id);
    });
  }, [username]);

  // Then fetch the network list when tab or target user changes
  useEffect(() => {
    if (!targetUser) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        let data: User[] = [];
        if (activeTab === "abonnes") {
          data = await getFollowers(targetUser.id);
        } else if (activeTab === "abonnements") {
          data = await getFollowing(targetUser.id);
        } else if (activeTab === "amis") {
          data = await getFriends(targetUser.id);
        }
        setUsers(data || []);
      } catch (error) {
        console.error("Failed to load network list", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [targetUser, activeTab]);

  const handleNavigate = (targetUsername: string) => {
    navigate(`/profile/${targetUsername}`);
  };

  const isOwnProfile = currentUserId === targetUser?.id;

  return (
    <div className="min-h-screen bg-[#111111] pb-20 flex flex-col">
      <Header
        title={targetUser?.username || "Réseau"}
        showBack={true}
        onBack={() => navigate(-1)}
      />

      {/* Tabs */}
      <div className="flex items-center border-b border-white/10 mt-16 px-2">
        {(["amis", "abonnes", "abonnements"] as NetworkTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors relative ${
              activeTab === tab ? "text-gold-500" : "text-white/60"
            }`}
          >
            {tab === "amis"
              ? "Amis"
              : tab === "abonnes"
                ? "Abonnés"
                : "Abonnements"}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />
            )}
          </button>
        ))}
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
          </div>
        ) : !targetUser ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-3">
            <span className="text-4xl">🤷</span>
            <p className="text-sm">Utilisateur introuvable</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-white/40 space-y-3">
            <span className="text-4xl">👥</span>
            <p className="text-sm">
              {activeTab === "amis"
                ? "Aucun ami pour le moment"
                : activeTab === "abonnes"
                  ? "Aucun abonné pour le moment"
                  : "Aucun abonnement pour le moment"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                currentUserId={currentUserId || ""}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default Network;
