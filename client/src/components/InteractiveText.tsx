import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface DictionaryEntry {
  word: string;
  definition: string;
  partOfSpeech: string;
  synonyms: string[];
  quebecVariant?: string;
  safetyFlag?: 'hateful' | 'sexual' | 'violent' | 'safe';
}

interface InteractiveTextProps {
  text: string;
  className?: string;
}

export const InteractiveText: React.FC<InteractiveTextProps> = ({ text, className }) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWordClick = async (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Clean word from punctuation
    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    if (!cleanWord || cleanWord.length < 2) return;

    setSelectedWord(cleanWord);
    setLoading(true);
    setError(null);
    setEntry(null);

    try {
      const response = await fetch(`/api/dictionary/lookup/${encodeURIComponent(cleanWord)}`);
      if (!response.ok) throw new Error('Mot non répertorié');
      const data = await response.json();
      setEntry(data);
    } catch (err) {
      setError("Désolé, Ti-Guy connaît pas encore ce mot-là! 🦫");
    } finally {
      setLoading(false);
    }
  };

  const words = text.split(/(\s+)/);

  return (
    <>
      <span className={className}>
        {words.map((part, i) => {
          const isWord = /\S/.test(part);
          if (isWord) {
            return (
              <span
                key={i}
                onClick={(e) => handleWordClick(part, e)}
                className="hover:text-gold-400 hover:underline cursor-help transition-colors"
                title="Cliquer pour la définition"
              >
                {part}
              </span>
            );
          }
          return part;
        })}
      </span>

      {selectedWord && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
             onClick={() => setSelectedWord(null)}>
          <div 
            className="bg-stone-900 border border-gold-500/30 text-stone-100 max-w-sm w-full rounded-3xl p-6 shadow-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">📖</span>
                {loading ? 'Recherche...' : selectedWord}
              </h3>
              <button 
                onClick={() => setSelectedWord(null)}
                className="text-stone-500 hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
                </div>
              )}

              {error && <p className="text-stone-400 italic text-center py-4">{error}</p>}

              {entry && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Définition</span>
                    <p className="text-sm leading-relaxed text-stone-200 mt-1">{entry.definition}</p>
                  </div>

                  <div className="flex gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Nature</span>
                      <p className="text-xs text-gold-400 font-mono mt-1">{entry.partOfSpeech}</p>
                    </div>
                    {entry.safetyFlag !== 'safe' && (
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Sécurité</span>
                        <p className="text-xs text-red-400 font-mono mt-1 uppercase tracking-tighter">{entry.safetyFlag} 🚨</p>
                      </div>
                    )}
                  </div>

                  {entry.quebecVariant && (
                    <div className="bg-gold-500/5 border border-gold-500/20 rounded-xl p-3">
                      <span className="text-[10px] uppercase tracking-widest text-gold-500 font-bold">Variant Québécois 🦫</span>
                      <p className="text-xs text-stone-300 mt-1 italic">{entry.quebecVariant}</p>
                    </div>
                  )}

                  {entry.synonyms.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Synonymes</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.synonyms.map((s, j) => (
                          <span key={j} className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-stone-400 border border-white/5">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[9px] text-stone-600 text-center uppercase tracking-[2px] mt-6">
                Dictionnaire Local Zyeuté • $0 permanent
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
