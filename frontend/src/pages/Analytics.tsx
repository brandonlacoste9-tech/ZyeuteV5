/**
 * Analytics Page - Creator dashboard with statistics and insights
 * FIXED: Correct table names (publications, abonnements, commentaires), correct column names
 */

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { supabase } from "../lib/supabase";
import { formatNumber } from "../lib/utils";
import type { User } from "../types";
import { logger } from "../lib/logger";
import { apiCall } from "../services/api";

const analyticsLogger = logger.withContext("Analytics");

interface AnalyticsData {
  totalPosts: number;
  totalViews: number;
  totalFires: number;
  totalComments: number;
  totalFollowers: number;
  totalGiftsReceived: number;
  avgFireRating: number;
  topPost: any;
  recentGrowth: {
    posts: number;
    followers: number;
    engagement: number;
  };
  regionBreakdown: Array<{ region: string; count: number }>;
  engagementRate: number;
}

export const Analytics: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");
  const [videoStats, setVideoStats] = React.useState<any[]>([]);
  const [loadingVideoStats, setLoadingVideoStats] = React.useState(false);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) setCurrentUser(data);
      }
    };

    fetchUser();
  }, []);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      try {
        // Calculate date range
        const startDate = new Date();
        if (timeRange === "7d") startDate.setDate(startDate.getDate() - 7);
        else if (timeRange === "30d")
          startDate.setDate(startDate.getDate() - 30);
        else startDate.setFullYear(startDate.getFullYear() - 10); // All time

        // Get total posts from `publications` table
        const { count: totalPosts } = await supabase
          .from("publications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", currentUser.id)
          .gte("created_at", startDate.toISOString());

        // Get total reactions (fires) — column is `reactions_count` on publications
        const { data: firePosts } = await supabase
          .from("publications")
          .select("reactions_count")
          .eq("user_id", currentUser.id)
          .gte("created_at", startDate.toISOString());

        const totalFires =
          firePosts?.reduce(
            (sum: number, post: any) => sum + (post.reactions_count || 0),
            0,
          ) || 0;

        // Get total views
        const { data: viewPosts } = await supabase
          .from("publications")
          .select("view_count")
          .eq("user_id", currentUser.id)
          .gte("created_at", startDate.toISOString());

        const totalViews =
          viewPosts?.reduce(
            (sum: number, post: any) => sum + (post.view_count || 0),
            0,
          ) || 0;

        // Get total comments — join through publications: get publication IDs first,
        // then count commentaires where publication_id is in that list.
        const { data: userPubs } = await supabase
          .from("publications")
          .select("id")
          .eq("user_id", currentUser.id)
          .gte("created_at", startDate.toISOString());

        const pubIds = userPubs?.map((p: any) => p.id) || [];

        let totalComments = 0;
        if (pubIds.length > 0) {
          const { count: commentCount } = await supabase
            .from("commentaires")
            .select("*", { count: "exact", head: true })
            .in("publication_id", pubIds)
            .is("deleted_at", null);
          totalComments = commentCount || 0;
        }

        // Get total followers from `abonnements` table — followee_id is the creator
        const { count: totalFollowers } = await supabase
          .from("abonnements")
          .select("*", { count: "exact", head: true })
          .eq("followee_id", currentUser.id);

        // Get top post by reactions_count
        const { data: topPost } = await supabase
          .from("publications")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("reactions_count", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Calculate engagement rate
        const totalEngagements = totalFires + totalComments;
        const engagementRate =
          totalPosts && (totalFollowers || 0) > 0
            ? (totalEngagements / (totalPosts * (totalFollowers || 1))) * 100
            : 0;

        // gifts received from user_profiles
        const giftsReceived = (currentUser as any).total_gifts_received || 0;

        // ── Week-over-week growth ──────────────────────────────────────────
        // Previous period: same length window shifted back by itself
        const periodMs = Date.now() - startDate.getTime();
        const prevStart = new Date(startDate.getTime() - periodMs);

        const [{ count: prevPosts }, prevFollowers] = await Promise.all([
          supabase
            .from("publications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", currentUser.id)
            .gte("created_at", prevStart.toISOString())
            .lt("created_at", startDate.toISOString()),
          supabase
            .from("abonnements")
            .select("*", { count: "exact", head: true })
            .eq("followee_id", currentUser.id)
            .gte("created_at", prevStart.toISOString())
            .lt("created_at", startDate.toISOString()),
        ]);

        const postsGrowth =
          (prevPosts ?? 0) > 0
            ? Math.round(
                (((totalPosts ?? 0) - (prevPosts ?? 0)) / (prevPosts ?? 1)) *
                  100,
              )
            : (totalPosts ?? 0 > 0)
              ? 100
              : 0;
        const followersGrowth =
          (prevFollowers.count ?? 0) > 0
            ? Math.round(
                (((totalFollowers ?? 0) - (prevFollowers.count ?? 0)) /
                  (prevFollowers.count ?? 1)) *
                  100,
              )
            : (totalFollowers ?? 0) > 0
              ? 100
              : 0;

        // ── Region breakdown ──────────────────────────────────────────────
        // Get followers by region (join abonnements → user_profiles on follower_id)
        const { data: followersWithRegion } = await supabase
          .from("abonnements")
          .select("user_profiles!follower_id ( region )")
          .eq("followee_id", currentUser.id);

        const regionMap: Record<string, number> = {};
        (followersWithRegion || []).forEach((row: any) => {
          const region = row.user_profiles?.region;
          if (region) {
            regionMap[region] = (regionMap[region] || 0) + 1;
          }
        });
        const regionBreakdown = Object.entries(regionMap)
          .map(([region, count]) => ({ region, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        setAnalytics({
          totalPosts: totalPosts || 0,
          totalViews,
          totalFires,
          totalComments,
          totalFollowers: totalFollowers || 0,
          totalGiftsReceived: giftsReceived,
          avgFireRating: totalPosts ? totalFires / totalPosts : 0,
          topPost,
          recentGrowth: {
            posts: postsGrowth,
            followers: followersGrowth,
            engagement: 0,
          },
          regionBreakdown,
          engagementRate,
        });
      } catch (error) {
        analyticsLogger.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [currentUser, timeRange]);

  React.useEffect(() => {
    const fetchVideoStats = async () => {
      setLoadingVideoStats(true);
      try {
        const { data } = await apiCall<{ success: boolean; data: any[] }>(
          "/mux/video-stats",
        );
        if (data?.data) setVideoStats(data.data);
      } catch (e) {
        // Silently fail
      } finally {
        setLoadingVideoStats(false);
      }
    };
    fetchVideoStats();
  }, []);

  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold-400 animate-pulse">
          Chargement des statistiques...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title="Statistiques" showBack={true} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Time range selector */}
        <div className="flex gap-2 mb-6">
          {(["7d", "30d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                timeRange === range
                  ? "bg-gold-gradient text-black"
                  : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {range === "7d"
                ? "7 jours"
                : range === "30d"
                  ? "30 jours"
                  : "Tout"}
            </button>
          ))}
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card-edge p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-gold-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
              </svg>
              <span className="text-white/60 text-sm">Publications</span>
            </div>
            <p className="text-white text-3xl font-bold">
              {formatNumber(analytics.totalPosts)}
            </p>
          </div>

          <div className="card-edge p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-gold-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              <span className="text-white/60 text-sm">Vues</span>
            </div>
            <p className="text-white text-3xl font-bold">
              {formatNumber(analytics.totalViews)}
            </p>
          </div>

          <div className="card-edge p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-gold-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.66 8L12 2.35 6.34 8C4.78 9.56 4 11.64 4 13.64s.78 4.11 2.34 5.67 3.61 2.35 5.66 2.35 4.1-.79 5.66-2.35S20 15.64 20 13.64 19.22 9.56 17.66 8zM6 14c.01-2 .62-3.27 1.76-4.4L12 5.27l4.24 4.38C17.38 10.77 17.99 12 18 14H6z" />
              </svg>
              <span className="text-white/60 text-sm">Total Feux</span>
            </div>
            <p className="text-white text-3xl font-bold">
              {formatNumber(analytics.totalFires)}
            </p>
            <p className="text-white/40 text-xs mt-1">
              Moy. {analytics.avgFireRating.toFixed(1)} par post
            </p>
          </div>

          <div className="card-edge p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-gold-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
              <span className="text-white/60 text-sm">Commentaires</span>
            </div>
            <p className="text-white text-3xl font-bold">
              {formatNumber(analytics.totalComments)}
            </p>
          </div>
        </div>

        {/* Second row: Followers, Gifts */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card-edge p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-gold-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              <span className="text-white/60 text-sm">Abonnés</span>
            </div>
            <p className="text-white text-3xl font-bold">
              {formatNumber(analytics.totalFollowers)}
            </p>
          </div>

          <div className="card-edge p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-gold-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.53 15.64 0 12.5 0 10.9 0 9.5.84 8.5 2.16 7.5.84 6.1 0 4.5 0 1.36 0-1 2.53-1 4.64c0 3.64 4 7.3 9 11.36 5-4.06 9-7.72 9-11.36V6zm-8 12.54l-1-.9C6.41 13.58 3 10.47 3 7.96c0-1.95 1.33-3.33 3-3.33 1.06 0 2.08.6 2.72 1.56.12.17.29.27.46.26.17.01.34-.09.46-.26C10.28 5.23 11.3 4.63 12.36 4.63c1.67 0 3 1.38 3 3.33 0 2.51-3.41 5.62-8.36 10.08z" />
              </svg>
              <span className="text-white/60 text-sm">Cadeaux reçus</span>
            </div>
            <p className="text-white text-3xl font-bold">
              {formatNumber(analytics.totalGiftsReceived)}
            </p>
          </div>
        </div>

        {/* Engagement rate */}
        <div className="card-edge p-6 mb-6">
          <h2 className="text-white text-xl font-bold mb-4">
            Taux d&apos;engagement
          </h2>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-gold-400 text-5xl font-bold">
                {analytics.engagementRate.toFixed(1)}%
              </p>
              <p className="text-white/60 text-sm mt-2">
                Moyenne de l&apos;industrie: 3-5%
              </p>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold-gradient rounded-full transition-all"
                  style={{
                    width: `${Math.min(analytics.engagementRate * 10, 100)}%`,
                  }}
                />
              </div>
              <p className="text-white/40 text-xs mt-2">
                {analytics.engagementRate > 5
                  ? "🔥 Excellent engagement!"
                  : analytics.engagementRate > 3
                    ? "👍 Bon engagement"
                    : "💪 Continue à créer du contenu!"}
              </p>
            </div>
          </div>
        </div>

        {/* Top post */}
        {analytics.topPost && (
          <div className="card-edge p-6 mb-6">
            <h2 className="text-white text-xl font-bold mb-4">
              Ta meilleure publication
            </h2>
            <div className="flex gap-4">
              {analytics.topPost.thumbnail_url && (
                <img
                  src={analytics.topPost.thumbnail_url}
                  alt="Top post"
                  className="w-32 h-32 rounded-xl object-cover edge-glow"
                />
              )}
              <div className="flex-1">
                <p className="text-white mb-2">
                  {analytics.topPost.caption || analytics.topPost.content}
                </p>
                <div className="flex gap-4 text-sm">
                  <span className="text-gold-400">
                    🔥 {formatNumber(analytics.topPost.reactions_count || 0)}{" "}
                    feux
                  </span>
                  <span className="text-white/60">
                    💬 {formatNumber(analytics.topPost.comments_count || 0)}{" "}
                    commentaires
                  </span>
                  <span className="text-white/60">
                    👁️ {formatNumber(analytics.topPost.view_count || 0)} vues
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Growth metrics */}
        {(analytics.recentGrowth.posts !== 0 ||
          analytics.recentGrowth.followers !== 0) && (
          <div className="card-edge p-6 mb-6">
            <h2 className="text-white text-xl font-bold mb-4">
              Croissance (période précédente)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-sm mb-1">Publications</p>
                <p
                  className={`text-2xl font-bold ${
                    analytics.recentGrowth.posts >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {analytics.recentGrowth.posts >= 0 ? "+" : ""}
                  {analytics.recentGrowth.posts}%
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-1">Abonnés</p>
                <p
                  className={`text-2xl font-bold ${
                    analytics.recentGrowth.followers >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {analytics.recentGrowth.followers >= 0 ? "+" : ""}
                  {analytics.recentGrowth.followers}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Region breakdown */}
        {analytics.regionBreakdown.length > 0 && (
          <div className="card-edge p-6 mb-6">
            <h2 className="text-white text-xl font-bold mb-4">
              Abonnés par région
            </h2>
            <div className="space-y-3">
              {analytics.regionBreakdown.map(({ region, count }) => {
                const pct =
                  analytics.totalFollowers > 0
                    ? Math.round((count / analytics.totalFollowers) * 100)
                    : 0;
                return (
                  <div key={region}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white capitalize">{region}</span>
                      <span className="text-white/60">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold-gradient rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tips for creators */}
        <div className="card-edge p-6 mb-6">
          <h2 className="text-white text-xl font-bold mb-4">
            Conseils pour créateurs 💡
          </h2>
          <ul className="space-y-3 text-white/80 text-sm">
            <li className="flex gap-3">
              <span className="text-gold-400 font-bold">1.</span>
              <span>
                Publie régulièrement pour garder ton audience engagée (au moins
                3x par semaine)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold-400 font-bold">2.</span>
              <span>
                Utilise des hashtags locaux québécois (#quebec #montreal #514
                #450)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold-400 font-bold">3.</span>
              <span>
                Réponds à tes commentaires pour augmenter l&apos;engagement
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold-400 font-bold">4.</span>
              <span>Crée des Stories quotidiennes pour rester visible</span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold-400 font-bold">5.</span>
              <span>Collabore avec d&apos;autres créateurs québécois</span>
            </li>
          </ul>
        </div>

        {/* Video Performance Section */}
        <div className="mt-6">
          <h2
            className="text-lg font-black text-white uppercase tracking-widest mb-4"
            style={{ color: "#DAA520" }}
          >
            🎬 Performances vidéo
          </h2>
          {loadingVideoStats ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
            </div>
          ) : videoStats.length === 0 ? (
            <div className="text-center py-8 text-white/40 text-sm">
              Aucune vidéo publiée
            </div>
          ) : (
            <div className="space-y-3">
              {videoStats.map((v) => (
                <div
                  key={v.postId}
                  className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  {v.thumbnailUrl && (
                    <img
                      src={v.thumbnailUrl}
                      alt={v.caption}
                      className="w-12 h-20 rounded-lg object-cover flex-shrink-0 bg-black"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {v.caption}
                    </p>
                    {v.duration && (
                      <p className="text-white/40 text-xs">
                        {Math.floor(v.duration / 60)}:
                        {String(v.duration % 60).padStart(2, "0")}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2">
                      <div className="text-center">
                        <p className="text-white font-bold text-sm">
                          {v.viewCount}
                        </p>
                        <p className="text-white/40 text-xs">vues</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-sm">
                          {v.reactionsCount}
                        </p>
                        <p className="text-white/40 text-xs">🔥</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold text-sm">
                          {v.commentsCount}
                        </p>
                        <p className="text-white/40 text-xs">💬</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Analytics;
