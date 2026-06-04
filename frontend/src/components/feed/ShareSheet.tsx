import { useCallback } from "react";
import { toast } from "@/components/Toast";

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

  if (!open) return null;

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
    { id: "repost", name: "Republier", color: "bg-yellow-500", icon: "🔁", action: () => { toast.success("Republié !"); onClose(); } },
    { id: "copy", name: "Copier le lien", color: "bg-blue-500", icon: "🔗", action: copy },
    { id: "whatsapp", name: "WhatsApp", color: "bg-[#25D366]", icon: "💬", action: () => { window.open(`https://wa.me/?text=${encodeURIComponent(url)}`); onClose(); } },
    { id: "facebook", name: "Facebook", color: "bg-[#1877F2]", icon: "📘", action: () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`); onClose(); } },
    { id: "sms", name: "SMS", color: "bg-green-500", icon: "📱", action: () => { window.open(`sms:?body=${encodeURIComponent(url)}`); onClose(); } },
    { id: "more", name: "Plus", color: "bg-zinc-700", icon: "⋯", action: native },
  ];

  return (
    <div className="fixed inset-0 z-[160] flex flex-col md:items-center md:justify-center justify-end bg-black/60">
      <button
        type="button"
        className="fixed inset-0 w-full h-full cursor-default"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative w-full md:w-[480px] rounded-t-2xl md:rounded-2xl bg-zinc-900 md:bg-zinc-900/95 border-t md:border border-gold-500/20 p-4 pb-safe animate-in slide-in-from-bottom md:zoom-in-95 duration-200 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div className="w-6" /> {/* Spacer for centering */}
          <p className="text-center text-white font-bold text-sm">
            Partager vers
          </p>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Top Row: Internal Sharing (Friends) */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 border-b border-white/10">
          {mockFriends.map((friend) => (
            <button key={friend.id} onClick={() => { toast.success(`Envoyé à ${friend.name}`); onClose(); }} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-14">
              <div className={`w-12 h-12 rounded-full ${friend.color} flex items-center justify-center text-white font-bold text-lg shadow-sm hover:scale-105 transition-transform`}>
                {friend.name[0]}
              </div>
              <span className="text-[10px] text-white/80 font-medium truncate w-full text-center">{friend.name}</span>
            </button>
          ))}
        </div>

        {/* Bottom Row: External Sharing Targets */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar py-4">
          {externalTargets.map((target) => (
            <button key={target.id} onClick={target.action} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-14">
              <div className={`w-12 h-12 rounded-full ${target.color} flex items-center justify-center text-white text-xl shadow-sm hover:scale-105 transition-transform`}>
                {target.icon}
              </div>
              <span className="text-[10px] text-white/80 font-medium truncate w-full text-center">{target.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
