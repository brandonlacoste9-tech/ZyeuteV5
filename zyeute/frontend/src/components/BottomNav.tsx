/**
 * Bottom Navigation - Premium Quebec Heritage Design
 * Leather texture with gold stitching and glowing icons
 */

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "../lib/utils";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  {
    to: "/",
    label: "Accueil",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
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
    label: "Découvrir",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
    ),
  },
  {
    to: "/upload",
    label: "Créer",
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
    to: "/notifications",
    label: "Notifs",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
    ),
  },
  {
    to: "/profile/me",
    label: "Profil",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
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
                        {item.label}
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
