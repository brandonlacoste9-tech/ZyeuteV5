/**
 * Ti-Guy Artiste - AI Image Generator Page
 */

import React, { useState } from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { TiGuy } from '../components/features/TiGuy';
import { generateImage, type ImageGenerationResult } from '../services/imageService';
import { toast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Artiste() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const data = await generateImage(prompt, style);
      if (data) setResult(data);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePost = async () => {
    if (!result) return;
    // Save to database and redirect to feed (mock flow)
    toast.success('Image publiée sur ton profil! 🚀');
    navigate('/profile/me');
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl">
            🎨
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Ti-Guy Artiste</h1>
            <p className="text-white/60">Crée des images uniques avec l&apos;IA</p>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Décris ton image... (ex: Un castor qui mange une poutine sur le Mont-Royal)"
            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-white/40 min-h-[120px] focus:outline-none focus:border-purple-500 transition-colors"
          />
          
          <div className="flex flex-wrap gap-3 mt-4">
            {['Cinematic', 'Québec', 'Cyberpunk', 'Anime', 'Realistic'].map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s.toLowerCase())}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  style === s.toLowerCase()
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <Button 
              onClick={handleGenerate} 
              isLoading={isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {isGenerating ? 'Création en cours...' : '✨ Générer l\'image'}
            </Button>
          </div>
        </div>

        {/* Result Section */}
        {result && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Ton Chef-d&apos;œuvre</h2>
            <div className="aspect-square rounded-xl overflow-hidden bg-black mb-4 border border-white/10">
              <img 
                src={result.url} 
                alt={result.prompt}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-white/60 text-sm mb-6 italic">&quot;{result.revised_prompt || result.prompt}&quot;</p>
            
            <div className="flex gap-3">
              <Button onClick={handlePost} className="flex-1">
                🚀 Publier
              </Button>
              <Button variant="outline" onClick={() => setResult(null)} className="flex-1">
                🗑️ Ignorer
              </Button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

