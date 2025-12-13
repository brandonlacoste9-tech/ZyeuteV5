/**
 * StoryCreator - Create and upload 24-hour stories
 */

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../Button';
import { supabase } from '../../lib/supabase';
import { toast } from '../Toast';
import { generateId } from '../../lib/utils';
import { logger } from '../../lib/logger';

const storyCreatorLogger = logger.withContext('StoryCreator');


export const StoryCreator: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      toast.error('Sélectionne une image ou vidéo!');
      return;
    }

    // Validate file size (max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('Fichier trop gros! (Max 50MB)');
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Upload story
  const handleUpload = async () => {
    if (!file) {
      toast.warning('Sélectionne un fichier d\'abord!');
      return;
    }

    setIsUploading(true);
    toast.info('Upload de ta story... 📤');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Tu dois être connecté!');
        navigate('/login');
        return;
      }

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${generateId()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('not found')) {
          throw new Error('Le bucket "stories" n\'existe pas. Crée-le dans Supabase Storage!');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath);

      // Calculate expiry (24 hours from now)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Create story record
      const { error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          type: file.type.startsWith('video/') ? 'video' : 'photo',
          duration: file.type.startsWith('video/') ? 15 : 5,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) throw insertError;

      toast.success('Story publiée! 🎉');
      setTimeout(() => navigate('/'), 1000);
    } catch (error: any) {
      storyCreatorLogger.error('Error uploading story:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card-edge p-6 mb-4">
          <h2 className="text-white text-2xl font-bold mb-6 text-center">
            Créer une Story ✨
          </h2>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Preview or Upload Button */}
          {preview ? (
            <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-900 mb-6 edge-glow">
              {file?.type.startsWith('video/') ? (
                <video
                  src={preview}
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Change button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-4 right-4 px-4 py-2 bg-black/80 rounded-xl text-white text-sm hover:bg-black transition-colors"
              >
                Changer
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[9/16] rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-4 hover:border-gold-400 hover:bg-white/5 transition-all mb-6"
            >
              <svg
                className="w-16 h-16 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <div className="text-center">
                <p className="text-white font-semibold mb-1">Ajoute une story</p>
                <p className="text-white/60 text-sm">Photo ou vidéo (24h)</p>
              </div>
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
              disabled={isUploading}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={!file}
            >
              {isUploading ? 'Upload...' : 'Publier Story 🔥'}
            </Button>
          </div>

          {/* Info */}
          <p className="text-white/60 text-xs text-center mt-4">
            Ta story sera visible pendant 24 heures ⏰
          </p>
        </div>
      </div>
    </div>
  );
};

export default StoryCreator;

