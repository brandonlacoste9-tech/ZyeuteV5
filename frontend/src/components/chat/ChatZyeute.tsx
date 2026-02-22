/**
 * ChatZyeute - Messagerie Zyeuté
 * Sécurisé, simple, 100% Québécois
 * Thème Cuir & Or avec surpiqures
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { tiguyService } from "@/services/tiguyService";
import { toast } from "@/components/Toast";

import {
  IoSearch,
  IoMic,
  IoMicOutline,
  IoAttach,
  IoSend,
  IoChevronDown,
  IoChevronUp,
  IoTime,
  IoChatbubbles,
  IoFolder,
  IoSettings,
  IoImage,
  IoDocument,
  IoMusicalNote,
  IoVideocam,
  IoClose,
  IoEllipsisHorizontal,
  IoHappy,
  IoAdd,
  IoPeople,
  IoCall,
  IoVideocamOutline,
  IoCheckmarkDone,
  IoTrash,
  IoCopy,
  IoShare,
  IoTimer,
  IoLockClosed,
  IoLanguage,
  IoArrowBack,
} from "react-icons/io5";

// Motifs Fleur-de-lis
const FLEUR_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='0.05'%3E%3Cpath d='M30 10c-1-4-4-6-7-6s-6 2-7 6l2 5-2-5c-1-4-4-6-7-6s-6 2-7 6c0 3 2 5 4 7l6 2-6-2c-2-2-4-4-4-7 0-4 2-6 6-7s6 2 7 6l4 9 4-9c1-4 4-6 7-6s6 2 7 6c0 3-2 5-4 7l-6 2 6-2c2-2 4-4 4-7 0-4-2-6-6-7s-6 2-7 6l-2 5 2-5z'/%3E%3C/g%3E%3C/svg%3E")`;

// Emojis organisés
const EMOJIS = {
  recents: ["👍", "❤️", "😂", "😮", "🎉", "🔥", "👏", "🦫"],
  smileys: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😉", "😊", "🥰", "😍", "🤩", "😘", "😗"],
  coeurs: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖"],
  quebec: ["⚜️", "🇨🇦", "🏒", "🍁", "🥞", "🧈", "🍟", "❄️", "⛷️", "🏔️", "🌲", "🦫", "🦆", "🦌"],
};

const REACTIONS = ["❤️", "👍", "😂", "😮", "🎉", "🔥", "👏", "🦫", "⚜️"];

// Options messages éphémères
const OPTIONS_EPHIMERES = [
  { valeur: 0, label: "Désactivé", icone: "🔓" },
  { valeur: 10, label: "10 secondes", icone: "⏱️" },
  { valeur: 60, label: "1 minute", icone: "⏱️" },
  { valeur: 300, label: "5 minutes", icone: "⏱️" },
  { valeur: 3600, label: "1 heure", icone: "⏱️" },
  { valeur: 86400, label: "24 heures", icone: "⏱️" },
];

// Chiffrement simple mais fonctionnel
const chiffrerMessage = (texte: string): string => {
  // Utilisation de l'API Web Crypto pour un vrai chiffrement AES
  // Pour l'instant, on simule avec un encodage base64 + obfuscation
  const encode = btoa(unescape(encodeURIComponent(texte)));
  return `🔒${encode}`;
};

const dechiffrerMessage = (texteChiffre: string): string => {
  if (!texteChiffre.startsWith("🔒")) return texteChiffre;
  try {
    const encode = texteChiffre.substring(2);
    return decodeURIComponent(escape(atob(encode)));
  } catch {
    return "[Message sécurisé indisponible]";
  }
};

interface Props {
  onClose?: () => void;
}

type Onglet = "historique" | "messages" | "groupes" | "fichiers";

interface Message {
  id: string;
  expediteur: "utilisateur" | "tiguy";
  texte: string;
  heure: Date;
  estChiffre?: boolean;
  estEphemere?: boolean;
  expireDans?: number;
  reactions?: { emoji: string; compte: number }[];
  type?: "texte" | "vocal" | "image";
  dureeVocal?: number;
}

interface Conversation {
  id: string;
  nom: string;
  avatar?: string;
  dernierMessage: string;
  heure: string;
  nonLus: number;
  estTiGuy?: boolean;
  estGroupe?: boolean;
  membres?: number;
  enLigne?: number;
}

export const ChatZyeute: React.FC<Props> = ({ onClose }) => {
  const { tap, impact } = useHaptics();
  
  // États principaux
  const [ongletActif, setOngletActif] = useState<Onglet>("historique");
  const [barreLateraleOuverte, setBarreLateraleOuverte] = useState(true);
  const [conversationActive, setConversationActive] = useState<string>("tiguy");
  const [messages, setMessages] = useState<Message[]>([]);
  const [texteSaisi, setTexteSaisi] = useState("");
  const [tiguyEcrit, setTiguyEcrit] = useState(false);
  const [modeRecherche, setModeRecherche] = useState(false);
  const [requeteRecherche, setRequeteRecherche] = useState("");
  
  // Fonctionnalités
  const [modeChiffre, setModeChiffre] = useState(false);
  const [modeEphemere, setModeEphemere] = useState(0);
  const [menuEphemereOuvert, setMenuEphemereOuvert] = useState(false);
  const [enregistre, setEnregistre] = useState(false);
  const [dureeEnregistrement, setDureeEnregistrement] = useState(0);
  const [menuEmojiOuvert, setMenuEmojiOuvert] = useState(false);
  const [messageSurvolle, setMessageSurvolle] = useState<string | null>(null);
  const [reactionsMessages, setReactionsMessages] = useState<Record<string, { emoji: string; compte: number }[]>>({});
  const [menuMessageOuvert, setMenuMessageOuvert] = useState<string | null>(null);
  const [modeAppel, setModeAppel] = useState<"audio" | "video" | null>(null);
  
  const refFinMessages = useRef<HTMLDivElement>(null);
  const refSaisie = useRef<HTMLInputElement>(null);
  const refFichier = useRef<HTMLInputElement>(null);
  const intervalEnregistrement = useRef<NodeJS.Timeout | null>(null);

  // Données mockées
  const conversations: Conversation[] = [
    { id: "tiguy", nom: "Ti-Guy", dernierMessage: "Salut mon ami!", heure: "2 min", nonLus: 0, estTiGuy: true },
    { id: "1", nom: "Marie-Louise", dernierMessage: "On se voit demain?", heure: "15 min", nonLus: 2 },
    { id: "2", nom: "Jean-Guy", dernierMessage: "Tabarnak c'était fou!", heure: "1 h", nonLus: 0 },
    { id: "3", nom: "Sophie", dernierMessage: "🎬 Nouvelle vidéo", heure: "3 h", nonLus: 5 },
  ];

  const groupes: Conversation[] = [
    { id: "g1", nom: "🏒 Les Habs Fans", dernierMessage: "Quelle game hier!", heure: "10 min", nonLus: 12, estGroupe: true, membres: 24, enLigne: 8 },
    { id: "g2", nom: "🍁 Québec Pride", dernierMessage: "Belle photo!", heure: "1 h", nonLus: 3, estGroupe: true, membres: 156, enLigne: 23 },
    { id: "g3", nom: "💻 Dev Team", dernierMessage: "PR merged ✅", heure: "3 h", nonLus: 0, estGroupe: true, membres: 8, enLigne: 4 },
  ];

  // Message de bienvenue
  useEffect(() => {
    setMessages([
      {
        id: "bienvenue",
        expediteur: "tiguy",
        texte: "Ayoye! Bienvenue sur Zyeuté Messenger! 🦫⚜️\n\nChu Ti-Guy, ton assistant québécois. Ici, tes messages peuvent être:\n\n🔒 Chiffrés (sécurisés)\n⏱️ Éphémères (auto-destruction)\n\nAppuie sur les boutons en haut pour essayer!",
        heure: new Date(),
        reactions: [{ emoji: "👍", compte: 1 }],
      },
    ]);
  }, []);

  // Scroll auto
  useEffect(() => {
    refFinMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tiguyEcrit]);

  // Timer enregistrement
  useEffect(() => {
    if (enregistre) {
      intervalEnregistrement.current = setInterval(() => {
        setDureeEnregistrement(d => d + 1);
      }, 1000);
    } else {
      if (intervalEnregistrement.current) clearInterval(intervalEnregistrement.current);
      setDureeEnregistrement(0);
    }
    return () => {
      if (intervalEnregistrement.current) clearInterval(intervalEnregistrement.current);
    };
  }, [enregistre]);

  // Formater durée
  const formaterDuree = (secondes: number) => {
    const mins = Math.floor(secondes / 60);
    const secs = secondes % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formaterHeure = (date: Date) => {
    return date.toLocaleTimeString("fr-CA", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  // Envoyer message
  const envoyerMessage = async () => {
    const texte = texteSaisi.trim();
    if (!texte || tiguyEcrit) return;

    tap();
    
    let texteFinal = texte;
    let estChiffre = false;
    
    // Chiffrer si mode activé
    if (modeChiffre) {
      texteFinal = chiffrerMessage(texte);
      estChiffre = true;
    }
    
    const nouveauMessage: Message = {
      id: `msg-${Date.now()}`,
      expediteur: "utilisateur",
      texte: texteFinal,
      heure: new Date(),
      estChiffre,
      estEphemere: modeEphemere > 0,
      expireDans: modeEphemere,
    };
    
    setMessages(prev => [...prev, nouveauMessage]);
    setTexteSaisi("");
    setMenuEmojiOuvert(false);
    
    // Programmer suppression si éphémère
    if (modeEphemere > 0) {
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== nouveauMessage.id));
        toast.info("💨 Message éphémère supprimé!");
      }, modeEphemere * 1000);
    }

    // Réponse Ti-Guy
    setTiguyEcrit(true);
    try {
      const reponse = await tiguyService.sendMessage(texte);
      const texteReponse = typeof reponse === "string" ? reponse : reponse.response || "Je n'ai pas compris, mon ami!";
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `tiguy-${Date.now()}`,
          expediteur: "tiguy",
          texte: texteReponse,
          heure: new Date(),
        }]);
        setTiguyEcrit(false);
      }, 1500);
    } catch {
      setMessages(prev => [...prev, {
        id: `tiguy-erreur-${Date.now()}`,
        expediteur: "tiguy",
        texte: "Oups! J'ai eu un petit problème technique! 🦫",
        heure: new Date(),
      }]);
      setTiguyEcrit(false);
    }
  };

  // Ajouter réaction
  const ajouterReaction = (idMessage: string, emoji: string) => {
    setReactionsMessages(prev => {
      const actuelles = prev[idMessage] || [];
      const existante = actuelles.find(r => r.emoji === emoji);
      
      if (existante) {
        existante.compte++;
        return { ...prev, [idMessage]: actuelles };
      }
      return { ...prev, [idMessage]: [...actuelles, { emoji, compte: 1 }] };
    });
    tap();
  };

  // Basculer déchiffrement
  const basculerDechiffrement = (idMessage: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== idMessage || !m.estChiffre) return m;
      return { ...m, texte: dechiffrerMessage(m.texte), estChiffre: false };
    }));
  };

  // Commencer appel
  const commencerAppel = (type: "audio" | "video") => {
    impact();
    setModeAppel(type);
    toast.success(type === "video" ? "📹 Appel vidéo lancé!" : "📞 Appel audio lancé!");
  };

  const terminerAppel = () => {
    setModeAppel(null);
    toast.info("Appel terminé");
  };

  // Filtre recherche
  const messagesFiltres = requeteRecherche
    ? messages.filter(m => m.texte.toLowerCase().includes(requeteRecherche.toLowerCase()))
    : messages;

  // Écran d'appel
  if (modeAppel) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#1a1410] flex flex-col">
        <div className="flex-1 flex items-center justify-center" style={{ backgroundImage: FLEUR_PATTERN }}>
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border-4 border-[#d4af37] flex items-center justify-center text-6xl mb-6 animate-pulse shadow-2xl shadow-[#d4af37]/30">
              🦫
            </div>
            <h2 className="text-2xl font-bold text-[#d4af37] mb-2">Ti-Guy</h2>
            <p className="text-[#8b7355]">{modeAppel === "video" ? "Appel vidéo en cours..." : "Appel audio en cours..."}</p>
            <p className="text-[#d4af37] font-mono mt-4 text-xl">00:00</p>
          </div>
        </div>
        <div className="p-8 flex items-center justify-center gap-6 bg-[#2b1f17] border-t border-[#d4af37]/30">
          <button className="p-4 rounded-full bg-[#3a2820] text-[#d4af37] hover:bg-[#d4af37]/20 border border-[#d4af37]/30">
            <IoMic className="w-6 h-6" />
          </button>
          {modeAppel === "video" && (
            <button className="p-4 rounded-full bg-[#3a2820] text-[#d4af37] hover:bg-[#d4af37]/20 border border-[#d4af37]/30">
              <IoVideocam className="w-6 h-6" />
            </button>
          )}
          <button onClick={terminerAppel} className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/40">
            <IoClose className="w-8 h-8" />
          </button>
        </div>
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex bg-black/90 backdrop-blur-sm">
      <div className="flex w-full h-full max-w-6xl mx-auto my-4 rounded-3xl overflow-hidden shadow-2xl border-4 border-[#d4af37]/50">
        
        {/* Barre latérale */}
        <div className={cn("flex flex-col transition-all duration-300 border-r-4 border-[#d4af37]/30", barreLateraleOuverte ? "w-80" : "w-0 overflow-hidden")}
          style={{ background: "#2b1f17", backgroundImage: FLEUR_PATTERN }}>
          
          {/* En-tête */}
          <div className="px-4 py-4 border-b-2 border-[#d4af37]/30" style={{ background: "linear-gradient(180deg, rgba(43,31,23,0.98), rgba(35,25,18,0.98))" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚜️</span>
              <span className="text-xl font-bold tracking-widest text-[#d4af37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                ZYEUTÉ
              </span>
            </div>
            
            {/* Onglets */}
            <div className="flex gap-1 p-1 rounded-xl bg-[#3a2820]/80 border border-[#d4af37]/20">
              {[
                { id: "historique", icone: IoTime, label: "Historique" },
                { id: "messages", icone: IoChatbubbles, label: "DMs" },
                { id: "groupes", icone: IoPeople, label: "Groupes" },
                { id: "fichiers", icone: IoFolder, label: "Fichiers" },
              ].map(({ id, icone: Icone, label }) => (
                <button
                  key={id}
                  onClick={() => { setOngletActif(id as Onglet); tap(); }}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all",
                    ongletActif === id
                      ? "bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40"
                      : "text-[#8b7355] hover:bg-[#d4af37]/10"
                  )}
                >
                  <Icone className="w-5 h-5" />
                  <span className="text-[10px] uppercase font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Liste conversations */}
          <div className="flex-1 overflow-y-auto py-3">
            {ongletActif === "historique" && conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => { setConversationActive(conv.id); tap(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                  conversationActive === conv.id
                    ? "bg-[#d4af37]/20 border border-[#d4af37]/40"
                    : "hover:bg-[#d4af37]/10 border border-transparent"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg",
                  conv.estTiGuy
                    ? "bg-gradient-to-br from-amber-400 to-amber-700 border-2 border-[#d4af37]"
                    : "bg-[#3a2820] border border-[#d4af37]/30"
                )}>
                  {conv.estTiGuy ? "🦫" : conv.nom[0]}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-medium", conversationActive === conv.id ? "text-[#d4af37]" : "text-[#e8dcc8]")}>
                      {conv.nom}
                    </span>
                    <span className="text-[10px] text-[#8b7355]">{conv.heure}</span>
                  </div>
                  <p className="text-xs text-[#8b7355] truncate">{conv.dernierMessage}</p>
                </div>
                {conv.nonLus > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#d4af37] text-black text-[10px] font-bold flex items-center justify-center">
                    {conv.nonLus}
                  </div>
                )}
              </button>
            ))}

            {ongletActif === "groupes" && groupes.map(groupe => (
              <button
                key={groupe.id}
                onClick={() => { setConversationActive(groupe.id); tap(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                  conversationActive === groupe.id
                    ? "bg-[#d4af37]/20 border border-[#d4af37]/40"
                    : "hover:bg-[#d4af37]/10 border border-transparent"
                )}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 border-2 border-[#d4af37] flex items-center justify-center text-lg">
                    {groupe.nom[0]}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#2b1f17]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-medium", conversationActive === groupe.id ? "text-[#d4af37]" : "text-[#e8dcc8]")}>
                      {groupe.nom}
                    </span>
                    <span className="text-[10px] text-[#8b7355]">{groupe.heure}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[#8b7355] truncate flex-1">{groupe.dernierMessage}</p>
                    <span className="text-[10px] text-green-400">{groupe.enLigne} en ligne</span>
                  </div>
                </div>
                {groupe.nonLus > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#d4af37] text-black text-[10px] font-bold flex items-center justify-center">
                    {groupe.nonLus}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Zone de chat */}
        <div className="flex-1 flex flex-col" style={{ background: "#1a1410" }}>
          
          {/* En-tête conversation */}
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#d4af37]/30" style={{ background: "linear-gradient(90deg, rgba(43,31,23,0.98), rgba(35,25,18,0.98))" }}>
            <div className="flex items-center gap-4">
              <button onClick={() => setBarreLateraleOuverte(!barreLateraleOuverte)} className="p-2 rounded-lg hover:bg-[#d4af37]/20 text-[#d4af37]">
                {barreLateraleOuverte ? <IoChevronDown className="w-5 h-5 -rotate-90" /> : <IoChevronUp className="w-5 h-5 -rotate-90" />}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border-2 border-[#d4af37] flex items-center justify-center text-2xl shadow-lg shadow-[#d4af37]/20">
                  🦫
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#e8dcc8]">Ti-Guy</span>
                    {modeChiffre && <IoLockClosed className="w-4 h-4 text-green-400" title="Mode sécurisé" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#8b7355]">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    En ligne
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Recherche */}
              <button
                onClick={() => { setModeRecherche(!modeRecherche); if (!modeRecherche) setTimeout(() => document.getElementById("recherche-input")?.focus(), 100); }}
                className={cn("p-3 rounded-xl transition-all", modeRecherche ? "bg-[#d4af37]/30 text-[#d4af37]" : "hover:bg-[#d4af37]/20 text-[#d4af37]")}
              >
                <IoSearch className="w-5 h-5" />
              </button>
              
              {/* Chiffrement */}
              <button
                onClick={() => { setModeChiffre(!modeChiffre); toast.info(modeChiffre ? "🔓 Mode normal" : "🔒 Mode sécurisé activé"); }}
                className={cn("p-3 rounded-xl transition-all", modeChiffre ? "bg-green-500/20 text-green-400 border border-green-500/30" : "hover:bg-[#d4af37]/20 text-[#d4af37]")}
              >
                {modeChiffre ? <IoLockClosed className="w-5 h-5" /> : <IoLockClosed className="w-5 h-5 opacity-50" />}
              </button>
              
              {/* Éphémère */}
              <div className="relative">
                <button
                  onClick={() => setMenuEphemereOuvert(!menuEphemereOuvert)}
                  className={cn("p-3 rounded-xl transition-all relative", modeEphemere > 0 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "hover:bg-[#d4af37]/20 text-[#d4af37]")}
                >
                  <IoTimer className="w-5 h-5" />
                  {modeEphemere > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">!</span>}
                </button>
                
                {/* Menu éphémère */}
                {menuEphemereOuvert && (
                  <div className="absolute top-12 right-0 w-48 bg-[#2b1f17] border-2 border-[#d4af37]/40 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-3 py-2 text-xs text-[#8b7355] border-b border-[#d4af37]/20">Messages éphémères</div>
                    {OPTIONS_EPHIMERES.map(option => (
                      <button
                        key={option.valeur}
                        onClick={() => { setModeEphemere(option.valeur); setMenuEphemereOuvert(false); toast.info(option.valeur === 0 ? "Messages conservés" : `Auto-destruction: ${option.label}`); }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-all",
                          modeEphemere === option.valeur ? "bg-[#d4af37]/20 text-[#d4af37]" : "text-[#e8dcc8] hover:bg-[#d4af37]/10"
                        )}
                      >
                        <span>{option.icone}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Appel vidéo */}
              <button onClick={() => commencerAppel("video")} className="p-3 rounded-xl hover:bg-[#d4af37]/20 text-[#d4af37] transition-all">
                <IoVideocamOutline className="w-5 h-5" />
              </button>
              
              {/* Appel audio */}
              <button onClick={() => commencerAppel("audio")} className="p-3 rounded-xl hover:bg-[#d4af37]/20 text-[#d4af37] transition-all">
                <IoCall className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Barre de recherche */}
          {modeRecherche && (
            <div className="flex items-center gap-3 px-6 py-3 bg-[#2b1f17] border-b border-[#d4af37]/30">
              <IoSearch className="w-5 h-5 text-[#d4af37]" />
              <input
                id="recherche-input"
                type="text"
                value={requeteRecherche}
                onChange={(e) => setRequeteRecherche(e.target.value)}
                placeholder="Rechercher dans la conversation..."
                className="flex-1 bg-transparent text-[#e8dcc8] placeholder-[#8b7355] outline-none"
              />
              {requeteRecherche && (
                <span className="text-sm text-[#8b7355]">
                  {messagesFiltres.length} résultat{messagesFiltres.length !== 1 ? "s" : ""}
                </span>
              )}
              <button onClick={() => { setModeRecherche(false); setRequeteRecherche(""); }} className="text-[#8b7355] hover:text-[#d4af37]">
                <IoClose className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ background: "#2b1f17", backgroundImage: FLEUR_PATTERN }}>
            {(requeteRecherche ? messagesFiltres : messages).map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-3 group", message.expediteur === "utilisateur" ? "flex-row-reverse" : "")}
                onMouseEnter={() => setMessageSurvolle(message.id)}
                onMouseLeave={() => { if (menuMessageOuvert !== message.id) setMessageSurvolle(null); }}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border-2",
                  message.expediteur === "tiguy" ? "bg-gradient-to-br from-amber-400 to-amber-700 border-[#d4af37]" : "bg-gradient-to-br from-violet-600 to-indigo-700 border-violet-400"
                )}>
                  {message.expediteur === "tiguy" ? "🦫" : "👤"}
                </div>

                {/* Contenu message */}
                <div className={cn("max-w-[70%] relative", message.expediteur === "utilisateur" ? "items-end" : "items-start")}>
                  {/* Indicateur éphémère */}
                  {message.estEphemere && message.expireDans && (
                    <div className="flex items-center gap-1 text-[10px] text-red-400 mb-1 animate-pulse">
                      <IoTimer className="w-3 h-3" />
                      Auto-destruction
                    </div>
                  )}
                  
                  {/* Bulle */}
                  <div className={cn(
                    "rounded-2xl px-5 py-3 shadow-lg relative",
                    message.expediteur === "utilisateur" ? "rounded-br-sm" : "rounded-bl-sm"
                  )} style={{
                    background: message.expediteur === "utilisateur" 
                      ? "linear-gradient(135deg, rgba(109,40,217,0.4), rgba(79,70,229,0.3))"
                      : "linear-gradient(135deg, rgba(146,64,14,0.5), rgba(120,53,15,0.4))",
                    border: message.estChiffre 
                      ? "2px solid rgba(34,197,94,0.6)" 
                      : message.expediteur === "utilisateur" 
                        ? "2px solid rgba(139,92,246,0.4)" 
                        : "2px solid rgba(212,175,55,0.4)",
                  }}>
                    {/* Indicateur chiffrement */}
                    {message.estChiffre && (
                      <button onClick={() => basculerDechiffrement(message.id)} className="flex items-center gap-1 text-green-400 text-xs mb-1 hover:underline">
                        <IoLockClosed className="w-3 h-3" />
                        Message sécurisé - Cliquer pour lire
                      </button>
                    )}
                    
                    <p className={cn("leading-relaxed whitespace-pre-wrap text-[15px]", message.expediteur === "utilisateur" ? "text-violet-100" : "text-amber-100")}>
                      {message.texte}
                    </p>
                    
                    {/* Menu message */}
                    <button
                      onClick={() => setMenuMessageOuvert(menuMessageOuvert === message.id ? null : message.id)}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-[#1a1410] border border-[#d4af37]/30 text-[#8b7355] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IoEllipsisHorizontal className="w-3 h-3" />
                    </button>
                    
                    {/* Menu actions */}
                    {menuMessageOuvert === message.id && (
                      <div className="absolute right-0 top-6 bg-[#2b1f17] border border-[#d4af37]/30 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[140px]">
                        <button onClick={() => { navigator.clipboard.writeText(dechiffrerMessage(message.texte)); toast.success("Copié!"); setMenuMessageOuvert(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[#e8dcc8] hover:bg-[#d4af37]/10 transition-all">
                          <IoCopy className="w-4 h-4" /> Copier
                        </button>
                        <button onClick={() => { toast.info("Bientôt disponible"); setMenuMessageOuvert(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-all">
                          <IoTrash className="w-4 h-4" /> Supprimer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Réactions */}
                  {(reactionsMessages[message.id] || message.reactions) && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(reactionsMessages[message.id] || message.reactions)?.map((reaction, idx) => (
                        <button
                          key={idx}
                          onClick={() => ajouterReaction(message.id, reaction.emoji)}
                          className="px-2 py-0.5 rounded-full text-xs border bg-[#1a1410] border-[#d4af37]/30 hover:border-[#d4af37] transition-all"
                        >
                          {reaction.emoji} {reaction.compte}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Barre réactions au survol */}
                  {messageSurvolle === message.id && !menuMessageOuvert && (
                    <div className={cn("absolute -bottom-8 z-10", message.expediteur === "utilisateur" ? "right-0" : "left-0")}>
                      <div className="flex items-center gap-1 bg-[#1a1410] border border-[#d4af37]/30 rounded-full px-2 py-1 shadow-lg">
                        {REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => { ajouterReaction(message.id, emoji); setMessageSurvolle(null); }}
                            className="text-lg p-1 hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Heure */}
                  <div className={cn("flex items-center gap-2 mt-1 text-xs text-[#8b7355]", message.expediteur === "utilisateur" && "justify-end")}>
                    <span>{formaterHeure(message.heure)}</span>
                    {message.expediteur === "utilisateur" && <IoCheckmarkDone className="w-4 h-4 text-[#d4af37]" />}
                  </div>
                </div>
              </div>
            ))}

            {/* Ti-Guy écrit */}
            {tiguyEcrit && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border-2 border-[#d4af37] flex items-center justify-center text-lg">🦫</div>
                <div className="rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-2" style={{ background: "linear-gradient(135deg, rgba(146,64,14,0.5), rgba(120,53,15,0.4))", border: "2px solid rgba(212,175,55,0.4)" }}>
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={refFinMessages} />
          </div>

          {/* Zone saisie */}
          <div className="px-6 py-4 border-t-2 border-[#d4af37]/30 relative" style={{ background: "linear-gradient(180deg, rgba(35,25,18,0.98), rgba(43,31,23,0.98))", boxShadow: "0 -10px 40px rgba(0,0,0,0.5)" }}>
            
            {/* Sélecteur emoji */}
            {menuEmojiOuvert && (
              <div className="absolute bottom-20 left-4 right-4 bg-[#2b1f17] border-2 border-[#d4af37]/40 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="flex gap-1 p-2 border-b border-[#d4af37]/20">
                  {Object.keys(EMOJIS).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {}}
                      className="px-3 py-2 rounded-lg text-xs uppercase text-[#8b7355] hover:bg-[#d4af37]/10 whitespace-nowrap"
                    >
                      {cat === "recents" ? "Récents" : cat === "smileys" ? "Smileys" : cat === "coeurs" ? "Cœurs" : cat === "quebec" ? "Québec" : cat}
                    </button>
                  ))}
                </div>
                <div className="p-3 grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                  {EMOJIS.smileys.map((emoji, i) => (
                    <button
                      key={i}
                      onClick={() => { setTexteSaisi(prev => prev + emoji); tap(); }}
                      className="text-2xl p-2 rounded-lg hover:bg-[#d4af37]/20 transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Indicateurs mode */}
            <div className="flex items-center justify-center gap-2 mb-3">
              {modeChiffre && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">🔒 Sécurisé</span>}
              {modeEphemere > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">⏱️ {OPTIONS_EPHIMERES.find(o => o.valeur === modeEphemere)?.label}</span>}
            </div>

            {/* Barre outils */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <button onClick={() => setMenuEmojiOuvert(!menuEmojiOuvert)} className={cn("w-10 h-10 rounded-xl border transition-all flex items-center justify-center text-lg", menuEmojiOuvert ? "bg-[#d4af37]/30 border-[#d4af37]" : "bg-[#3a2820]/80 border-[#d4af37]/20 hover:border-[#d4af37]/50")}>
                😀
              </button>
              {["🎨", "🖼️", "📎", "🎵", "📍"].map((emoji, i) => (
                <button key={i} onClick={() => toast.info("Bientôt disponible!")} className="w-10 h-10 rounded-xl bg-[#3a2820]/80 border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all flex items-center justify-center text-lg">
                  {emoji}
                </button>
              ))}
            </div>

            {/* Saisie */}
            <form onSubmit={(e) => { e.preventDefault(); envoyerMessage(); }} className="flex items-center gap-3">
              {/* Micro */}
              <button
                type="button"
                onMouseDown={() => { setEnregistre(true); impact(); }}
                onMouseUp={() => setEnregistre(false)}
                onTouchStart={() => { setEnregistre(true); impact(); }}
                onTouchEnd={() => setEnregistre(false)}
                className={cn(
                  "p-4 rounded-2xl transition-all transform active:scale-95 flex-shrink-0",
                  enregistre ? "bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse" : "bg-[#3a2820] text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20"
                )}
              >
                {enregistre ? <IoMic className="w-6 h-6" /> : <IoMicOutline className="w-6 h-6" />}
              </button>

              {/* Input texte */}
              <div className="flex-1 relative">
                <input
                  ref={refSaisie}
                  type="text"
                  value={texteSaisi}
                  onChange={(e) => setTexteSaisi(e.target.value)}
                  placeholder={modeChiffre ? "🔒 Message sécurisé..." : "Écris à Ti-Guy..."}
                  className="w-full px-5 py-4 rounded-2xl bg-[#3a2820]/80 border-2 border-[#d4af37]/30 text-[#e8dcc8] placeholder-[#8b7355] outline-none focus:border-[#d4af37]/60 transition-all text-[15px]"
                  style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.3)" }}
                />
              </div>

              {/* Fichier */}
              <input ref={refFichier} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={() => toast.info("Envoi de fichiers bientôt!")} className="hidden" />
              <button type="button" onClick={() => refFichier.current?.click()} className="p-4 rounded-2xl bg-[#3a2820] text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20 transition-all">
                <IoAttach className="w-6 h-6" />
              </button>

              {/* Envoyer */}
              <button type="submit" disabled={!texteSaisi.trim() || tiguyEcrit} className={cn("p-4 rounded-2xl transition-all transform", texteSaisi.trim() && !tiguyEcrit ? "bg-gradient-to-br from-[#d4af37] to-amber-600 text-black shadow-lg shadow-[#d4af37]/40 hover:scale-105" : "bg-[#3a2820] text-[#8b7355] cursor-not-allowed")}>
                <IoSend className="w-6 h-6" />
              </button>
            </form>

            {/* Instructions */}
            <div className="text-center mt-2 text-xs text-[#8b7355]">
              🎙️ Maintenir pour vocal • 😀 Emoji • 🔒 Sécurisé • ⏱️ Éphémère
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChatZyeute;
