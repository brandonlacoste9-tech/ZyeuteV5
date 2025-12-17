/**
 * Profile Page - Premium Quebec Heritage Design
 * Luxury leather profile with gold stats and stitched sections
 */

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { ChatButton } from '@/components/ChatButton';
import { GoldButton } from '@/components/GoldButton';
import { Avatar } from '@/components/Avatar';
import { Image } from '@/components/Image';
import { Button } from '@/components/Button';
import { getCurrentUser, getUserProfile, getUserPosts, checkFollowing, toggleFollow, logout } from '@/services/api';
import { formatNumber } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { IoShareOutline } from 'react-icons/io5';
import type { User, Post } from '@/types';
import { logger } from '../lib/logger';

const profileLogger = logger.withContext('Profile');


// Helper component for the Stats bar
const ProfileStat: React.FC<{ value: number | string; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-lg font-bold text-white">{value}</span>
    <span className="text-xs text-gold-500/70 uppercase tracking-widest">{label}</span>
  </div>
);

export const Profile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { tap, impact } = useHaptics();

  const [user, setUser] = React.useState<User | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'posts' | 'fires' | 'saved'>('posts');

  const isOwnProfile = slug === 'me' || user?.id === currentUser?.id;

  // Fetch current user
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getCurrentUser();
      if (user) setCurrentUser(user);
    };

    fetchCurrentUser();
  }, []);

  // Fetch profile user
  React.useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // For `/profile/me`, use getCurrentUser() directly - it's designed for this
        if (slug === 'me') {
          profileLogger.debug('[Profile] Fetching current user for /profile/me');
          const profileUser = await getCurrentUser();
          profileLogger.debug('[Profile] getCurrentUser result:', profileUser ? 'found' : 'null');

          if (profileUser) {
            setUser(profileUser);
            setCurrentUser(profileUser);
            setError(null);
          } else {
            // Not logged in, redirect to login
            profileLogger.debug('[Profile] No user found, redirecting to login');
            navigate('/login');
            return;
          }
        } else {
          // Regular profile lookup by username
          const profileUser = await getUserProfile(slug || '', currentUser?.id);
          if (profileUser) {
            setUser(profileUser);
            setError(null);
          } else {
            // User not found, redirect home
            navigate('/');
          }
        }
      } catch (error) {
        profileLogger.error('[Profile] Error fetching user:', error);
        setError('Failed to load profile. Please try again.');
        if (slug !== 'me') {
          navigate('/');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (!slug) return;

    // Fetch immediately - don't wait for anything
    fetchUser();
  }, [slug, navigate]);

  // Fetch user posts
  React.useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;

      const userPosts = await getUserPosts(user.id);
      setPosts(userPosts);
    };

    fetchPosts();
  }, [user]);

  // Check if following
  React.useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !currentUser || isOwnProfile) return;

      const following = await checkFollowing(currentUser.id, user.id);
      setIsFollowing(following);
    };

    checkFollowStatus();
  }, [user, currentUser, isOwnProfile]);

  const handleFollow = async () => {
    if (!user || !currentUser) return;
    impact();

    const success = await toggleFollow(currentUser.id, user.id, isFollowing);
    if (success) {
      setIsFollowing(!isFollowing);
    }
  };

  const handleLogout = async () => {
    tap();
    try {
      await logout();
    } catch (error) {
      profileLogger.error('Error signing out:', error);
    } finally {
      navigate('/login');
    }
  };

  // Calculate total likes from posts
  const totalLikes = React.useMemo(() => {
    return posts.reduce((sum, post) => sum + post.fire_count, 0);
  }, [posts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black leather-overlay flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-black leather-overlay flex items-center justify-center pb-20">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gold-500 mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'Unable to load profile'}</p>
          <GoldButton onClick={() => navigate('/')} size="md">
            Go Home
          </GoldButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title={user.username} showBack={true} showSearch={false} />

      {/* Profile Top Section with Gold Gradient Background */}
      <main className="flex-grow overflow-y-auto relative">
        {/* Gold Gradient Background for Top Section */}
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-gold-900/50 to-black" />

        <div className="relative p-4 z-10">
          {/* Profile Picture and Share Button */}
          <div className="flex justify-between items-start mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-gold-500 overflow-hidden shadow-lg">
              <Image
                src={user.avatar_url || 'https://via.placeholder.com/150/FFBF00/000000?text=' + (user.username?.[0] || 'U')}
                alt={user.display_name || user.username}
                objectFit="cover"
              />
            </div>
            <button
              onClick={async () => {
                tap();
                const profileUrl = `${window.location.origin}/profile/${user.username}`;
                try {
                  if (navigator.share) {
                    await navigator.share({
                      title: `Profil de ${user.display_name || user.username} sur Zyeuté`,
                      text: `Regarde le profil de @${user.username} sur Zyeuté! ⚜️`,
                      url: profileUrl,
                    });
                  } else {
                    await navigator.clipboard.writeText(profileUrl);
                    alert('Lien du profil copié! 📋');
                  }
                } catch (error) {
                  profileLogger.error('Error sharing:', error);
                }
              }}
              className="p-2 text-gold-500 hover:text-white transition"
              aria-label="Partager"
            >
              <IoShareOutline className="text-2xl" />
            </button>
          </div>

          {/* Name and Handle */}
          <h1 className="text-2xl font-bold mt-2 text-white">
            {user.display_name || user.username}
            {user.is_verified && (
              <span className="text-gold-500 drop-shadow-[0_0_3px_rgba(255,191,0,0.8)] ml-2">
                ✓
              </span>
            )}
          </h1>
          <p className="text-sm text-gold-500/70">@{user.username}</p>

          {/* Stats Bar */}
          <div className="flex justify-between items-center bg-black/50 p-3 mt-4 rounded-lg border border-gold-500/20 shadow-md">
            <ProfileStat value={formatNumber(user.posts_count || 0)} label="Posts" />
            <div className="h-10 w-px bg-gold-500/20" />
            <ProfileStat value={formatNumber(user.followers_count || 0)} label="Followers" />
            <div className="h-10 w-px bg-gold-500/20" />
            <ProfileStat
              value={totalLikes >= 1000 ? `${(totalLikes / 1000).toFixed(1)}K` : formatNumber(totalLikes)}
              label="Likes"
            />
          </div>

          {/* Action Button */}
          <div className="mt-4">
            {isOwnProfile ? (
              <Link to="/settings" onClick={tap}>
                <GoldButton className="w-full" size="md">
                  Edit Profile
                </GoldButton>
              </Link>
            ) : (
              <GoldButton
                onClick={handleFollow}
                isInverse={isFollowing}
                className="w-full"
                size="md"
              >
                {isFollowing ? 'Following' : 'Follow'}
              </GoldButton>
            )}
          </div>

          {/* Settings / Logout Section for own profile */}
          {isOwnProfile && (
            <div className="mt-4 space-y-3">
              <button
                onClick={() => {
                  tap();
                  navigate('/settings');
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gold-500/60 bg-black/40 text-sm font-medium text-gold-100"
              >
                <span>Paramètres &amp; compte</span>
                <span className="text-xs text-gold-400/80">Notifications, sécurité…</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-xl bg-red-600/80 hover:bg-red-600 text-sm font-semibold text-center text-white transition-colors"
              >
                Déconnexion
              </button>
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <div className="mt-4">
              <p className="text-white text-sm leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Location */}
          {(user.city || user.region) && (
            <div className="flex items-center gap-2 text-gold-500/70 text-sm mt-2">
              <span>📍</span>
              <span>
                {user.city && user.region ? `${user.city}, ${user.region}` : user.city || user.region}
              </span>
            </div>
          )}
        </div>

        {/* Content Tabs Section */}
        <div className="p-4 pt-0">
          {/* Tabs */}
          <div className="leather-card rounded-2xl mb-4 stitched overflow-hidden">
            <div className="grid grid-cols-3 bg-leather-900/50">
              <button
                onClick={() => {
                  setActiveTab('posts');
                  tap();
                }}
                className={`py-4 font-semibold transition-all relative ${activeTab === 'posts'
                    ? 'text-gold-400'
                    : 'text-leather-300 hover:text-gold-200'
                  }`}
              >
                <span className="relative z-10">Posts</span>
                {activeTab === 'posts' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold-gradient glow-gold" />
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('fires');
                  tap();
                }}
                className={`py-4 font-semibold transition-all relative ${activeTab === 'fires'
                    ? 'text-gold-400'
                    : 'text-leather-300 hover:text-gold-200'
                  }`}
              >
                <span className="relative z-10">🔥 Fires</span>
                {activeTab === 'fires' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold-gradient glow-gold" />
                )}
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => {
                    setActiveTab('saved');
                    tap();
                  }}
                  className={`py-4 font-semibold transition-all relative ${activeTab === 'saved'
                      ? 'text-gold-400'
                      : 'text-leather-300 hover:text-gold-200'
                    }`}
                >
                  <span className="relative z-10">Sauvegardés</span>
                  {activeTab === 'saved' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold-gradient glow-gold" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Posts Grid */}
          {posts.length === 0 ? (
            <div className="leather-card rounded-2xl p-12 text-center stitched">
              <div className="text-6xl mb-4">🦫</div>
              <h3 className="text-xl font-bold text-gold-500 mb-2">
                {isOwnProfile ? 'Aucun post encore' : 'Aucun post'}
              </h3>
              <p className="text-leather-300 mb-6">
                {isOwnProfile
                  ? 'Commence à partager ton contenu québécois!'
                  : `${user.display_name || user.username} n'a pas encore posté.`}
              </p>
              {isOwnProfile && (
                <Link to="/upload">
                  <GoldButton className="px-8 py-3 rounded-xl" size="lg">
                    Créer un post
                  </GoldButton>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/p/${post.id}`}
                  className="relative aspect-square leather-card rounded-xl overflow-hidden stitched-subtle hover:scale-105 transition-transform group"
                >
                  <Image
                    src={post.media_url}
                    alt={post.caption || 'Post'}
                    objectFit="cover"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1 text-white">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      </svg>
                      <span className="font-bold">{formatNumber(post.fire_count)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="font-bold">{formatNumber(post.comment_count)}</span>
                    </div>
                  </div>
                  {/* Gold corner accent */}
                  <div className="absolute top-0 right-0 w-8 h-8 bg-gold-gradient opacity-20" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Quebec Pride Footer */}
      <div className="text-center py-8 text-leather-400 text-sm">
        <p className="flex items-center justify-center gap-2">
          <span className="text-gold-500">⚜️</span>
          <span>Créateur québécois</span>
          <span className="text-gold-500">🇨🇦</span>
        </p>
      </div>

      {/* Premium Chat Button */}
      <ChatButton isFixed={true} />
    </div>
  );
};

export default Profile;
