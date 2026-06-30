/**
 * Bottom Navigation - Premium Quebec Heritage Design
 * Leather texture with gold stitching and glowing icons
 */

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useHaptics } from "@/hooks/useHaptics";
import { useTranslation } from "@/i18n";
import { cn } from "../lib/utils";
import { useMessaging } from "@/contexts/MessagingContext";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  labelKey: string;
}

const navItems: NavItem[] = [
  {
    to: "/feed",
    labelKey: "nav.home",
    icon: <img src="/assets/icons/icon-home.png" alt="Home" className="w-6 h-6 object-contain" style={{ filter: 'grayscale(100%) opacity(0.5)' }} />,
    activeIcon: <img src="/assets/icons/icon-home.png" alt="Home Active" className="w-6 h-6 object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.8))' }} />,
  },
  {
    to: "/explore",
    labelKey: "nav.discover",
    icon: <img src="/assets/icons/icon-search.png" alt="Discover" className="w-6 h-6 object-contain" style={{ filter: 'grayscale(100%) opacity(0.5)' }} />,
    activeIcon: <img src="/assets/icons/icon-search.png" alt="Discover Active" className="w-6 h-6 object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.8))' }} />,
  },
  {
    to: "/messages",
    labelKey: "nav.messages",
    icon: <img src="/assets/icons/icon-messages.png" alt="Messages" className="w-6 h-6 object-contain" style={{ filter: 'grayscale(100%) opacity(0.5)' }} />,
    activeIcon: <img src="/assets/icons/icon-messages.png" alt="Messages Active" className="w-6 h-6 object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.8))' }} />,
  },
  {
    to: "/upload",
    labelKey: "nav.create",
    icon: (
      <div className="relative flex items-center justify-center w-full h-full">
        <img src="/assets/icons/icon-upload.png" alt="Create" className="w-8 h-8 object-contain" style={{ filter: 'grayscale(100%) opacity(0.8)' }} />
      </div>
    ),
    activeIcon: (
      <div className="relative flex items-center justify-center w-full h-full">
        <img src="/assets/icons/icon-upload.png" alt="Create Active" className="w-8 h-8 object-contain" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }} />
      </div>
    ),
  },
  {
    to: "/arcade",
    labelKey: "nav.arcade",
    icon: <img src="/assets/icons/icon-arcade.png" alt="Arcade" className="w-6 h-6 object-contain" style={{ filter: 'grayscale(100%) opacity(0.5)' }} />,
    activeIcon: <img src="/assets/icons/icon-arcade.png" alt="Arcade Active" className="w-6 h-6 object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.8))' }} />,
  },
  {
    to: "/profile/me",
    labelKey: "nav.profile",
    icon: <img src="/assets/icons/icon-profile.png" alt="Profile" className="w-6 h-6 object-contain" style={{ filter: 'grayscale(100%) opacity(0.5)' }} />,
    activeIcon: <img src="/assets/icons/icon-profile.png" alt="Profile Active" className="w-6 h-6 object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.8))' }} />,
  },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { tap } = useHaptics();
  const { t } = useTranslation();
  const { dmUnread } = useMessaging();

  // Helper to check if a path is active (handles profile routes)
  const isActivePath = (path: string): boolean => {
    if (path === "/profile/me") {
      return (
        location.pathname === "/profile/me" ||
        location.pathname.startsWith("/profile/")
      );
    }
    if (path === "/") {
      return location.pathname === "/";
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: "linear-gradient(to top, #0f0c0e 0%, #1a1418 100%)",
        boxShadow:
          "0 -10px 40px rgba(0,0,0,0.8), 0 -2px 20px rgba(255, 191, 0, 0.15)",
        borderTop: "1px solid rgba(255, 191, 0, 0.4)",
      }}
    >
      {/* Gold Glow Line at Top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500/60 to-transparent"
        style={{ boxShadow: "0 0 15px rgba(255, 191, 0, 0.5)" }}
      />
      <div className="absolute top-[4px] left-6 right-6 border-t border-dashed border-gold-500/30" />

      <div className="max-w-7xl mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = isActivePath(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => tap()} // Haptic feedback on navigation
                className={({ isActive: navLinkActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-300 relative",
                    item.to === "/upload" ? "-mt-4" : "",
                    isActive || navLinkActive
                      ? "text-gold-400"
                      : "text-neutral-500 hover:text-gold-500/70",
                  )
                }
              >
                {({ isActive: navLinkActive }) => {
                  const active = isActive || navLinkActive;

                  return (
                    <>
                      {/* Active Glow Indicator */}
                      {active && (
                        <>
                          {/* Top Bar */}
                          <div
                            className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                            style={{
                              background:
                                "linear-gradient(90deg, #B8860B, #FFD700, #B8860B)",
                              boxShadow: "0 0 10px rgba(255,191,0,0.6)",
                            }}
                          />
                          {/* Background Glow */}
                          <div
                            className="absolute inset-0 rounded-xl opacity-20"
                            style={{
                              background:
                                "radial-gradient(circle, rgba(255,191,0,0.4) 0%, transparent 70%)",
                            }}
                          />
                        </>
                      )}

                      {/* Upload Button Special Styling */}
                      {item.to === "/upload" ? (
                        <div
                          className="relative p-1 rounded-full transition-all duration-300"
                          style={{
                            background: active
                              ? "linear-gradient(135deg, #FFD700 0%, #DAA520 100%)"
                              : "linear-gradient(135deg, #3a3530 0%, #252320 100%)",
                            boxShadow: active
                              ? "0 0 20px rgba(255,191,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)"
                              : "0 4px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
                            border: `2px solid ${active ? "rgba(255,191,0,0.8)" : "rgba(255,191,0,0.3)"}`,
                          }}
                        >
                          <div
                            className={active ? "text-black" : "text-gold-400"}
                          >
                            {active ? item.activeIcon : item.icon}
                          </div>
                        </div>
                      ) : (
                        /* Icon with Glow Effect */
                        <div
                          className="relative z-10 transition-all duration-300"
                          style={{
                            filter: active
                              ? "drop-shadow(0 0 8px rgba(255,191,0,0.6))"
                              : "none",
                          }}
                        >
                          {active ? item.activeIcon : item.icon}
                          {/* DM unread badge on Messages tab */}
                          {item.to === "/messages" && dmUnread > 0 && (
                            <span
                              className="absolute -top-1 -right-1 text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                              style={{
                                background: "#D4AF37",
                                color: "#1A0F0A",
                                boxShadow: "0 0 6px rgba(212,175,55,0.8)",
                              }}
                            >
                              {dmUnread > 9 ? "9+" : dmUnread}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Label */}
                      <span
                        className={cn(
                          "text-[10px] font-semibold tracking-wide relative z-10 transition-all duration-300",
                          item.to === "/upload" && "sr-only",
                        )}
                        style={{
                          textShadow: active
                            ? "0 0 10px rgba(255,191,0,0.5)"
                            : "none",
                        }}
                      >
                        {t(item.labelKey)}
                      </span>
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Bottom Safe Area Fill */}
      <div
        className="h-[env(safe-area-inset-bottom)]"
        style={{ background: "#0d0c0b" }}
      />
    </nav>
  );
};
