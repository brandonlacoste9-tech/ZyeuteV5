/**
 * GuestBanner Component
 * Conversion funnel for guest users to create an account
 * Shows after 3 views with countdown timer
 */
import React from "react";
import { Link } from "react-router-dom";
import { useGuestMode } from "../hooks/useGuestMode";
import { useAuth } from "../contexts/AuthContext";
import { X, Sparkles, Clock } from "lucide-react";
import { useTranslation } from "../i18n";
import { Button } from "@/components/ui/button";
import { AppConfig } from "../config/factory";

export const GuestBanner: React.FC = () => {
  const { t } = useTranslation();
  const { isGuest, viewsCount, remainingTime } = useGuestMode();
  const { user } = useAuth(); // Check if user is authenticated
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Dynamic theme colors
  const theme = AppConfig.theme;

  // Don't show if:
  // - User is authenticated (has a user account)
  // - Not a guest
  // - Dismissed
  // - Haven't viewed enough pages (3)
  if (user || !isGuest || isDismissed || viewsCount < 3) return null;

  const hoursRemaining = Math.floor(remainingTime / (1000 * 60 * 60));
  const minutesRemaining = Math.floor(
    (remainingTime % (1000 * 60 * 60)) / (1000 * 60),
  );

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-700">
      <div
        className="max-w-3xl mx-auto leather-card stitched border rounded-2xl p-1 overflow-hidden"
        style={{
          borderColor: `${theme.primary}30`,
          boxShadow: `0 0 50px -12px ${theme.glowColor.replace("0.4", "0.3")}`,
        }}
      >
        {/* Glossy highlight effect */}
        <div
          className="absolute inset-x-0 top-0 h-px opacity-50"
          style={{
            background: `linear-gradient(to right, transparent, ${theme.edgeLighting}80, transparent)`,
          }}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-b from-white/5 to-transparent">
          {/* Content Section */}
          <div className="flex items-center gap-4 text-left">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${theme.primary}1A`,
                borderColor: `${theme.primary}33`,
                borderWidth: "1px",
                borderStyle: "solid",
                boxShadow: `0 0 15px ${theme.glowColor.replace("0.4", "0.2")}`,
              }}
            >
              <Clock
                className="w-5 h-5 animate-pulse"
                style={{ color: theme.accent }}
              />
            </div>
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                {t("guest.mode")}
                <span
                  className="text-xs font-mono px-1.5 py-0.5 rounded border"
                  style={{
                    backgroundColor: `${theme.edgeLighting}33`,
                    color: theme.edgeLighting,
                    borderColor: `${theme.edgeLighting}33`,
                  }}
                >
                  {hoursRemaining}h {minutesRemaining}m
                </span>
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                {t("guest.description")}
              </p>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              asChild
              className="btn-leather font-bold border-0 flex-1 sm:flex-initial"
              style={{ color: theme.accent }}
            >
              <Link to="/signup" className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2" />
                {t("guest.cta")}
              </Link>
            </Button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-500 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
