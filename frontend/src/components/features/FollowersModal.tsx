import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { GoldButton } from "@/components/GoldButton";
import {
  getFollowers,
  getFollowing,
  toggleFollow,
  checkFollowing,
  getCurrentUser,
} from "@/services/api";
import type { User } from "@/types";

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
}

// Internal component for each user row to manage individual follow state
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
      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
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

export const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  userId,
  type,
}) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setCurrentUserId(currentUser.id);
        }

        const data =
          type === "followers"
            ? await getFollowers(userId)
            : await getFollowing(userId);
            
        setUsers(data || []);
      } catch (error) {
        console.error("Failed to load followers/following", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, userId, type]);

  if (!isOpen) return null;

  const handleNavigate = (username: string) => {
    onClose();
    // Use setTimeout to allow the modal close animation to start before navigating
    setTimeout(() => {
      navigate(`/profile/${username}`);
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className="relative w-full sm:max-w-md bg-[#111111] rounded-t-3xl sm:rounded-3xl border border-white/10 flex flex-col h-[75vh] sm:h-[60vh] max-h-[600px] overflow-hidden"
        style={{
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">
            {type === "followers" ? "Abonnés" : "Abonnements"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-3">
              <span className="text-4xl">👥</span>
              <p className="text-sm">
                {type === "followers"
                  ? "Aucun abonné pour le moment"
                  : "Aucun abonnement pour le moment"}
              </p>
            </div>
          ) : (
            users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                currentUserId={currentUserId || ""}
                onNavigate={handleNavigate}
              />
            ))
          )}
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
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
