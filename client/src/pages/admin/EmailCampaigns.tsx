import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { BottomNav } from '../../components/BottomNav';
import { Button } from '../../components/Button';
import { generateMarketingEmail, sendMarketingEmail } from '../../services/emailService'; // Assuming these are exported
import { toast } from '../../components/Toast';

export const EmailCampaigns: React.FC = () => {
  const [campaign, setCampaign] = useState({
    subject: '',
    body: '',
    audience: 'all'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Mock generation for now if service not fully linked in UI
    // In real impl: const generated = await generateMarketingEmail(...)
    setTimeout(() => {
      setCampaign(prev => ({
        ...prev,
        subject: "🔥 Nouveautés sur Zyeuté! (Généré par IA)",
        body: "<h1>Salut la gang!</h1><p>Plein de nouvelles affaires sur la plateforme...</p>"
      }));
      setIsGenerating(false);
    }, 1500);
  };

  const handleSend = async () => {
    setIsSending(true);
    // Mock send
    setTimeout(() => {
      toast.success("Campagne envoyée à 150 utilisateurs!");
      setIsSending(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title="📧 Campagnes Email" showBack={true} />
      
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="card-edge p-6 mb-6">
          <h2 className="text-white text-xl font-bold mb-4">Nouvelle Campagne</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">Audience</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                value={campaign.audience}
                onChange={e => setCampaign({...campaign, audience: e.target.value})}
              >
                <option value="all">Tous les utilisateurs</option>
                <option value="creators">Créateurs seulement</option>
                <option value="subscribers">Abonnés seulement</option>
                <option value="inactive">Utilisateurs inactifs (30j+)</option>
              </select>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Sujet</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                  placeholder="Sujet de l'email..."
                  value={campaign.subject}
                  onChange={e => setCampaign({...campaign, subject: e.target.value})}
                />
                <Button 
                  variant="outline" 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? '✨ IA...' : '✨ Générer'}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Contenu (HTML)</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white h-64 font-mono text-sm"
                placeholder="<h1>Contenu HTML...</h1>"
                value={campaign.body}
                onChange={e => setCampaign({...campaign, body: e.target.value})}
              />
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
              <Button variant="ghost">Prévisualiser</Button>
              <Button 
                variant="primary" 
                className="bg-gradient-to-r from-gold-600 to-yellow-600"
                onClick={handleSend}
                disabled={isSending || !campaign.subject}
              >
                {isSending ? 'Envoi...' : 'Envoyer la campagne'}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-white font-bold">Campagnes Récentes</h3>
          <div className="card-edge p-4 flex justify-between items-center opacity-60">
            <div>
              <p className="text-white font-semibold">Bienvenue V1</p>
              <p className="text-white/40 text-xs">Envoyé le 25 Nov • 1,203 destinataires</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 text-sm">45% Open</p>
              <p className="text-white/40 text-xs">12% Click</p>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default EmailCampaigns;

