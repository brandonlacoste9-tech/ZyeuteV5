/**
 * 🎤 Voice Settings Page
 * Configure Ti-Guy voice mode preferences
 */

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { toast } from '../components/Toast';
import { logger } from '../lib/logger';

const voiceSettingsPageLogger = logger.withContext('VoiceSettingsPage');


interface VoiceSettings {
  enabled: boolean;
  autoPlay: boolean;
  voice: 'male' | 'female';
  speed: number;
  volume: number;
  language: 'fr-CA' | 'fr-FR' | 'en-CA';
  personality: 'normal' | 'savage' | 'poete' | 'coach';
}

export default function VoiceSettingsPage() {
  const [settings, setSettings] = useState<VoiceSettings>({
    enabled: true,
    autoPlay: false,
    voice: 'male',
    speed: 1.0,
    volume: 1.0,
    language: 'fr-CA',
    personality: 'normal',
  });

  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('voiceSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        voiceSettingsPageLogger.error('Error loading voice settings:', error);
      }
    }
  };

  const saveSettings = (newSettings: VoiceSettings) => {
    setSettings(newSettings);
    localStorage.setItem('voiceSettings', JSON.stringify(newSettings));
    toast.success('Paramètres sauvegardés! 🎤');
  };

  const handleToggle = (key: keyof VoiceSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleChange = (key: keyof VoiceSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const testVoice = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Ton navigateur ne supporte pas la synthèse vocale');
      return;
    }

    setIsTesting(true);

    const messages = {
      normal: 'Salut! Moi c\'est Ti-Guy, ton assistant québécois! Tiguidou?',
      savage: 'Yo! Ti-Guy ici. Prêt à faire du feu? Let\'s go tabarnak!',
      poete: 'Bonjour, je suis Ti-Guy, poète des réseaux sociaux québécois...',
      coach: 'Hey champion! Ti-Guy ici pour te motiver! Tu vas crusher ça!',
    };

    const utterance = new SpeechSynthesisUtterance(messages[settings.personality]);
    utterance.lang = settings.language;
    utterance.rate = settings.speed;
    utterance.volume = settings.volume;
    
    // Try to find a French voice
    const voices = speechSynthesis.getVoices();
    const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    utterance.onend = () => setIsTesting(false);
    utterance.onerror = () => {
      setIsTesting(false);
      toast.error('Erreur lors du test vocal');
    };

    speechSynthesis.speak(utterance);
  };

  const personalities = [
    { id: 'normal', name: 'Normal', icon: '😊', desc: 'Amical et utile' },
    { id: 'savage', name: 'Savage', icon: '😈', desc: 'Roasts tes posts' },
    { id: 'poete', name: 'Poète', icon: '🎭', desc: 'Captions artistiques' },
    { id: 'coach', name: 'Coach', icon: '💪', desc: 'Motivationnel' },
  ];

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header showBack={true} title="Paramètres Vocaux" />
      
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎤</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Ti-Guy Voice Mode
          </h1>
          <p className="text-white/60">
            Configure la voix de ton assistant québécois
          </p>
        </div>

        {/* Enable Voice */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold mb-1">Mode Vocal</h3>
              <p className="text-white/60 text-sm">
                Active la synthèse vocale
              </p>
            </div>
            <button
              onClick={() => handleToggle('enabled')}
              className={`w-14 h-8 rounded-full transition-colors ${
                settings.enabled ? 'bg-gold-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  settings.enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Auto-Play */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold mb-1">Lecture Automatique</h3>
              <p className="text-white/60 text-sm">
                Ti-Guy parle automatiquement
              </p>
            </div>
            <button
              onClick={() => handleToggle('autoPlay')}
              className={`w-14 h-8 rounded-full transition-colors ${
                settings.autoPlay ? 'bg-gold-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  settings.autoPlay ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Personality */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
          <h3 className="text-white font-bold mb-4">Personnalité de Ti-Guy</h3>
          <div className="grid grid-cols-2 gap-3">
            {personalities.map((p) => (
              <button
                key={p.id}
                onClick={() => handleChange('personality', p.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  settings.personality === p.id
                    ? 'border-gold-500 bg-gold-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-3xl mb-2">{p.icon}</div>
                <div className="text-white font-bold text-sm mb-1">{p.name}</div>
                <div className="text-white/60 text-xs">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
          <h3 className="text-white font-bold mb-4">Langue</h3>
          <select
            value={settings.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500"
          >
            <option value="fr-CA">Français Québécois</option>
            <option value="fr-FR">Français France</option>
            <option value="en-CA">English Canada</option>
          </select>
        </div>

        {/* Speed */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">Vitesse</h3>
            <span className="text-gold-500 font-bold">{settings.speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.speed}
            onChange={(e) => handleChange('speed', parseFloat(e.target.value))}
            className="w-full accent-gold-500"
          />
          <div className="flex justify-between text-xs text-white/40 mt-2">
            <span>Lent</span>
            <span>Normal</span>
            <span>Rapide</span>
          </div>
        </div>

        {/* Volume */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">Volume</h3>
            <span className="text-gold-500 font-bold">{Math.round(settings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={(e) => handleChange('volume', parseFloat(e.target.value))}
            className="w-full accent-gold-500"
          />
          <div className="flex justify-between text-xs text-white/40 mt-2">
            <span>🔇 Muet</span>
            <span>🔊 Max</span>
          </div>
        </div>

        {/* Test Button */}
        <Button
          onClick={testVoice}
          isLoading={isTesting}
          className="w-full bg-gradient-to-r from-gold-500 to-yellow-600 text-black font-bold"
          size="lg"
        >
          {isTesting ? 'Ti-Guy parle...' : '🎤 Tester la voix'}
        </Button>

        {/* Info */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-400 text-sm">
            💡 <strong>Astuce:</strong> Ti-Guy peut lire tes captions, commentaires, et notifications à voix haute!
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

