/**
 * ChatControlCenter - Mini dashboard for conversation settings
 * TI-GUY's command center aesthetic
 */

import React, { useState } from "react";
import { 
  Clock, 
  Lock, 
  Trash2, 
  Shield, 
  Bell, 
  Palette,
  X,
  ChevronDown,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: {
    id: string;
    ephemeralMode: boolean;
    ephemeralTtlSeconds: number;
    encryptionEnabled: boolean;
    otherUser: {
      username: string;
      displayName: string;
    };
  };
  onUpdateSettings: (settings: {
    ephemeralMode?: boolean;
    ephemeralTtlSeconds?: number;
    encryptionEnabled?: boolean;
  }) => void;
  onClearChat: () => void;
  onBlockUser: () => void;
}

const EPHEMERAL_OPTIONS = [
  { value: 3600, label: "1 heure", icon: "⚡" },
  { value: 86400, label: "24 heures", icon: "🌙" },
  { value: 604800, label: "7 jours", icon: "📅" },
  { value: 2592000, label: "30 jours", icon: "🗓️" },
];

const THEMES = [
  { id: "cuir-or", name: "Cuir & Or", primary: "#D4AF37", bg: "#1A1A1A" },
  { id: "quebec", name: "Québec", primary: "#0078D4", bg: "#0D0D0D" },
  { id: "midnight", name: "Minuit", primary: "#6366F1", bg: "#000000" },
];

export const ChatControlCenter: React.FC<ChatControlCenterProps> = ({
  isOpen,
  onClose,
  conversation,
  onUpdateSettings,
  onClearChat,
  onBlockUser,
}) => {
  const [activeTab, setActiveTab] = useState<"privacy" | "appearance" | "notifications">("privacy");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("cuir-or");

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Control Center Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gradient-to-b from-[#1A1A1A] to-[#0D0D0D] z-50 shadow-2xl border-l border-gold-500/20">
        {/* Header */}
        <div className="p-6 border-b border-gold-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gold-400 flex items-center gap-2">
                <span className="text-2xl">⚜️</span>
                Centre de Contrôle
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                Conversation avec @{conversation.otherUser.username}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-stone-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 p-1 bg-black/30 rounded-xl">
            {[
              { id: "privacy", label: "Confidentialité", icon: Shield },
              { id: "appearance", label: "Apparence", icon: Palette },
              { id: "notifications", label: "Alertes", icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-gold-500 text-black"
                    : "text-stone-400 hover:text-stone-200 hover:bg-white/5"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-180px)]">
          {activeTab === "privacy" && (
            <div className="space-y-6">
              {/* Ephemeral Messages Toggle */}
              <div className="bg-black/20 rounded-2xl p-5 border border-gold-500/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-gold-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Messages éphémères</h3>
                      <p className="text-stone-500 text-sm">Auto-destruction programmée</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onUpdateSettings({ 
                      ephemeralMode: !conversation.ephemeralMode 
                    })}
                    className={cn(
                      "w-14 h-8 rounded-full transition-all relative",
                      conversation.ephemeralMode 
                        ? "bg-gold-500" 
                        : "bg-stone-700"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full bg-white absolute top-1 transition-all",
                      conversation.ephemeralMode ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>

                {/* Duration Selector */}
                {conversation.ephemeralMode && (
                  <div className="mt-4 pt-4 border-t border-gold-500/10 animate-in slide-in-from-top-2">
                    <p className="text-stone-400 text-sm mb-3">Durée avant suppression:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {EPHEMERAL_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => onUpdateSettings({ 
                            ephemeralTtlSeconds: option.value 
                          })}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                            conversation.ephemeralTtlSeconds === option.value
                              ? "border-gold-500 bg-gold-500/10 text-gold-400"
                              : "border-stone-700 hover:border-stone-600 text-stone-400"
                          )}
                        >
                          <span>{option.icon}</span>
                          <span className="font-medium">{option.label}</span>
                          {conversation.ephemeralTtlSeconds === option.value && (
                            <Check className="w-4 h-4 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Encryption Toggle */}
              <div className="bg-black/20 rounded-2xl p-5 border border-gold-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-gold-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Chiffrement E2E</h3>
                      <p className="text-stone-500 text-sm">Messages chiffrés de bout en bout</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onUpdateSettings({ 
                      encryptionEnabled: !conversation.encryptionEnabled 
                    })}
                    className={cn(
                      "w-14 h-8 rounded-full transition-all relative",
                      conversation.encryptionEnabled 
                        ? "bg-gold-500" 
                        : "bg-stone-700"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full bg-white absolute top-1 transition-all",
                      conversation.encryptionEnabled ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
                
                {conversation.encryptionEnabled && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-green-400 text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Cette conversation est sécurisée
                    </p>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="bg-red-500/5 rounded-2xl p-5 border border-red-500/20">
                <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Zone de danger
                </h3>

                {!showDeleteConfirm ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full p-3 text-left rounded-xl border border-stone-700 hover:border-red-500/50 hover:bg-red-500/5 transition-all"
                    >
                      <p className="text-white font-medium">Vider la conversation</p>
                      <p className="text-stone-500 text-sm">Supprimer tous les messages</p>
                    </button>
                    
                    <button
                      onClick={onBlockUser}
                      className="w-full p-3 text-left rounded-xl border border-stone-700 hover:border-red-500/50 hover:bg-red-500/5 transition-all"
                    >
                      <p className="text-white font-medium">Bloquer @{conversation.otherUser.username}</p>
                      <p className="text-stone-500 text-sm">Ne plus recevoir de messages</p>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                    <p className="text-red-400 text-sm mb-4">
                      Êtes-vous sûr? Cette action est irréversible.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={onClearChat}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 bg-stone-700 text-white rounded-lg font-medium hover:bg-stone-600 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div className="bg-black/20 rounded-2xl p-5 border border-gold-500/10">
                <h3 className="font-semibold text-white mb-4">Thème de conversation</h3>
                
                <div className="space-y-3">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4",
                        selectedTheme === theme.id
                          ? "border-gold-500 bg-gold-500/10"
                          : "border-stone-700 hover:border-stone-600"
                      )}
                    >
                      <div 
                        className="w-12 h-12 rounded-xl"
                        style={{ backgroundColor: theme.bg, border: `2px solid ${theme.primary}` }}
                      />
                      <div className="text-left">
                        <p className="font-medium text-white">{theme.name}</p>
                        <p className="text-sm" style={{ color: theme.primary }}>
                          {theme.primary}
                        </p>
                      </div>
                      {selectedTheme === theme.id && (
                        <Check className="w-5 h-5 text-gold-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="bg-black/20 rounded-2xl p-5 border border-gold-500/10">
                <h3 className="font-semibold text-white mb-4">Paramètres de notification</h3>
                
                <div className="space-y-4">
                  {[
                    { label: "Nouveaux messages", desc: "Recevoir une alerte pour chaque message", default: true },
                    { label: "Mentions", desc: "Quand quelqu'un me mentionne @username", default: true },
                    { label: "Appels", desc: "Notifications d'appel vocal/vidéo", default: true },
                    { label: "Son", desc: "Jouer un son pour les notifications", default: false },
                  ].map((setting) => (
                    <div key={setting.label} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-white font-medium">{setting.label}</p>
                        <p className="text-stone-500 text-sm">{setting.desc}</p>
                      </div>
                      <button
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          setting.default ? "bg-gold-500" : "bg-stone-700"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all",
                          setting.default ? "left-6" : "left-0.5"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatControlCenter;
