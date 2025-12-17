import React from 'react';
import { Button } from './button';
import { Compass, Users, Hash, MessageSquare } from 'lucide-react';

interface QuebecEmptyStateProps {
    type?: 'feed' | 'profile' | 'discover' | 'messages';
    title?: string;
    description?: string;
    actionText?: string;
    onAction?: () => void;
}

export const QuebecEmptyState: React.FC<QuebecEmptyStateProps> = ({
    type = 'feed',
    title,
    description,
    actionText,
    onAction
}) => {
    const configs = {
        feed: {
            icon: '🍁',
            defaultTitle: "Bienvenue sur ton fil québécois!",
            defaultDescription: "Suis des comptes ou explore des hashtags pour voir du contenu de ton Québec.",
            defaultAction: "Explorer les tendances",
            iconComponent: <Hash className="w-12 h-12 text-gold-400" />
        },
        profile: {
            icon: '👤',
            defaultTitle: "Crée ton profil québécois!",
            defaultDescription: "Ajoute une photo, écris ta bio en français et partage ta culture.",
            defaultAction: "Compléter mon profil",
            iconComponent: <Users className="w-12 h-12 text-gold-400" />
        },
        discover: {
            icon: '🔍',
            defaultTitle: "Découvre le Québec",
            defaultDescription: "Explore les régions, les hashtags tendance et les talents locaux.",
            defaultAction: "Voir les tendances",
            iconComponent: <Compass className="w-12 h-12 text-gold-400" />
        },
        messages: {
            icon: '💬',
            defaultTitle: "Commence une conversation!",
            defaultDescription: "Envoie ton premier message à un ami ou découvre des groupes québécois.",
            defaultAction: "Trouver des amis",
            iconComponent: <MessageSquare className="w-12 h-12 text-gold-400" />
        }
    };

    const config = configs[type];

    return (
        <div className="text-center py-12 px-6 rounded-2xl border border-gold-500/20 bg-gradient-to-b from-dark-800/80 to-gold-500/5 backdrop-blur-sm">
            <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-dark-900/50 border border-gold-500/20">
                    {config.iconComponent}
                </div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
                {title || config.defaultTitle}
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                {description || config.defaultDescription}
            </p>
            {(actionText || config.defaultAction) && onAction && (
                <Button
                    onClick={onAction}
                    className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 shadow-lg hover:shadow-gold-500/25"
                >
                    {actionText || config.defaultAction}
                </Button>
            )}
            <div className="mt-8 pt-6 border-t border-dark-700/50">
                <p className="text-sm text-gray-500">
                    <span className="text-gold-400">💡 Conseil:</span> Essayez les hashtags{' '}
                    <span className="text-blue-400">#Poutine</span>,{' '}
                    <span className="text-blue-400">#Québec</span>,{' '}
                    <span className="text-blue-400">#Montréal</span>
                </p>
            </div>
        </div>
    );
};
