/**
 * Header component with gold gradient and navigation
 * Updated for Leather & Gold Premium Theme (HMR Trigger)
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useNotifications } from "../contexts/NotificationContext";
import { Logo } from "./Logo";
import { StreakButton } from "./features/StreakButton";

export interface HeaderProps {
  showSearch?: boolean;
  title?: string;
  showBack?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  showSearch = true,
  title,
  showBack = false,
  className,
}) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const isCustomStyles =
    className?.includes("bg-") || className?.includes("border-");

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        !isCustomStyles && "backdrop-blur-md shadow-lg",
        className,
      )}
      style={
        !isCustomStyles
          ? {
              background:
                "linear-gradient(to bottom, rgba(26, 20, 24, 0.98) 0%, rgba(15, 12, 14, 0.95) 100%)",
              borderBottom: "1px solid rgba(255, 191, 0, 0.4)",
              boxShadow:
                "0 4px 20px rgba(0, 0, 0, 0.5), 0 2px 15px rgba(255, 191, 0, 0.1)",
            }
          : {}
      }
    >
      {/* Gold Glow Line at Bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"
        style={{ boxShadow: "0 0 10px rgba(255, 191, 0, 0.4)" }}
      ></div>
      <div className="absolute bottom-[4px] left-0 right-0 border-b border-dashed border-gold-500/25 opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo or Back button */}
        <div className="flex items-center gap-4">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full transition-all hover:scale-110 hover:bg-gold-500/10 group"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6 text-gold-400 group-hover:text-gold-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          ) : (
            <Logo size="sm" showText={true} linkTo="/" />
          )}

          {title && (
            <h1 className="text-xl font-bold text-gold-400 embossed tracking-wide">
              {title}
            </h1>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <StreakButton />
          
          {showSearch && (
            <Link
              to="/explore"
              className="p-2 rounded-full transition-all hover:scale-110 hover:bg-gold-500/10 group"
              aria-label="Search"
            >
              <img
                src="/assets/icons/icon-search.png"
                alt="Search"
                className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(255,191,0,0.6)] group-hover:scale-110 transition-transform"
                loading="lazy"
              />
            </Link>
          )}

          <Link
            to="/leaderboard"
            className="p-2 rounded-full transition-all hover:scale-110 hover:bg-gold-500/10 group"
            aria-label="Leaderboard"
          >
            <img
              src="/assets/icons/icon-trophy.png"
              alt="Leaderboard"
              className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(255,191,0,0.6)] group-hover:scale-110 transition-transform"
              loading="lazy"
            />
          </Link>

          <Link
            to="/notifications"
            className="p-2 rounded-full transition-all hover:scale-110 hover:bg-gold-500/10 relative group"
            aria-label="Notifications"
          >
            <img
              src="/assets/icons/icon-bell.png"
              alt="Notifications"
              className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(255,191,0,0.6)] group-hover:scale-110 transition-transform"
              loading="lazy"
            />
            {/* Notification badge with count */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-600 rounded-full border border-gold-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <Link
            to="/settings"
            className="p-2 rounded-full transition-all hover:scale-110 hover:bg-gold-500/10 group"
            aria-label="Settings"
          >
            <img
              src="/assets/icons/icon-gear.png"
              alt="Settings"
              className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(255,191,0,0.6)] group-hover:scale-110 transition-transform"
              loading="lazy"
            />
          </Link>

          {/* Québec Or emblem — top right, small */}
          <img
            src="/quebec-emblem.png"
            alt="Québec Or"
            className="h-7 w-auto object-contain ml-1 shrink-0 opacity-90 hover:opacity-100 transition-opacity"
            width={28}
            height={28}
            loading="lazy"
          />
        </div>
      </div>
    </header>
  );
};
