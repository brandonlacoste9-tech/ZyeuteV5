import { useState, useEffect, useRef } from "react";

const TIGUY_PHRASES = {
  greeting: [
    "Ayoye! Chus Ti-Guy, ton chum d'IA 24/7! Chu là pour toé! 🦫⚜️",
    "Allo toé! Ti-Guy est dans l'coin, prêt à t'aider mon ami! 🔥",
    "Tabarnak que chus content de te voir! Qu'esse tu veux savoir? 🇨🇦",
  ],
  thinking: [
    "Wo, laisse-moi réfléchir deux secondes...",
    "Hmmm... chus en train de checker ça...",
    "Attends, j'analyse toute ça pour toé...",
  ],
  skills: {
    chat: { icon: "💬", label: "Jaser avec Ti-Guy", color: "#f59e0b" },
    video: { icon: "🎬", label: "Analyser une vidéo", color: "#ef4444" },
    moderation: { icon: "🛡️", label: "Modérer le contenu", color: "#10b981" },
    trends: { icon: "📈", label: "Voir les tendances", color: "#8b5cf6" },
  },
};

const MOCK_RESPONSES = {
  chat: (msg: string) => `Ayoye mon beau ${msg.toLowerCase().includes("zyeuté") ? "ZyEUTÉ c'est la fierté du Québec" : "question là"}! Ti-Guy t'a entendu. KimiClaw analyse ça pour toé en temps réel... Chus powered by la meilleure IA du Québec numérique! 🦫⚜️`,
  video: () => `🎬 **Analyse vidéo terminée!**\n\n✅ Contenu québécois détecté\n🎯 Engagement prédit: 87%\n⚡ Vitesse optimale pour le feed\n🏆 Recommandé pour "Trending Québec"\n\nTi-Guy dit: C'est une ostie de bonne vidéo! 🔥`,
  moderation: () => `🛡️ **Rapport de modération**\n\n✅ Contenu sécuritaire\n✅ Aucun langage haineux\n✅ Conforme aux normes Zyeuté\n⚜️ Approuvé pour publication\n\nTi-Guy dit: C'est propre comme un sou neuf! 💎`,
  trends: () => `📈 **Tendances Québec en ce moment**\n\n🔥 #MontrealVibe +340%\n🎵 Musique traditionnelle +180%\n🏒 Habs Talk +220%\n🍁 #JeSuisQuébécois +95%\n🦫 Ti-Guy mentions +∞%\n\nTi-Guy dit: Le Québec est EN FEU! ⚜️🇨🇦`,
};

// Define explicit types for state
interface Message {
  id: number;
  type: "ti-guy" | "user" | "system";
  text: string;
  skill?: string;
  timestamp: string;
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  size: number;
}

