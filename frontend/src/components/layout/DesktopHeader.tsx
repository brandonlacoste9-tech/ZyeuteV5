import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FlameEyeIcon } from "@/components/ui/Logo";
import {
  IoSearchOutline,
  IoNotificationsOutline,
  IoChatbubbleEllipsesOutline,
  IoAdd,
} from "react-icons/io5";

export const DesktopHeader: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black border-b border-leather-800 z-50 hidden lg:flex items-center px-4 justify-between">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 w-[220px]">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-gold-gradient p-[1px]">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gold-400/20 mix-blend-overlay" />
              <FlameEyeIcon className="w-5 h-5 text-gold-400" />
            </div>
          </div>
          <span className="text-xl font-black tracking-tighter uppercase text-white">
            ZYEUTÉ
          </span>
        </Link>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-[500px]">
        <div className="relative group">
          <input
            type="text"
            placeholder="Rechercher des vidéos, des créateurs..."
            className="w-full bg-leather-900/50 hover:bg-leather-900 focus:bg-leather-900 border border-transparent focus:border-leather-700 text-white rounded-full py-2.5 pl-5 pr-12 outline-none transition-all placeholder:text-leather-400"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.currentTarget.value) {
                navigate(`/search?q=${encodeURIComponent(e.currentTarget.value)}`);
              }
            }}
          />
          <button className="absolute right-0 top-0 bottom-0 px-4 text-leather-400 hover:text-white rounded-r-full hover:bg-leather-800 transition-colors flex items-center">
            <IoSearchOutline size={20} />
          </button>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-5 w-[300px] justify-end">
        <Link
          to="/upload"
          className="flex items-center gap-2 px-4 py-1.5 bg-leather-900 hover:bg-leather-800 border border-leather-700 rounded-sm text-white font-semibold transition-colors"
        >
          <IoAdd size={20} />
          <span>Créer</span>
        </Link>

        {user ? (
          <>
            <Link to="/messages" className="text-leather-300 hover:text-white transition-colors relative">
              <IoChatbubbleEllipsesOutline size={26} />
              {/* Optional unread badge can go here */}
            </Link>
            <Link to="/notifications" className="text-leather-300 hover:text-white transition-colors relative">
              <IoNotificationsOutline size={26} />
            </Link>
            <Link to="/profile/me" className="ml-2 w-8 h-8 rounded-full overflow-hidden border border-leather-700 hover:border-gold-500 transition-colors">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-black font-bold rounded-lg transition-colors ml-2"
          >
            Connexion
          </Link>
        )}
      </div>
    </header>
  );
};
