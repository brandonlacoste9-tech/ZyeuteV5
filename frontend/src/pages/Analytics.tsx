/**
 * Analytics Page - Creator dashboard with statistics and insights
 */

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { supabase } from "../lib/supabase";
import { formatNumber } from "../lib/utils";
import type { User } from "../types";
import { logger } from "../lib/logger";

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

        // Get total posts
        const { count: totalPosts } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", currentUser.id)
          .gte("created_at", startDate.toISOString());

        // Get total fires
        const { data: firePosts } = await supabase
          .from("posts")
          .select("fire_count")
          .eq("user_id", currentUser.id)
          .gte("created_at", startDate.toISOString());

        const totalFires =
          firePosts?.reduce(
            (sum: number, post: any) => sum + (post.fire_count || 0),
            0,
          ) || 0;

        // Get total comments
        const { count: totalComments } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", currentUser.id)
          .gte("created_at", startDate.toISOString());

        // Get total followers
        const { count: totalFollowers } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", currentUser.id);

        // Get top post
        const { data: topPost } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("fire_count", { ascending: false })
          .limit(1)
          .single();

        // Calculate engagement rate
        const totalEngagements = totalFires + (totalComments || 0);
        const engagementRate = totalPosts
          ? (totalEngagements / (totalPosts * (totalFollowers || 1))) * 100
          : 0;

        setAnalytics({
          totalPosts: totalPosts || 0,
          totalViews: 0, // TODO: Implement views tracking
          totalFires,
          totalComments: totalComments || 0,
          totalFollowers: totalFollowers || 0,
          totalGiftsReceived: 0, // TODO: Implement gifts tracking
          avgFireRating: totalPosts ? totalFires / totalPosts : 0,
          topPost,
          recentGrowth: {
            posts: 0, // TODO: Calculate growth
            followers: 0,
            engagement: 0,
          },
          regionBreakdown: [], // TODO: Implement region breakdown
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
              <img
                src={analytics.topPost.media_url}
                alt="Top post"
                className="w-32 h-32 rounded-xl object-cover edge-glow"
              />
              <div className="flex-1">
                <p className="text-white mb-2">{analytics.topPost.caption}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-gold-400">
                    🔥 {formatNumber(analytics.topPost.fire_count)} feux
                  </span>
                  <span className="text-white/60">
                    💬 {formatNumber(analytics.topPost.comment_count || 0)}{" "}
                    commentaires
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips for creators */}
        <div className="card-edge p-6">
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
      </div>

      <BottomNav />
    </div>
  );
};

export default Analytics;