export default function TiGuyMessaging() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState<"chat" | "video" | "moderation" | "trends">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pulseBeaver, setPulseBeaver] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Pulse beaver coin every 8s to attract attention
    const interval = setInterval(() => setPulseBeaver(true), 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pulseBeaver) setTimeout(() => setPulseBeaver(false), 1000);
  }, [pulseBeaver]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      spawnParticles();
      setTimeout(() => {
        const greeting = TIGUY_PHRASES.greeting[Math.floor(Math.random() * TIGUY_PHRASES.greeting.length)];
        addTiGuyMessage(greeting, "chat");
      }, 600);
    }
  }, [isOpen]);

  const spawnParticles = () => {
    const p = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      size: 6 + Math.random() * 8,
    }));
    setParticles(p);
    setTimeout(() => setParticles([]), 2000);
  };

  const addTiGuyMessage = (text: string, skill: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "ti-guy",
        text,
        skill,
        timestamp: new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() && activeSkill === "chat") return;

    const userText = activeSkill === "chat"
      ? input
      : `[${TIGUY_PHRASES.skills[activeSkill].label}] ${input || "Analyser maintenant"}`;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "user",
        text: userText,
        timestamp: new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInput("");
    setIsTyping(true);

    try {
      // Import apiCall via direct usage since we are in a component
      const { apiCall } = await import("../../services/api");

      interface TiGuyResponse {
        response: string;
        type?: string;
        data?: any;
      }

      const { data, error } = await apiCall<TiGuyResponse>("/tiguy/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userText,
          skill: activeSkill
        })
      });

      if (data?.response) {
        addTiGuyMessage(data.response, activeSkill);
      } else {
        console.warn("Ti-Guy API Error:", error);
        addTiGuyMessage("Oups, j'ai pas eu de réponse! 🦫", activeSkill);
      }

    } catch (err) {
      console.error("Ti-Guy Error:", err);
      addTiGuyMessage("Oups, j'ai eu un petit bug! Réessaie svp! 🦫", activeSkill);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSkillAction = (skill: string) => {
    setActiveSkill(skill as any);
    if (skill !== "chat") {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "system",
          text: `Mode activé: ${TIGUY_PHRASES.skills[skill as keyof typeof TIGUY_PHRASES.skills].label}`,
          skill,
          timestamp: new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const skillColor = TIGUY_PHRASES.skills[activeSkill]?.color || "#f59e0b";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Fira+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        /* Helper to ensure visibility */
        .tiguy-root {
          font-family: 'Fira Sans', sans-serif;
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
        }

        /* ── BEAVER COIN ── */
        .beaver-coin {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fde68a, #d97706 55%, #92400e);
          border: 3px solid #fbbf24;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 0 0 rgba(251,191,36,0.4), 0 8px 32px rgba(0,0,0,0.5);
          user-select: none;
        }
        .beaver-coin:hover {
          transform: scale(1.08);
          box-shadow: 0 0 0 6px rgba(251,191,36,0.15), 0 12px 40px rgba(0,0,0,0.6);
        }
        .beaver-coin.pulse {
          animation: coinPulse 0.9s ease-out;
        }
        @keyframes coinPulse {
          0%   { box-shadow: 0 0 0 0 rgba(251,191,36,0.7), 0 8px 32px rgba(0,0,0,0.5); transform: scale(1); }
          40%  { box-shadow: 0 0 0 18px rgba(251,191,36,0), 0 8px 32px rgba(0,0,0,0.5); transform: scale(1.1); }
          100% { box-shadow: 0 0 0 0 rgba(251,191,36,0), 0 8px 32px rgba(0,0,0,0.5); transform: scale(1); }
        }
        .beaver-coin .coin-label {
          position: absolute;
          bottom: -22px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 600;
          color: #fbbf24;
          letter-spacing: 0.05em;
          white-space: nowrap;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        }
        .notif-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid #1a0f00;
          animation: notifPop 2s ease-in-out infinite;
        }
        @keyframes notifPop {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.25); }
        }

        /* ── PARTICLES ── */
        .particle {
          position: fixed;
          bottom: 60px;
          right: 60px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #fbbf24;
          pointer-events: none;
          animation: particleFly 1.4s ease-out forwards;
        }
        @keyframes particleFly {
          0%   { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0); }
        }

        /* ── PANEL ── */
        .tiguy-panel {
          position: fixed;
          bottom: 110px;
          right: 28px;
          width: 350px;
          height: 620px;
          max-width: calc(100vw - 40px);
          max-height: calc(100vh - 140px);
          background: linear-gradient(160deg, #0d0802 0%, #1a0f00 40%, #0d0802 100%);
          border: 1px solid rgba(251,191,36,0.25);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(251,191,36,0.08), inset 0 1px 0 rgba(251,191,36,0.15);
          animation: panelIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-origin: bottom right;
        }
        @keyframes panelIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── HEADER ── */
        .panel-header {
          padding: 18px 20px 14px;
          background: linear-gradient(135deg, rgba(146,64,14,0.5) 0%, rgba(120,53,15,0.3) 100%);
          border-bottom: 1px solid rgba(251,191,36,0.15);
          flex-shrink: 0;
        }
        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .header-identity {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tiguy-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fde68a, #d97706 55%, #92400e);
          border: 2px solid #fbbf24;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          position: relative;
        }
        .live-dot {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 10px;
          height: 10px;
          background: #10b981;
          border-radius: 50%;
          border: 2px solid #0d0802;
          animation: livePulse 2s ease-in-out infinite;
        }
        @keyframes livePulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
        .tiguy-name-block { line-height: 1.2; }
        .tiguy-name {
          font-family: 'Cinzel', serif;
          font-size: 16px;
          font-weight: 700;
          color: #fbbf24;
          letter-spacing: 0.05em;
        }
        .tiguy-subtitle {
          font-size: 10px;
          color: rgba(251,191,36,0.5);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 1px;
        }
        .close-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(251,191,36,0.1);
          border: 1px solid rgba(251,191,36,0.2);
          color: #fbbf24;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .close-btn:hover { background: rgba(251,191,36,0.2); }

        /* ── SKILL TABS ── */
        .skill-tabs {
          display: flex;
          gap: 6px;
        }
        .skill-tab {
          flex: 1;
          padding: 6px 4px;
          border-radius: 8px;
          border: 1px solid rgba(251,191,36,0.15);
          background: rgba(251,191,36,0.05);
          color: rgba(251,191,36,0.5);
          font-size: 10px;
          font-family: 'Fira Sans', sans-serif;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          transition: all 0.2s;
        }
        .skill-tab .tab-icon { font-size: 14px; }
        .skill-tab:hover {
          background: rgba(251,191,36,0.1);
          color: rgba(251,191,36,0.8);
          border-color: rgba(251,191,36,0.3);
        }
        .skill-tab.active {
          background: rgba(251,191,36,0.15);
          color: #fbbf24;
          border-color: rgba(251,191,36,0.5);
        }

        /* ── MESSAGES ── */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 16px 16px 8px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(251,191,36,0.2) transparent;
        }
        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(251,191,36,0.2); border-radius: 2px; }

        .msg-row { display: flex; align-items: flex-end; gap: 8px; }
        .msg-row.user { flex-direction: row-reverse; }

        .msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fde68a, #d97706);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          border: 1px solid rgba(251,191,36,0.4);
        }
        .msg-user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
          border: 1px solid rgba(139,92,246,0.4);
          color: white;
        }

        .msg-bubble {
          max-width: 76%;
          padding: 10px 13px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-line;
        }
        .msg-bubble.ti-guy {
          background: linear-gradient(135deg, rgba(146,64,14,0.35), rgba(120,53,15,0.25));
          border: 1px solid rgba(251,191,36,0.2);
          color: #fef3c7;
          border-bottom-left-radius: 4px;
        }
        .msg-bubble.user {
          background: linear-gradient(135deg, rgba(109,40,217,0.4), rgba(79,70,229,0.3));
          border: 1px solid rgba(139,92,246,0.3);
          color: #ede9fe;
          border-bottom-right-radius: 4px;
        }
        .msg-bubble.system {
          background: rgba(251,191,36,0.08);
          border: 1px dashed rgba(251,191,36,0.25);
          color: rgba(251,191,36,0.7);
          font-size: 11px;
          font-style: italic;
          text-align: center;
          border-radius: 8px;
          padding: 6px 12px;
          align-self: center;
          max-width: 100%;
        }
        .msg-time {
          font-size: 9px;
          color: rgba(251,191,36,0.3);
          margin-top: 3px;
          text-align: right;
        }
        .msg-time.ti-guy { text-align: left; }

        /* ── TYPING ── */
        .typing-row { display: flex; align-items: flex-end; gap: 8px; }
        .typing-bubble {
          background: linear-gradient(135deg, rgba(146,64,14,0.35), rgba(120,53,15,0.25));
          border: 1px solid rgba(251,191,36,0.2);
          border-radius: 16px;
          border-bottom-left-radius: 4px;
          padding: 12px 16px;
          display: flex;
          gap: 5px;
          align-items: center;
        }
        .typing-dot {
          width: 7px;
          height: 7px;
          background: #fbbf24;
          border-radius: 50%;
          animation: typingBounce 1.2s ease-in-out infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
          0%,60%,100% { transform: translateY(0); opacity: 0.4; }
          30%          { transform: translateY(-6px); opacity: 1; }
        }

        /* ── KIMICLAW BADGE ── */
        .kimiclaw-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: rgba(251,191,36,0.06);
          border-top: 1px solid rgba(251,191,36,0.1);
          font-size: 9px;
          color: rgba(251,191,36,0.35);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          justify-content: center;
          flex-shrink: 0;
        }
        .kimiclaw-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10b981;
          animation: livePulse 2s ease-in-out infinite;
        }

        /* ── INPUT ── */
        .input-area {
          padding: 12px 14px 14px;
          border-top: 1px solid rgba(251,191,36,0.1);
          background: rgba(0,0,0,0.3);
          flex-shrink: 0;
        }
        .input-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          background: rgba(251,191,36,0.06);
          border: 1px solid rgba(251,191,36,0.2);
          border-radius: 14px;
          padding: 8px 8px 8px 14px;
          transition: border-color 0.2s;
        }
        .input-wrapper:focus-within {
          border-color: rgba(251,191,36,0.45);
          background: rgba(251,191,36,0.09);
        }
        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fef3c7;
          font-family: 'Fira Sans', sans-serif;
          font-size: 13px;
          resize: none;
          max-height: 80px;
          min-height: 22px;
          line-height: 1.5;
          padding: 0;
        }
        .chat-input::placeholder { color: rgba(251,191,36,0.3); }
        .send-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #d97706, #92400e);
          color: #fef3c7;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .send-btn:hover { background: linear-gradient(135deg, #f59e0b, #b45309); transform: scale(1.05); }
        .send-btn:active { transform: scale(0.95); }

        .skill-hint {
          font-size: 10px;
          color: rgba(251,191,36,0.35);
          margin-top: 6px;
          text-align: center;
          font-style: italic;
        }

        /* ── SKILL INDICATOR BAR ── */
        .skill-bar {
          height: 2px;
          background: var(--skill-color, #f59e0b);
          opacity: 0.6;
          transition: background 0.3s;
          flex-shrink: 0;
        }
      `}</style>

      <div className="tiguy-root">
        {/* Particles on open */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              "--tx": `${(p.x - 50) * 2}px`,
              "--ty": `${-60 - p.x}px`,
              animationDelay: `${p.delay}s`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.id % 3 === 0 ? "#10b981" : p.id % 3 === 1 ? "#ef4444" : "#fbbf24",
            } as React.CSSProperties}
          />
        ))}

        {/* Beaver Coin Button */}
        {!isOpen && (
          <div style={{ position: "relative", paddingBottom: "28px" }}>
            <div
              className={`beaver-coin ${pulseBeaver ? "pulse" : ""}`}
              onClick={() => { setIsOpen(true); spawnParticles(); }}
              title="Parler avec Ti-Guy"
            >
              <span style={{ fontSize: 32 }}>🦫</span>
              <div className="notif-dot" />
            </div>
            <div className="coin-label">TI-GUY</div>
          </div>
        )}

        {/* Close button when open */}
        {isOpen && (
          <div
            className="beaver-coin"
            onClick={() => setIsOpen(false)}
            style={{ background: "radial-gradient(circle at 35% 35%, #fca5a5, #dc2626 55%, #7f1d1d)" }}
          >
            <span style={{ fontSize: 20, color: "white", fontWeight: 700 }}>✕</span>
          </div>
        )}

        {/* Main Panel */}
        {isOpen && (
          <div className="tiguy-panel">
            {/* Skill color bar */}
            <div className="skill-bar" style={{ "--skill-color": skillColor } as React.CSSProperties} />

            {/* Header */}
            <div className="panel-header">
              <div className="header-top">
                <div className="header-identity">
                  <div className="tiguy-avatar">
                    🦫
                    <div className="live-dot" />
                  </div>
                  <div className="tiguy-name-block">
                    <div className="tiguy-name">Ti-Guy</div>
                    <div className="tiguy-subtitle">Powered by KimiClaw • 24/7</div>
                  </div>
                </div>
                <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
              </div>

              {/* Skill tabs */}
              <div className="skill-tabs">
                {Object.entries(TIGUY_PHRASES.skills).map(([key, skill]) => (
                  <button
                    key={key}
                    className={`skill-tab ${activeSkill === key ? "active" : ""}`}
                    onClick={() => handleSkillAction(key)}
                    style={activeSkill === key ? { borderColor: skill.color + "80", color: skill.color } : {}}
                  >
                    <span className="tab-icon">{skill.icon}</span>
                    <span>{key === "chat" ? "Jaser" : key === "video" ? "Vidéo" : key === "moderation" ? "Modérer" : "Trends"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="messages-area">
              {messages.map((msg) =>
                msg.type === "system" ? (
                  <div key={msg.id} className="msg-bubble system">{msg.text}</div>
                ) : (
                  <div key={msg.id}>
                    <div className={`msg-row ${msg.type}`}>
                      {msg.type === "ti-guy" && (
                        <div className="msg-avatar">🦫</div>
                      )}
                      {msg.type === "user" && (
                        <div className="msg-user-avatar">👤</div>
                      )}
                      <div>
                        <div className={`msg-bubble ${msg.type}`}>{msg.text}</div>
                        <div className={`msg-time ${msg.type}`}>{msg.timestamp}</div>
                      </div>
                    </div>
                  </div>
                )
              )}
              {isTyping && (
                <div className="typing-row">
                  <div className="msg-avatar">🦫</div>
                  <div className="typing-bubble">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* KimiClaw badge */}
            <div className="kimiclaw-badge">
              <div className="kimiclaw-dot" />
              <span>KimiClaw • Kimi K2.5 • 40GB Cloud</span>
            </div>

            {/* Input */}
            <div className="input-area">
              <div className="input-wrapper">
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  placeholder={
                    activeSkill === "chat" ? "Jase avec Ti-Guy en joual..." :
                      activeSkill === "video" ? "URL ou description de ta vidéo..." :
                        activeSkill === "moderation" ? "Contenu à analyser..." :
                          "Cherche des tendances québécoises..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button className="send-btn" onClick={handleSend}>
                  {activeSkill === "chat" ? "➤" : TIGUY_PHRASES.skills[activeSkill].icon}
                </button>
              </div>
              <div className="skill-hint">
                {activeSkill === "chat" && "Ti-Guy parle le joual authentique québécois 🇨🇦"}
                {activeSkill === "video" && "Analyse MUX • Engagement • Tendances ⚡"}
                {activeSkill === "moderation" && "Powered by KimiClaw • Résultats instantanés 🛡️"}
                {activeSkill === "trends" && "Données en temps réel • Québec first 📈"}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
