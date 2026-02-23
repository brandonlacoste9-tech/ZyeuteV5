/**
 * ChatInput - Belt Buckle Design Input Area
 * Voice, files, emoji, encryption, ephemeral
 */

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { toast } from '@/components/Toast';

interface Props {
  onSend: (content: string, options?: {
    isEncrypted?: boolean;
    ephemeralDuration?: number;
    mediaUrl?: string;
  }) => void;
  isTyping: boolean;
  chatType: string;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '🔥', '👏', '🦫', '⚜️', '🍁', '🏒', '❄️'];

const EPHEMERAL_OPTIONS = [
  { value: 0, label: 'Off', icon: '🔓' },
  { value: 10, label: '10s', icon: '⏱️' },
  { value: 60, label: '1m', icon: '⏱️' },
  { value: 300, label: '5m', icon: '⏱️' },
  { value: 3600, label: '1h', icon: '⏱️' },
];

export const ChatInput: React.FC<Props> = ({ onSend, isTyping, chatType }) => {
  const { tap, impact } = useHaptics();
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [ephemeralDuration, setEphemeralDuration] = useState(0);
  const [showEphemeralMenu, setShowEphemeralMenu] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  // Handle send
  const handleSend = () => {
    if (!text.trim() || isTyping) return;
    
    onSend(text, {
      isEncrypted,
      ephemeralDuration,
    });
    
    setText('');
    setShowEmoji(false);
    tap();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice recording
  const startRecording = useCallback(() => {
    setIsRecording(true);
    impact();
    
    recordingInterval.current = setInterval(() => {
      setRecordingDuration(d => d + 1);
    }, 1000);
  }, [impact]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }
    
    // TODO: Actually record and send voice
    toast.info('Voice message feature coming soon!');
    setRecordingDuration(0);
  }, []);

  // Format recording time
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add emoji
  const addEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
    tap();
    inputRef.current?.focus();
  };

  // Toggle encryption
  const toggleEncryption = () => {
    setIsEncrypted(!isEncrypted);
    toast.info(isEncrypted ? '🔓 Mode normal' : '🔒 Mode sécurisé activé');
    tap();
  };

  return (
    <div className="chat-input-area">
      {/* Mode indicators */}
      <div className="mode-indicators">
        {isEncrypted && (
          <span className="mode-badge encrypted">🔒 Sécurisé</span>
        )}
        {ephemeralDuration > 0 && (
          <span className="mode-badge ephemeral">
            ⏱️ {EPHEMERAL_OPTIONS.find(o => o.value === ephemeralDuration)?.label}
          </span>
        )}
      </div>

      {/* Tools bar */}
      <div className="tools-bar">
        {/* Encryption toggle */}
        <button
          onClick={toggleEncryption}
          className={cn('tool-btn', isEncrypted && 'active')}
          title={isEncrypted ? 'Désactiver chiffrement' : 'Activer chiffrement'}
        >
          {isEncrypted ? '🔒' : '🔓'}
        </button>

        {/* Ephemeral selector */}
        <div className="relative">
          <button
            onClick={() => setShowEphemeralMenu(!showEphemeralMenu)}
            className={cn('tool-btn', ephemeralDuration > 0 && 'active')}
            title="Message éphémère"
          >
            ⏱️
          </button>
          
          {showEphemeralMenu && (
            <div className="ephemeral-menu">
              {EPHEMERAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setEphemeralDuration(opt.value);
                    setShowEphemeralMenu(false);
                    toast.info(opt.value === 0 ? 'Conservé' : `Auto-destruct: ${opt.label}`);
                  }}
                  className={cn('ephemeral-option', ephemeralDuration === opt.value && 'selected')}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Emoji picker */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className={cn('tool-btn', showEmoji && 'active')}
        >
          😀
        </button>

        {/* File attach */}
        <button
          onClick={() => toast.info('Fichiers bientôt!')}
          className="tool-btn"
        >
          📎
        </button>
      </div>

      {/* Emoji picker popup */}
      {showEmoji && (
        <div className="emoji-picker">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              className="emoji-btn"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main input - Belt Buckle Design */}
      <div className="input-main">
        {/* Voice record button */}
        <button
          className={cn('voice-btn', isRecording && 'recording')}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          onMouseLeave={isRecording ? stopRecording : undefined}
        >
          {isRecording ? (
            <span className="recording-time">{formatDuration(recordingDuration)}</span>
          ) : (
            '🎙️'
          )}
        </button>

        {/* Belt Buckle */}
        <div className="belt-buckle-input">
          <span>⚜️</span>
        </div>

        {/* Text input */}
        <div className="input-field-wrapper stitched">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={chatType === 'tiguy' ? "Écris à Ti-Guy..." : "Écris ton message..."}
            className="text-input"
            disabled={isRecording}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || isTyping || isRecording}
          className={cn('send-btn', text.trim() && !isTyping && 'active')}
        >
          ➤
        </button>
      </div>

      {/* Hint text */}
      <div className="input-hint">
        🎙️ Maintenir pour vocal • 🔒 Chiffrer • ⏱️ Éphémère
      </div>
    </div>
  );
};

export default ChatInput;
