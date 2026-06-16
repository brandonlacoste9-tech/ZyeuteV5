import { useCallback } from "react";
import {
  Repeat2,
  Link2,
  MessageCircle,
  Share,
  MessageSquare,
  MoreHorizontal,
  X,
} from "lucide-react";
import { toast } from "@/components/Toast";
import { SheetShell } from "@/components/ui/SheetShell";

type Props = {
  open: boolean;
  onClose: () => void;
  postId: string;
  title?: string;
};

export function ShareSheet({ open, onClose, postId, title }: Props) {
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${postId}`;

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    } catch {
      toast.error("Erreur lors de la copie");
    }
    onClose();
  }, [url, onClose]);

  const native = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title || "Zyeuté",
          text: "Regarde ça sur Zyeuté!",
          url,
        });
      }
    } catch {
      /* cancelled */
    }
    onClose();
  }, [url, title, onClose]);

  // Mock friends for the top row (Internal sharing)
  const mockFriends = [
    { id: 1, name: "Ti-Guy", color: "bg-blue-500" },
    { id: 2, name: "Marie", color: "bg-pink-500" },
    { id: 3, name: "Jean", color: "bg-green-500" },
    { id: 4, name: "Gaston", color: "bg-purple-500" },
    { id: 5, name: "Lucie", color: "bg-orange-500" },
  ];

  // External share targets
  const externalTargets = [
    {
      id: "repost",
      name: "Republier",
      color: "bg-yellow-500",
      icon: <Repeat2 className="h-6 w-6" aria-hidden="true" />,
      action: () => {
        toast.success("Republié !");
        onClose();
      },
    },
    {
      id: "copy",
      name: "Copier le lien",
      color: "bg-blue-500",
      icon: <Link2 className="h-6 w-6" aria-hidden="true" />,
      action: copy,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      color: "bg-[#25D366]",
      icon: <MessageCircle className="h-6 w-6" aria-hidden="true" />,
      action: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(url)}`);
        onClose();
      },
    },
    {
      id: "facebook",
      name: "Facebook",
      color: "bg-[#1877F2]",
      icon: <Share className="h-6 w-6" aria-hidden="true" />,
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        );
        onClose();
      },
    },
    {
      id: "sms",
      name: "SMS",
      color: "bg-green-500",
      icon: <MessageSquare className="h-6 w-6" aria-hidden="true" />,
      action: () => {
        window.open(`sms:?body=${encodeURIComponent(url)}`);
        onClose();
      },
    },
    {
      id: "more",
      name: "Plus",
      color: "bg-zinc-700",
      icon: <MoreHorizontal className="h-6 w-6" aria-hidden="true" />,
      action: native,
    },
  ];

  return (
    <SheetShell
      open={open}
      onClose={onClose}
      className="z-[160] md:items-center md:justify-center"
      panelClassName="px-4 pb-safe md:w-[480px] md:rounded-2xl md:border"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="w-11" /> {/* Spacer for centering */}
        <p className="text-center text-white font-bold text-sm tracking-wide">
          Partager vers
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="group flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-white/20">
            <X className="h-4 w-4" aria-hidden="true" />
          </span>
        </button>
      </div>

      {/* Top Row: Internal Sharing (Friends) */}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 border-b border-white/10">
        {mockFriends.map((friend) => (
          <button
            key={friend.id}
            type="button"
            onClick={() => {
              toast.success(`Envoyé à ${friend.name}`);
              onClose();
            }}
            className="flex w-14 flex-shrink-0 flex-col items-center gap-1.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${friend.color} text-lg font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95`}
            >
              {friend.name[0]}
            </div>
            <span className="w-full truncate text-center text-[10px] font-medium text-white/80">
              {friend.name}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom Row: External Sharing Targets */}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar py-4">
        {externalTargets.map((target) => (
          <button
            key={target.id}
            type="button"
            onClick={target.action}
            className="flex w-14 flex-shrink-0 flex-col items-center gap-1.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${target.color} text-white shadow-sm transition-transform hover:scale-105 active:scale-95`}
            >
              {target.icon}
            </div>
            <span className="w-full truncate text-center text-[10px] font-medium text-white/80">
              {target.name}
            </span>
          </button>
        ))}
      </div>
    </SheetShell>
  );
}
