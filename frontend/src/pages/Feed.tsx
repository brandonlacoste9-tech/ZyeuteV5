/**
 * Feed Page - Premium Quebec Heritage Design
 * Leather post cards with gold accents and stitching
 */

import React, { useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { StoryCarousel } from "@/components/features/StoryCircle";
import { GiftModal } from "@/components/features/GiftModal";
import { GiftOverlay } from "@/components/features/GiftOverlay";
import { Onboarding, useOnboarding } from "@/components/Onboarding";
import { getCurrentUser, getStories } from "@/services/api";
import { ContinuousFeed } from "@/components/features/ContinuousFeed";
import ChoixDuGrandCastor from "@/components/features/ChoixDuGrandCastor";
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary";
import { AvatarSkeleton } from "@/components/ui/Skeleton";
import { HamburgerMenu } from "@/components/layout/HamburgerMenu";
import { FlameEyeIcon } from "@/components/ui/Logo";

import type { User, Story } from "@/types";
import { logger } from "../lib/logger";
import { useGuestMode } from "@/hooks/useGuestMode";
import {
  detectHiveFromBrowser,
  detectLanguageFromBrowser,
  detectRegionFromTimezone,
} from "../lib/geoDetect";
import { DailyGratteuxModal } from "@/components/gamification/DailyGratteuxModal";
import { trackDailyInteract } from "@/services/gamificationService";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

const feedLogger = logger.withContext("Feed");

// Gift emoji lookup moved outside to avoid re-creation on every render
/** Découverte / Abonnements tab bar — matches App Store screenshot */
const FeedTabBar: React.FC = () => {
  const [active, setActive] = React.useState<"decouverte" | "abonnements">(
    "decouverte",
  );
  return (
    <div className="flex items-center gap-6 mt-2 pb-0">
      {(["decouverte", "abonnements"] as const).map((tab) => {
        const isActive = active === tab;
        const label = tab === "decouverte" ? "Découverte" : "Abonnements";
        return (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className="relative pb-2.5 text-sm font-semibold transition-colors"
            style={{ color: isActive ? "#FFD700" : "rgba(255,255,255,0.45)" }}
          >
            {label}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #FFD700, transparent)",
                  boxShadow: "0 0 6px rgba(255,215,0,0.7)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

const GIFT_EMOJIS: Record<string, string> = {
  comete: "☄️",
  feuille_erable: "⚜️",
  fleur_de_lys: "⚜️",
  feu: "🔥",
  coeur_or: "💛",
};

export const Feed: React.FC = () => {
  const location = useLocation();

  // State for stories and user (restored)
  const [stories, setStories] = React.useState<
    Array<{ user: User; story?: Story; isViewed?: boolean }>
  >([]);
  const [isLoadingStories, setIsLoadingStories] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  // GUARD: Prevent duplicate fetches
  const hasFetchedUser = React.useRef(false);
  const hasFetchedStories = React.useRef(false);

  const { showOnboarding, isChecked, completeOnboarding, notifyVideoScrolled } =
    useOnboarding();
  const { incrementViews } = useGuestMode();

  // Gift modal state
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Gift overlay animation state
  const [showGiftOverlay, setShowGiftOverlay] = useState(false);
  const [sentGiftEmoji, setSentGiftEmoji] = useState("");
  const [sentGiftType, setSentGiftType] = useState("");
  const [sentGiftRecipientName, setSentGiftRecipientName] = useState("");

  // Increment guest view counter on page load
  React.useEffect(() => {
    incrementViews();
  }, [incrementViews]);

  // Fetch current user - GUARDED
  React.useEffect(() => {
    if (hasFetchedUser.current) return;
    hasFetchedUser.current = true;

    const fetchCurrentUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        // Track daily interact for streak (fire-and-forget — don't block UI)
        trackDailyInteract().catch(() => {});

        // Auto-detect hive/language if not already set
        const storedHive = localStorage.getItem("zyeute_hive_id");
        if (!(user as any).hiveId || !storedHive) {
          const detectedHive = detectHiveFromBrowser();
          const detectedLang = detectLanguageFromBrowser();
          const detectedRegion = detectRegionFromTimezone(detectedHive);

          localStorage.setItem("zyeute_hive_id", detectedHive);
          localStorage.setItem("zyeute_language", detectedLang);

          // Persist to backend — fire-and-forget, never block UI
          fetch("/api/users/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              hive_id: detectedHive,
              preferred_language: detectedLang,
              region_id: detectedRegion,
            }),
          }).catch(() => {});
        }
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch stories - GUARDED
  React.useEffect(() => {
    if (hasFetchedStories.current) return;
    hasFetchedStories.current = true;

    const fetchStories = async () => {
      try {
        const storyList = await getStories(currentUser?.id);
        setStories(storyList || []);
      } catch (error) {
        feedLogger.error("Error fetching stories:", error);
      } finally {
        setIsLoadingStories(false);
      }
    };

    fetchStories();
  }, [currentUser]);

  // Handle gift button click
  const handleGift = useCallback(
    (postId: string, recipient: User) => {
      const guestMode = localStorage.getItem("zyeute_guest_mode");
      if (guestMode === "true") {
        alert("Inscrivez-vous pour envoyer des cadeaux ! 🎁");
        return;
      }
      if (!currentUser) {
        alert("Tu dois être connecté pour envoyer un cadeau! 🎁");
        return;
      }
      if (currentUser.id === recipient.id) {
        alert("Tu ne peux pas t'envoyer un cadeau! 😅");
        return;
      }
      setSelectedPostId(postId);
      setSelectedRecipient(recipient);
      setGiftModalOpen(true);
    },
    [currentUser],
  );

  // Handle gift sent - update gift count and show overlay
  const handleGiftSent = useCallback(
    (giftType: string) => {
      // Trigger overlay animation
      setSentGiftType(giftType);
      setSentGiftEmoji(GIFT_EMOJIS[giftType] || "🎁");
      setSentGiftRecipientName(
        selectedRecipient?.display_name ||
          selectedRecipient?.username ||
          "Créateur",
      );
      setShowGiftOverlay(true);

      setGiftModalOpen(false);
      setSelectedRecipient(null);
      setSelectedPostId(null);
    },
    [selectedRecipient],
  );

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">
      {/* Network Resilience: Offline Banner */}
      <OfflineBanner />

      {/* Daily Bonus Modal */}
      <DailyGratteuxModal />

      {/* First-time user onboarding */}
      {isChecked && showOnboarding && (
        <Onboarding onComplete={completeOnboarding} />
      )}

      {/* Premium Header - Fixed Top */}
      <div
        className="flex-none z-30"
        style={{
          background: "rgba(0,0,0,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(212,175,55,0.2)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-0">
          <div className="flex items-center justify-between">
            {/* Left: menu + logo */}
            <div className="flex items-center gap-2">
              <HamburgerMenu />
              <div className="flex items-center gap-1.5">
                <div
                  style={{
                    filter: "drop-shadow(0 0 5px rgba(212,175,55,0.6))",
                  }}
                >
                  <FlameEyeIcon className="w-7 h-7" />
                </div>
                <span
                  className="text-lg font-black tracking-widest uppercase"
                  style={{
                    background:
                      "linear-gradient(135deg, #FFD700 0%, #C9A227 50%, #FFE566 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Zyeuté
                </span>
              </div>
            </div>
            {/* Right: search + VIP */}
            <div className="flex items-center gap-2">
              <Link
                to="/explore"
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-gold-400"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </Link>
              <Link
                to="/premium"
                className="text-black text-[10px] font-black px-2.5 py-1 rounded-lg transition-all"
                style={{
                  background: "linear-gradient(135deg, #FFD700, #C9A227)",
                  boxShadow: "0 0 10px rgba(212,175,55,0.4)",
                }}
              >
                VIP
              </Link>
            </div>
          </div>

          {/* Découverte / Abonnements tab bar */}
          <FeedTabBar />
        </div>

        {/* Stories Section (Integrated into Header area) */}
        {isLoadingStories ? (
          <div className="py-2 bg-black/40 backdrop-blur-sm border-t border-white/5 flex gap-4 px-4 overflow-x-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <AvatarSkeleton
                key={i}
                size="w-16 h-16"
                className="rounded-full border-2 border-neutral-800"
              />
            ))}
          </div>
        ) : (
          stories.length > 0 && (
            <div className="py-2 bg-black/40 backdrop-blur-sm border-t border-white/5">
              <ErrorBoundary
                fallback={
                  <div className="h-24 flex items-center justify-center text-xs text-white/30">
                    Histoires indisponibles
                  </div>
                }
              >
                <StoryCarousel stories={stories} />
              </ErrorBoundary>
            </div>
          )
        )}

        {/* Gold accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gold-500/20" />
      </div>

      {/* ⚜️ LES CHOIX DU GRAND CASTOR ⚜️ */}
      <section className="flex-none bg-black">
        <ErrorBoundary fallback={null}>
          <ChoixDuGrandCastor />
        </ErrorBoundary>
      </section>

      {/* Main Content - Continuous Video Feed */}
      <div className="flex-1 w-full bg-black relative">
        <ErrorBoundary
          fallback={<ErrorFallback onRetry={() => window.location.reload()} />}
        >
          <ContinuousFeed onVideoChange={() => notifyVideoScrolled()} />
        </ErrorBoundary>
      </div>

      {/* Gift Modal */}
      {selectedRecipient && selectedPostId && (
        <GiftModal
          recipient={selectedRecipient}
          postId={selectedPostId}
          isOpen={giftModalOpen}
          onClose={() => {
            setGiftModalOpen(false);
            setSelectedRecipient(null);
            setSelectedPostId(null);
          }}
          onGiftSent={handleGiftSent}
        />
      )}

      {/* Gift Overlay Animation */}
      <GiftOverlay
        giftType={sentGiftType}
        emoji={sentGiftEmoji}
        recipientName={sentGiftRecipientName}
        isVisible={showGiftOverlay}
        onComplete={() => setShowGiftOverlay(false)}
      />
    </div>
  );
};

export default Feed;
