import React from "react";
import {
  PenTool,
  Image as ImageIcon,
  Search as SearchIcon,
  Music,
  Video,
} from "lucide-react";
import { Button } from "./button";

interface QuebecEmptyStateProps {
  type: "feed" | "profile" | "search" | "media";
  action?: () => void;
  label?: string;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export function QuebecEmptyState({
  type,
  action,
  label,
  title,
  description,
  actionText,
  onAction,
}: QuebecEmptyStateProps) {
  const content = {
    feed: {
      title: "C'est tranquille icitte...",
      description: "Le village est calme. Soyez le premier à partir le bal!",
      button: "Partir une discussion",
      icon: PenTool,
    },
    profile: {
      title: "Pas encore de contenu",
      description: "Ce créateur n'a pas encore monté son exposition.",
      button: null,
      icon: ImageIcon,
    },
    search: {
      title: "Rien trouvé / Nothing found",
      description:
        "Essayez avec des mots-clés comme #Quebec, #Poutine ou #Hiver.",
      button: "Effacer les filtres",
      icon: SearchIcon,
    },
    media: {
      title: "Pas de vues",
      description: "C'est le temps de filmer quelque chose de grandiose.",
      button: "Ouvrir le Studio",
      icon: Video,
    },
  }[type];

  const Icon = content.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-leather-primary/20 rounded-xl bg-[#FDFBF7]">
      <div className="bg-white p-4 rounded-full shadow-sm mb-4 ring-1 ring-gold-primary/20">
        <Icon className="h-8 w-8 text-gold-primary" />
      </div>

      <h3 className="text-xl font-bold text-leather-primary mb-2 font-serif">
        {title || content.title}
      </h3>

      <p className="text-gray-600 max-w-sm mb-6 text-sm">
        {description || content.description}
      </p>

      {(onAction || (content.button && action)) && (
        <Button
          onClick={onAction || action}
          className="bg-leather-primary text-white hover:bg-leather-primary/90"
        >
          {actionText || label || content.button}
        </Button>
      )}
    </div>
  );
}
