/**
 * EphemeralBadge Component
 * Displays the "View-Once" / "Burned" status of a post.
 * Part of the "The Void Remembers" ephemeral protocol.
 */

import React from "react";
import { Flame, Eye } from "lucide-react";
import type { Post } from "@/types";
import { useTranslation } from "../../i18n";

interface EphemeralBadgeProps {
  post: Post;
  className?: string;
}

export const EphemeralBadge: React.FC<EphemeralBadgeProps> = ({
  post,
  className,
}) => {
  const { t } = useTranslation();

  if (!post.is_ephemeral) return null;

  // Ash State - Post is burned
  if (post.burned_at) {
    return (
      <div
        className={`absolute top-2 right-2 bg-zinc-900/90 text-zinc-500 px-3 py-1 rounded-full flex items-center gap-1.5 border border-zinc-800 backdrop-blur-sm z-50 pointer-events-none select-none ${className}`}
      >
        <Flame size={14} />
        <span className="text-xs font-bold uppercase tracking-wider">
          {t("ephemeral.status_burned")}
        </span>
      </div>
    );
  }

  // Active Ephemeral State
  return (
    <div
      className={`absolute top-2 right-2 bg-red-600/90 text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-red-900/20 backdrop-blur-md z-50 animate-pulse pointer-events-none select-none ${className}`}
    >
      <Flame size={14} className="fill-white" />
      <span className="text-xs font-bold uppercase tracking-wider">
        {t("ephemeral.label")}
      </span>
      {post.max_views !== undefined && (
        <div className="flex items-center gap-1 ml-1 pl-1 border-l border-white/30">
          <Eye size={12} />
          <span className="text-[10px]">
            {post.view_count || 0}/{post.max_views}
          </span>
        </div>
      )}
    </div>
  );
};
