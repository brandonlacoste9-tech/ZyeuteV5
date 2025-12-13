/**
 * ReportModal - User content reporting system
 * Quebec-aware categories and anonymous reporting
 */

import React, { useState } from 'react';
import { Button } from '../Button';
import { supabase } from '../../lib/supabase';
import { toast } from '../Toast';
import { cn } from '../../lib/utils';
import type { User } from '../../types';
import { logger } from '../../lib/logger';

const reportModalLogger = logger.withContext('ReportModal');


type ReportType =
  | 'bullying'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'sexual_content'
  | 'spam'
  | 'fraud'
  | 'misinformation'
  | 'illegal'
  | 'self_harm'
  | 'other';

interface ReportOption {
  id: ReportType;
  label: string;
  emoji: string;
  description: string;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: 'bullying',
    label: 'Intimidation ou harcèlement',
    emoji: '😠',
    description: 'Attaques personnelles, moqueries répétées',
  },
  {
    id: 'hate_speech',
    label: 'Discours haineux',
    emoji: '🚫',
    description: 'Racisme, sexisme, homophobie, transphobie',
  },
  {
    id: 'harassment',
    label: 'Harcèlement sexuel',
    emoji: '⚠️',
    description: 'Messages ou commentaires sexuels non sollicités',
  },
  {
    id: 'violence',
    label: 'Violence ou menaces',
    emoji: '⚔️',
    description: 'Menaces, incitation à la violence',
  },
  {
    id: 'sexual_content',
    label: 'Contenu sexuel inapproprié',
    emoji: '🔞',
    description: 'Nudité, contenu explicite non approprié',
  },
  {
    id: 'spam',
    label: 'Spam ou publicité',
    emoji: '📧',
    description: 'Publicité excessive, liens malveillants',
  },
  {
    id: 'fraud',
    label: 'Fraude ou arnaque',
    emoji: '💸',
    description: 'Tentative d\'escroquerie, fausses promesses',
  },
  {
    id: 'misinformation',
    label: 'Fausses informations',
    emoji: '❌',
    description: 'Désinformation dangereuse ou trompeuse',
  },
  {
    id: 'illegal',
    label: 'Activité illégale',
    emoji: '🚨',
    description: 'Drogues, armes, contenu illégal',
  },
  {
    id: 'self_harm',
    label: 'Automutilation ou suicide',
    emoji: '💔',
    description: 'Contenu encourageant l\'automutilation',
  },
  {
    id: 'other',
    label: 'Autre',
    emoji: '📝',
    description: 'Autre violation des directives',
  },
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'post' | 'comment' | 'user' | 'story' | 'message';
  contentId: string;
  reportedUser?: User;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  contentType,
  contentId,
  reportedUser,
}) => {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [details, setDetails] = useState('');
  const [blockUser, setBlockUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedType) {
      toast.warning('Sélectionne une raison pour le signalement');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Tu dois être connecté pour signaler');
        return;
      }

      // Create report
      const { error: reportError } = await supabase.from('content_reports').insert({
        reporter_id: user.id,
        reported_user_id: reportedUser?.id,
        content_type: contentType,
        content_id: contentId,
        report_type: selectedType,
        details: details.trim() || null,
        status: 'pending',
      });

      if (reportError) {
        if (reportError.message.includes('duplicate')) {
          toast.warning('Tu as déjà signalé ce contenu');
          onClose();
          return;
        }
        throw reportError;
      }

      // Block user if requested
      if (blockUser && reportedUser) {
        const { error: blockError } = await supabase.from('blocked_users').insert({
          blocker_id: user.id,
          blocked_id: reportedUser.id,
          reason: `Signalement: ${selectedType}`,
        });

        if (blockError && !blockError.message.includes('duplicate')) {
          reportModalLogger.error('Error blocking user:', blockError);
        }
      }

      // Create notification for admins
      await supabase.from('notifications').insert({
        user_id: reportedUser?.id,
        type: 'system',
        message: `Nouveau signalement en attente de révision`,
      });

      toast.success('Signalement envoyé! Notre équipe va le réviser. 🛡️');
      
      // Reset form
      setSelectedType(null);
      setDetails('');
      setBlockUser(false);
      onClose();
    } catch (error: any) {
      reportModalLogger.error('Error submitting report:', error);
      
      if (error.message?.includes('not found')) {
        toast.error('La table "content_reports" n\'existe pas. Exécute le script SQL!');
      } else {
        toast.error('Erreur lors du signalement');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-gray-900 md:rounded-2xl overflow-hidden card-edge">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-900/20 to-orange-900/20">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white text-2xl font-bold">Signaler ce contenu 🚨</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
          <p className="text-white/70 text-sm">
            Aide-nous à garder Zyeuté sécuritaire pour tous. Ton signalement est confidentiel.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <h3 className="text-white font-semibold mb-4">Pourquoi signales-tu ce contenu?</h3>

          {/* Report Type Selection */}
          <div className="space-y-2 mb-6">
            {REPORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedType(option.id)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                  selectedType === option.id
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                )}
              >
                <span className="text-3xl flex-shrink-0">{option.emoji}</span>
                <div className="flex-1">
                  <p className="text-white font-semibold">{option.label}</p>
                  <p className="text-white/60 text-sm">{option.description}</p>
                </div>
                {selectedType === option.id && (
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Additional Details */}
          {selectedType && (
            <div className="mb-6 animate-fade-in">
              <label className="block text-white font-semibold mb-2">
                Détails supplémentaires (optionnel)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Ajoute plus d'informations pour aider notre équipe..."
                rows={4}
                maxLength={500}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 resize-none focus:outline-none focus:border-red-400"
              />
              <p className="text-white/40 text-xs mt-1">{details.length}/500</p>
            </div>
          )}

          {/* Block User Option */}
          {reportedUser && selectedType && (
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blockUser}
                  onChange={(e) => setBlockUser(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 text-red-500 focus:ring-red-500"
                />
                <div>
                  <p className="text-white font-semibold">
                    Bloquer @{reportedUser.username}
                  </p>
                  <p className="text-white/60 text-sm">
                    Cette personne ne pourra plus te voir ni interagir avec toi
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Information Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <div className="flex-1">
                <p className="text-blue-400 font-semibold mb-1">Ce qui se passe ensuite:</p>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Notre équipe révise ton signalement sous 24-48h</li>
                  <li>• Le contenu est analysé par IA + modérateur humain</li>
                  <li>• Action appropriée si violation confirmée</li>
                  <li>• Ton identité reste confidentielle</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/50">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!selectedType}
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer le signalement'}
            </Button>
          </div>

          <p className="text-white/40 text-xs text-center mt-3">
            Les faux signalements peuvent entraîner des conséquences sur ton compte
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;

