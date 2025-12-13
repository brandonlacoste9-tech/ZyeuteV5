/**
 * Header component with gold gradient and navigation
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../contexts/NotificationContext';
import { Logo } from '../ui/Logo';

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

  return (
    <header
      className={cn(
        'sticky top-0 z-50',
        'bg-gradient-to-r from-[#F9DB6D] via-[#F5C842] to-[#D4AF37]',
        'border-b border-black/20',
        'shadow-lg shadow-gold/30',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo or Back button */}
        <div className="flex items-center gap-4">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-black/10 rounded-full transition-all hover:scale-110"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6 text-black"
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
            <h1 className="text-xl font-bold text-black">{title}</h1>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <Link
              to="/explore"
              className="p-2 hover:bg-black/10 rounded-full transition-all hover:scale-110"
              aria-label="Search"
            >
              <svg
                className="w-6 h-6 text-black"
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
            </Link>
          )}

          <Link
            to="/notifications"
            className="p-2 hover:bg-black/10 rounded-full transition-all hover:scale-110 relative"
            aria-label="Notifications"
          >
            <svg
              className="w-6 h-6 text-black"
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
            {/* Notification badge with count */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-600 rounded-full ring-2 ring-gold-400 flex items-center justify-center text-white text-xs font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            to="/settings"
            className="p-2 hover:bg-black/10 rounded-full transition-all hover:scale-110"
            aria-label="Settings"
          >
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
};
