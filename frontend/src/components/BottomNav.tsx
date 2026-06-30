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
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    to: "/explore",
    labelKey: "nav.discover",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
    ),
  },
  {
    to: "/messages",
    labelKey: "nav.messages",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
      </svg>
    ),
  },
  {
    to: "/upload",
    labelKey: "nav.create",
    icon: (
      <div className="relative">
        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
        </svg>
      </div>
    ),
    activeIcon: (
      <div className="relative">
        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
        </svg>
      </div>
    ),
  },
  {
    to: "/arcade",
    labelKey: "nav.arcade",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <line x1="6" x2="10" y1="12" y2="12" />
        <line x1="8" x2="8" y1="10" y2="14" />
        <line x1="15" x2="15.01" y1="13" y2="13" />
        <line x1="18" x2="18.01" y1="11" y2="11" />
        <rect width="20" height="12" x="2" y="6" rx="2" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" stroke="currentColor" strokeWidth={0} viewBox="0 0 24 24">
        <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
      </svg>
    ),
  },
  {
    to: "/profile/me",
    labelKey: "nav.profile",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    ),
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
