/**
 * Bottom navigation bar — gold active glow, fire icons, premium create button
 * Matches App Store screenshot design
 */

import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import { getUnreadNotificationCount } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";


interface NavItem {
  to: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
  isCreate?: boolean;
}

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={active ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={active ? 0 : 2}
    viewBox="0 0 24 24"
  >
    {active ? (
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    )}
  </svg>
);

const SearchIcon = ({ active }: { active: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={active ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={active ? 0 : 2}
    viewBox="0 0 24 24"
  >
    {active ? (
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    )}
  </svg>
);

const BellIcon = ({ active }: { active: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={active ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={active ? 0 : 2}
    viewBox="0 0 24 24"
  >
    {active ? (
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    )}
  </svg>
);

const InboxIcon = ({ active }: { active: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={active ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={active ? 0 : 2}
    viewBox="0 0 24 24"
  >
    {active ? (
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
      />
    )}
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={active ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={active ? 0 : 2}
    viewBox="0 0 24 24"
  >
    {active ? (
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    )}
  </svg>
);

/** Gold plus create button */
const CreateButton: React.FC = () => (
  <div
    className="relative flex items-center justify-center w-14 h-9 rounded-xl"
    style={{
      background:
        "linear-gradient(135deg, #FFD700 0%, #C9A227 60%, #8B6914 100%)",
      boxShadow: "0 0 16px rgba(212,175,55,0.5), 0 2px 8px rgba(0,0,0,0.5)",
    }}
  >
    <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  </div>
);

const ArcadeIcon = ({ active }: { active: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={active ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={active ? 0 : 2}
    viewBox="0 0 24 24"
  >
    {active ? (
      <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
      />
    )}
  </svg>
);

const navItems: NavItem[] = [
  {
    to: "/",
    label: "Accueil",
    icon: <HomeIcon active={false} />,
    activeIcon: <HomeIcon active={true} />,
  },
  {
    to: "/explore",
    label: "Découvrir",
    icon: <SearchIcon active={false} />,
    activeIcon: <SearchIcon active={true} />,
  },
  {
    to: "/upload",
    label: "Créer",
    icon: <CreateButton />,
    activeIcon: <CreateButton />,
    isCreate: true,
  },
  {
    to: "/arcade",
    label: "Arcade",
    icon: <ArcadeIcon active={false} />,
    activeIcon: <ArcadeIcon active={true} />,
  },
  {
    to: "/profile/me",
    label: "Profil",
    icon: <ProfileIcon active={false} />,
    activeIcon: <ProfileIcon active={true} />,
  },
];

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      getUnreadNotificationCount().then((count) => setUnreadCount(count));
    }
  }, [user]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom lg:hidden"
      style={{
        background: "rgba(0,0,0,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(212,175,55,0.25)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.6)",
        maxWidth: "430px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      {/* Gold nav accent line */}
      <div
        className="w-full h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.4) 30%, rgba(255,215,0,0.6) 50%, rgba(212,175,55,0.4) 70%, transparent 100%)",
        }}
      />
      <div className="px-1">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              aria-label={item.label}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 relative min-w-[52px]",
                  item.isCreate ? "mt-1" : "",
                  !item.isCreate &&
                    (isActive ? "text-gold-400" : "text-white/50"),
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active glow dot */}
                  {isActive && !item.isCreate && (
                    <div
                      className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, #FFD700, transparent)",
                        boxShadow: "0 0 6px rgba(255,215,0,0.8)",
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "transition-all duration-200 relative",
                      isActive &&
                        !item.isCreate &&
                        "drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]",
                    )}
                  >
                    {isActive ? item.activeIcon : item.icon}
                    
                    {/* Unread badge on the Activity tab */}
                    {item.to === "/notifications" && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>


                  {/* Label — hidden for create */}
                  {!item.isCreate && (
                    <span className="text-[10px] font-medium tracking-wide">
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};
