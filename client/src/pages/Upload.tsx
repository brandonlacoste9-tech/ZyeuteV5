/**
 * Upload Page - Premium Quebec Heritage Design
 * Luxury content creation with Ti-Guy AI and gold accents
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { getCurrentUser, createPost } from '../services/api';
import { supabase } from '../lib/supabase';
import { extractHashtags, generateId } from '../lib/utils';
import { QUEBEC_REGIONS } from '../lib/quebecFeatures';
import { toast } from '../components/Toast';
import { logger } from '../lib/logger';

const uploadLogger = logger.withContext('Upload');


export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [city, setCity] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Upload post
  const handleUpload = async () => {
    if (!file) {
      toast.warning('Ajoute une image ou vidéo!');
      return;
    }

    if (!caption.trim()) {
      toast.warning('Ajoute une légende!');
      return;
    }

    setIsUploading(true);
    toast.info('Upload en cours... 📤');

    try {
      // Get current user using session-based auth
      const user = await getCurrentUser();
      if (!user) {
        toast.error('Tu dois être connecté!');
        navigate('/login');
        return;
      }

      // Upload file to Supabase Storage (still using Supabase for file storage)
      const fileExt = file.name.split('.').pop();
      const fileName = `${generateId()}.${fileExt}`;
      const filePath = `posts/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Extract hashtags
      const hashtags = extractHashtags(caption);

      // Create post using API
      const mediaType = file.type.startsWith('video') ? 'video' : 'photo';
      const post = await createPost({
        type: mediaType,
        mediaUrl: publicUrl,
        caption: caption.trim(),
        hashtags,
        region: region || undefined,
      });

      if (!post) throw new Error('Failed to create post');

      toast.success('Post publié! 🔥');
      navigate('/');
    } catch (error) {
      uploadLogger.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Créer un post" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Upload Area */}
        <div className="leather-card rounded-2xl p-6 mb-4 stitched">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {!preview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square border-2 border-dashed border-gold-500/50 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-gold-500 hover:bg-gold-500/5 transition-all group"
            >
              <div className="w-20 h-20 rounded-full bg-gold-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-gold-400 font-bold text-lg mb-1 embossed">
                  Ajoute une photo ou vidéo
                </p>
                <p className="text-leather-300 text-sm">
                  Clique pour sélectionner un fichier
                </p>
              </div>
            </button>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative aspect-square rounded-2xl overflow-hidden stitched-subtle">
                {file?.type.startsWith('video') ? (
                  <video
                    src={preview}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Gold corner accents */}
                <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-gold-500" />
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-gold-500" />
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-gold-500" />
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-gold-500" />
              </div>

              {/* Change File Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full btn-leather py-3 rounded-xl font-semibold"
              >
                Changer le fichier
              </button>
            </div>
          )}
        </div>

        {/* Caption & Details */}
        {preview && (
          <div className="leather-card rounded-2xl p-6 mb-4 space-y-4 stitched">
            <div>
              <label className="block text-gold-400 font-semibold mb-2 text-sm embossed">
                Légende
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Écris une légende... #Quebec"
                rows={4}
                className="input-premium resize-none"
              />
              <p className="text-leather-400 text-xs mt-2">
                {caption.length}/2200 caractères
              </p>
            </div>

            {/* Ti-Guy AI Suggestions */}
            <div className="bg-leather-900/50 rounded-xl p-4 border border-gold-500/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center">
                  <span className="text-lg">🦫</span>
                </div>
                <div>
                  <h3 className="text-gold-400 font-bold text-sm embossed">Ti-Guy AI</h3>
                  <p className="text-leather-300 text-xs">Ton assistant québécois</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    toast.info('Ti-Guy génère une caption... 🦫');
                    // Generate a caption based on context
                    const suggestions = [
                      'Une belle journée au Québec! ⚜️🇨🇦',
                      'Tiguidou! C\'est malade en esti! 🔥',
                      'Fier d\'être Québécois! 🍁',
                      'Y fait beau au Québec aujourd\'hui! ☀️'
                    ];
                    const randomCaption = suggestions[Math.floor(Math.random() * suggestions.length)];
                    setCaption(prevCaption => prevCaption ? `${prevCaption} ${randomCaption}` : randomCaption);
                    toast.success('Caption générée par Ti-Guy! ✨');
                  }}
                  className="btn-leather py-2 rounded-lg text-sm font-medium hover:bg-gold-500/10 transition-colors"
                >
                  ✨ Générer caption
                </button>
                <button 
                  onClick={() => {
                    toast.info('Ti-Guy ajoute des hashtags... 🦫');
                    const hashtags = ['#Quebec', '#QC', '#Montreal', '#MTL', '#Zyeute', '#TiGuy'];
                    const selectedHashtags = hashtags.slice(0, 3 + Math.floor(Math.random() * 3)).join(' ');
                    setCaption(prevCaption => prevCaption ? `${prevCaption} ${selectedHashtags}` : selectedHashtags);
                    toast.success('Hashtags ajoutés par Ti-Guy! 🏷️');
                  }}
                  className="btn-leather py-2 rounded-lg text-sm font-medium hover:bg-gold-500/10 transition-colors"
                >
                  🏷️ Ajouter hashtags
                </button>
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gold-400 font-semibold mb-2 text-sm embossed">
                  Région
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="input-premium"
                >
                  <option value="">Sélectionne</option>
                  {QUEBEC_REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.emoji} {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gold-400 font-semibold mb-2 text-sm embossed">
                  Ville
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Montréal"
                  className="input-premium"
                />
              </div>
            </div>

            {/* Publish Button */}
            <button
              onClick={handleUpload}
              disabled={isUploading || !file || !caption.trim()}
              className="w-full btn-gold py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed glow-gold"
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Publication...</span>
                </div>
              ) : (
                '🔥 Publier'
              )}
            </button>
          </div>
        )}

        {/* Tips Card */}
        <div className="leather-card rounded-2xl p-6 stitched">
          <h3 className="text-gold-400 font-bold mb-3 embossed">
            💡 Conseils pour un post viral
          </h3>
          <ul className="space-y-2 text-leather-200 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-gold-500 mt-0.5">⚜️</span>
              <span>Utilise des hashtags québécois (#Quebec, #MTL, #QC)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-500 mt-0.5">📍</span>
              <span>Tag ta région pour plus de visibilité locale</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-500 mt-0.5">🔥</span>
              <span>Poste entre 18h-21h pour plus d&apos;engagement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-500 mt-0.5">🎬</span>
              <span>Les vidéos courtes (15-60s) performent mieux</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Upload;
