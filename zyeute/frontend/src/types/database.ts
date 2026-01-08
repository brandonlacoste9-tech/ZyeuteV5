/**
 * Database types generated from Supabase schema
 * Includes all Enterprise Features:
 * - Subscriptions
 * - Moderation
 * - Gamification
 * - Live Streaming
 * - Marketplace
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          region: string | null;
          is_verified: boolean;
          coins: number;
          fire_score: number;
          created_at: string;
          updated_at: string;
          // Creator Fields
          is_creator: boolean;
          creator_verified: boolean;
          total_subscribers: number;
          total_earnings: number;
          pending_earnings: number;
          stripe_account_id: string | null;
          stripe_customer_id: string | null;
          payout_email: string | null;
          payout_method: string | null;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          region?: string | null;
          is_verified?: boolean;
          coins?: number;
          fire_score?: number;
          created_at?: string;
          updated_at?: string;
          is_creator?: boolean;
          creator_verified?: boolean;
          total_subscribers?: number;
          total_earnings?: number;
          pending_earnings?: number;
          stripe_account_id?: string | null;
          stripe_customer_id?: string | null;
          payout_email?: string | null;
          payout_method?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          region?: string | null;
          is_verified?: boolean;
          coins?: number;
          fire_score?: number;
          created_at?: string;
          updated_at?: string;
          is_creator?: boolean;
          creator_verified?: boolean;
          total_subscribers?: number;
          total_earnings?: number;
          pending_earnings?: number;
          stripe_account_id?: string | null;
          stripe_customer_id?: string | null;
          payout_email?: string | null;
          payout_method?: string | null;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          type: "photo" | "video";
          media_url: string;
          caption: string | null;
          hashtags: string[] | null;
          region: string | null;
          city: string | null;
          fire_count: number;
          comment_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "photo" | "video";
          media_url: string;
          caption?: string | null;
          hashtags?: string[] | null;
          region?: string | null;
          city?: string | null;
          fire_count?: number;
          comment_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "photo" | "video";
          media_url?: string;
          caption?: string | null;
          hashtags?: string[] | null;
          region?: string | null;
          city?: string | null;
          fire_count?: number;
          comment_count?: number;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          text: string;
          content: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          text: string;
          content?: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          text?: string;
          content?: string;
          parent_id?: string | null;
          created_at?: string;
        };
      };
      comment_likes: {
        Row: {
          comment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          comment_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          comment_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      fires: {
        Row: {
          user_id: string;
          post_id: string;
          fire_level: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id: string;
          fire_level: number;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          post_id?: string;
          fire_level?: number;
          created_at?: string;
        };
      };
      gifts: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          post_id: string | null;
          gift_type: string;
          coin_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          post_id?: string | null;
          gift_type: string;
          coin_value: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          post_id?: string | null;
          gift_type?: string;
          coin_value?: number;
          created_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          media_url: string;
          type: "photo" | "video";
          duration: number;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_url: string;
          type: "photo" | "video";
          duration?: number;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_url?: string;
          type?: "photo" | "video";
          duration?: number;
          created_at?: string;
          expires_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "fire"
            | "comment"
            | "follow"
            | "gift"
            | "mention"
            | "subscription"
            | "achievement";
          actor_id: string;
          post_id: string | null;
          comment_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | "fire"
            | "comment"
            | "follow"
            | "gift"
            | "mention"
            | "subscription"
            | "achievement";
          actor_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?:
            | "fire"
            | "comment"
            | "follow"
            | "gift"
            | "mention"
            | "subscription"
            | "achievement";
          actor_id?: string;
          post_id?: string | null;
          comment_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      // SUBSCRIPTIONS
      subscription_tiers: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          name_fr: string;
          description: string | null;
          price: number;
          currency: string;
          benefits: Json;
          is_active: boolean;
          max_subscribers: number | null;
          stripe_price_id: string | null;
          stripe_product_id: string | null;
          subscriber_count: number;
          monthly_revenue: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          name: string;
          name_fr: string;
          description?: string | null;
          price: number;
          currency?: string;
          benefits?: Json;
          is_active?: boolean;
          max_subscribers?: number | null;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          subscriber_count?: number;
          monthly_revenue?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          name?: string;
          name_fr?: string;
          description?: string | null;
          price?: number;
          currency?: string;
          benefits?: Json;
          is_active?: boolean;
          max_subscribers?: number | null;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          subscriber_count?: number;
          monthly_revenue?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          subscriber_id: string;
          creator_id: string;
          tier_id: string;
          status: "active" | "canceled" | "past_due" | "paused" | "expired";
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscriber_id: string;
          creator_id: string;
          tier_id: string;
          status: "active" | "canceled" | "past_due" | "paused" | "expired";
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subscriber_id?: string;
          creator_id?: string;
          tier_id?: string;
          status?: "active" | "canceled" | "past_due" | "paused" | "expired";
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      creator_earnings: {
        Row: {
          id: string;
          creator_id: string;
          source: "subscription" | "gift" | "tip" | "sponsored";
          source_id: string | null;
          amount: number;
          currency: string;
          platform_fee: number;
          creator_net: number;
          payout_status: "pending" | "paid" | "failed";
          payout_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          source: "subscription" | "gift" | "tip" | "sponsored";
          source_id?: string | null;
          amount: number;
          currency?: string;
          platform_fee: number;
          creator_net: number;
          payout_status?: "pending" | "paid" | "failed";
          payout_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          source?: "subscription" | "gift" | "tip" | "sponsored";
          source_id?: string | null;
          amount?: number;
          currency?: string;
          platform_fee?: number;
          creator_net?: number;
          payout_status?: "pending" | "paid" | "failed";
          payout_date?: string | null;
          created_at?: string;
        };
      };
      creator_payouts: {
        Row: {
          id: string;
          creator_id: string;
          amount: number;
          currency: string;
          payout_method: "stripe" | "interac" | "paypal";
          payout_destination: string | null;
          stripe_transfer_id: string | null;
          status: "pending" | "processing" | "completed" | "failed";
          requested_at: string;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          amount: number;
          currency?: string;
          payout_method: "stripe" | "interac" | "paypal";
          payout_destination?: string | null;
          stripe_transfer_id?: string | null;
          status?: "pending" | "processing" | "completed" | "failed";
          requested_at?: string;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          amount?: number;
          currency?: string;
          payout_method?: "stripe" | "interac" | "paypal";
          payout_destination?: string | null;
          stripe_transfer_id?: string | null;
          status?: "pending" | "processing" | "completed" | "failed";
          requested_at?: string;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      exclusive_content: {
        Row: {
          id: string;
          post_id: string;
          creator_id: string;
          min_tier_id: string | null;
          is_exclusive: boolean;
          preview_text: string | null;
          views_subscribers: number;
          views_nonsubscribers: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          creator_id: string;
          min_tier_id?: string | null;
          is_exclusive?: boolean;
          preview_text?: string | null;
          views_subscribers?: number;
          views_nonsubscribers?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          creator_id?: string;
          min_tier_id?: string | null;
          is_exclusive?: boolean;
          preview_text?: string | null;
          views_subscribers?: number;
          views_nonsubscribers?: number;
          created_at?: string;
        };
      };
      // MODERATION
      moderation_logs: {
        Row: {
          id: string;
          content_type: string;
          content_id: string;
          user_id: string;
          flagged_categories: string[];
          severity: string;
          confidence_score: number;
          action_taken: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_type: string;
          content_id: string;
          user_id: string;
          flagged_categories?: string[];
          severity: string;
          confidence_score: number;
          action_taken: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_type?: string;
          content_id?: string;
          user_id?: string;
          flagged_categories?: string[];
          severity?: string;
          confidence_score?: number;
          action_taken?: string;
          created_at?: string;
        };
      };
      content_reports: {
        Row: {
          id: string;
          reporter_id: string;
          content_type: string;
          content_id: string;
          reason: string;
          description: string | null;
          status: "pending" | "reviewed" | "action_taken" | "dismissed";
          moderator_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          content_type: string;
          content_id: string;
          reason: string;
          description?: string | null;
          status?: "pending" | "reviewed" | "action_taken" | "dismissed";
          moderator_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          content_type?: string;
          content_id?: string;
          reason?: string;
          description?: string | null;
          status?: "pending" | "reviewed" | "action_taken" | "dismissed";
          moderator_notes?: string | null;
          created_at?: string;
        };
      };
      // GAMIFICATION
      achievements: {
        Row: {
          id: string;
          code: string;
          title_fr: string;
          description_fr: string;
          points: number;
          icon: string;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title_fr: string;
          description_fr: string;
          points: number;
          icon: string;
          category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          title_fr?: string;
          description_fr?: string;
          points?: number;
          icon?: string;
          category?: string;
          created_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
      };
      daily_challenges: {
        Row: {
          id: string;
          type: string;
          title_fr: string;
          description_fr: string;
          target_count: number;
          points_reward: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          title_fr: string;
          description_fr: string;
          target_count: number;
          points_reward: number;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          title_fr?: string;
          description_fr?: string;
          target_count?: number;
          points_reward?: number;
          date?: string;
          created_at?: string;
        };
      };
      // LIVE STREAMING
      live_streams: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          status: "live" | "ended";
          viewer_count: number;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          status?: "live" | "ended";
          viewer_count?: number;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          status?: "live" | "ended";
          viewer_count?: number;
          started_at?: string;
          ended_at?: string | null;
        };
      };
      // MARKETPLACE
      products: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string;
          price: number;
          image_urls: string[];
          category: string;
          is_sold: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          description: string;
          price: number;
          image_urls: string[];
          category: string;
          is_sold?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          title?: string;
          description?: string;
          price?: number;
          image_urls?: string[];
          category?: string;
          is_sold?: boolean;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          buyer_id: string;
          seller_id: string;
          product_id: string;
          amount_cents: number;
          status: "pending" | "paid" | "shipped" | "completed" | "refunded";
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          seller_id: string;
          product_id: string;
          amount_cents: number;
          status?: "pending" | "paid" | "shipped" | "completed" | "refunded";
          created_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          seller_id?: string;
          product_id?: string;
          amount_cents?: number;
          status?: "pending" | "paid" | "shipped" | "completed" | "refunded";
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_subscribed_to: {
        Args: { p_subscriber_id: string; p_creator_id: string };
        Returns: boolean;
      };
      get_creator_mrr: {
        Args: { p_creator_id: string };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
