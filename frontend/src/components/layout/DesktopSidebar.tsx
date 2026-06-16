import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FlameEyeIcon } from "@/components/ui/Logo";
import { toast } from "@/components/Toast";
import { apiCall } from "@/services/api";
import {
  IoHomeOutline,
  IoHome,
  IoCompassOutline,
  IoCompass,
  IoCloudUploadOutline,
  IoCloudUpload,
  IoPersonOutline,
  IoPerson,
  IoRefreshOutline,
} from "react-icons/io5";

export const DesktopSidebar: React.FC = () => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  const isAdmin = user?.isAdmin || user?.role === "founder" || user?.role === "moderator";

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const res = await apiCall<{ stats: { imported: number } }>("/admin/force-sync-feed", { method: "POST" });
      if (res.error) throw new Error(res.error);
      const imported = res.data?.stats?.imported || 0;
      toast.success(`Success! Imported ${imported} new videos.`);
    } catch (e: any) {
      toast.error(e.message || "Failed to force sync");
    } finally {
      setIsSyncing(false);
    }
  };

  const navItems = [
    {
      to: "/",
      label: "Pour Toi",
      icon: <IoHomeOutline className="w-7 h-7" />,
      activeIcon: <IoHome className="w-7 h-7 text-gold-400 drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]" />,
    },
    {
      to: "/explore",
      label: "Explorer",
      icon: <IoCompassOutline className="w-7 h-7" />,
      activeIcon: <IoCompass className="w-7 h-7 text-gold-400 drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]" />,
    },
    {
      to: "/upload",
      label: "Créer",
      icon: <IoCloudUploadOutline className="w-7 h-7" />,
      activeIcon: <IoCloudUpload className="w-7 h-7 text-gold-400 drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]" />,
    },
    {
      to: "/profile/me",
      label: "Profil",
      icon: <IoPersonOutline className="w-7 h-7" />,
      activeIcon: <IoPerson className="w-7 h-7 text-gold-400 drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]" />,
    },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-[240px] hidden lg:flex flex-col border-r border-leather-800 bg-black z-40 overflow-y-auto">
      <div className="flex-1 py-4 px-2">
        <nav className="space-y-1 mb-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group hover:bg-leather-900 ${
                  isActive ? "text-gold-400 font-bold" : "text-white hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    {isActive && (
                      <div className="absolute inset-0 bg-gold-400/20 blur-md rounded-full" />
                    )}
                    {isActive ? item.activeIcon : item.icon}
                  </div>
                  <span className="text-[17px]">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="h-px bg-leather-800 my-4 mx-2" />

        {isAdmin && (
          <div className="px-3 mb-6">
            <h3 className="text-leather-400 font-semibold text-sm mb-3 px-1">Admin Tools</h3>
            <button
              onClick={handleForceSync}
              disabled={isSyncing}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl bg-gold-600/10 hover:bg-gold-600/20 text-gold-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoRefreshOutline className={`w-5 h-5 ${isSyncing ? "animate-spin" : ""}`} />
              <span className="text-sm">{isSyncing ? "Scraping..." : "Force Sync Feed"}</span>
            </button>
          </div>
        )}

        {user ? (
          <div className="px-3">
            <h3 className="text-leather-400 font-semibold text-sm mb-4 px-1">Abonnements</h3>
            <p className="text-leather-500 text-sm px-1">Comptes que tu suis...</p>
            {/* TODO: Add actual following list fetched from API */}
          </div>
        ) : (
          <div className="px-4 py-4 rounded-xl bg-leather-900/50 border border-leather-800 mx-2 text-center">
            <p className="text-leather-300 text-sm mb-4">Connecte-toi pour suivre des créateurs, aimer des vidéos et voir tes abonnements.</p>
            <Link to="/login" className="block w-full py-2 bg-gold-600 hover:bg-gold-500 text-black font-bold rounded-lg transition-colors">
              Connexion
            </Link>
          </div>
        )}
      </div>

      <div className="px-5 py-6 text-xs text-leather-500 leading-relaxed">
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-4">
          <Link to="/about" className="hover:underline">À propos</Link>
          <Link to="/newsroom" className="hover:underline">Newsroom</Link>
          <Link to="/contact" className="hover:underline">Contact</Link>
          <Link to="/terms" className="hover:underline">Conditions</Link>
          <Link to="/privacy" className="hover:underline">Confidentialité</Link>
        </div>
        <p>© 2026 Zyeuté - L'app vidéo du Québec</p>
      </div>
    </aside>
  );
};
