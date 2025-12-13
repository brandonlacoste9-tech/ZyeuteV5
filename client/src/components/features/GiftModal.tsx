/**
 * GiftModal - Virtual gift sending system with Stripe payments
 * Quebec-themed animated gifts for supporting creators
 */

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../Button';
import { Avatar } from '../Avatar';
import { toast } from '../Toast';
import { cn } from '../../lib/utils';
import type { User } from '../../types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface GiftInfo {
  type: string;
  emoji: string;
  name: string;
  price: number;
  priceDisplay: string;
}

interface GiftModalProps {
  recipient: User;
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onGiftSent?: (giftType: string) => void;
}

const GIFT_CATALOG: GiftInfo[] = [
  { type: 'comete', emoji: '☄️', name: 'Comète', price: 50, priceDisplay: '$0.50' },
  { type: 'feuille_erable', emoji: '🍁', name: "Feuille d'érable", price: 50, priceDisplay: '$0.50' },
  { type: 'fleur_de_lys', emoji: '⚜️', name: 'Fleur de Lys', price: 75, priceDisplay: '$0.75' },
  { type: 'feu', emoji: '🔥', name: 'Feu', price: 100, priceDisplay: '$1.00' },
  { type: 'coeur_or', emoji: '💛', name: "Coeur d'or", price: 100, priceDisplay: '$1.00' },
];

const CheckoutForm: React.FC<{
  giftType: string;
  postId: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ giftType, postId, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Erreur de paiement');
      } else if (paymentIntent?.status === 'succeeded') {
        const confirmRes = await fetch('/api/gifts/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            giftType,
            postId,
          }),
        });

        if (confirmRes.ok) {
          onSuccess();
        } else {
          const data = await confirmRes.json();
          toast.error(data.error || 'Erreur de confirmation');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur inattendue');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          disabled={!stripe || isProcessing}
          isLoading={isProcessing}
        >
          Payer
        </Button>
      </div>
    </form>
  );
};

export const GiftModal: React.FC<GiftModalProps> = ({
  recipient,
  postId,
  isOpen,
  onClose,
  onGiftSent,
}) => {
  const [selectedGift, setSelectedGift] = useState<GiftInfo | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedGift(null);
      setClientSecret(null);
      setShowPayment(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectGift = async (gift: GiftInfo) => {
    setSelectedGift(gift);
  };

  const handleProceedToPayment = async () => {
    if (!selectedGift) return;
    
    setIsLoadingIntent(true);
    try {
      const res = await fetch('/api/gifts/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          giftType: selectedGift.type,
          postId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erreur de paiement');
        return;
      }

      setClientSecret(data.clientSecret);
      setShowPayment(true);
    } catch (err: any) {
      toast.error('Erreur de connexion');
    } finally {
      setIsLoadingIntent(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success(`${selectedGift?.emoji} Cadeau envoyé! Merci pour ton support! 🎁`);
    onGiftSent?.(selectedGift?.type || '');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md max-h-[85vh] bg-zinc-900 md:rounded-2xl overflow-hidden border border-gold-500/20">
        {/* Header */}
        <div className="p-4 border-b border-gold-500/20 bg-gradient-to-r from-gold-600 to-gold-500">
          <div className="flex items-center justify-between">
            <h2 className="text-black text-xl font-bold">Envoyer un cadeau 🎁</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/10 rounded-full transition-colors"
              data-testid="button-close-gift-modal"
            >
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
          
          {/* Recipient */}
          <div className="flex items-center gap-3 mt-3">
            <Avatar src={recipient.avatar_url} size="sm" isVerified={recipient.is_verified} />
            <div>
              <p className="text-black font-semibold text-sm">
                Pour {recipient.display_name || recipient.username}
              </p>
            </div>
          </div>
        </div>

        {!showPayment ? (
          <>
            {/* Gift grid */}
            <div className="p-4 overflow-y-auto max-h-[45vh]">
              <p className="text-gold-400 text-sm mb-4 text-center">Choisis un cadeau québécois!</p>
              <div className="grid grid-cols-2 gap-3">
                {GIFT_CATALOG.map((gift) => (
                  <button
                    key={gift.type}
                    onClick={() => handleSelectGift(gift)}
                    data-testid={`gift-option-${gift.type}`}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all hover:scale-105 text-center',
                      selectedGift?.type === gift.type
                        ? 'border-gold-400 bg-gold-400/20 shadow-[0_0_15px_rgba(255,191,0,0.3)]'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-gold-500/30'
                    )}
                  >
                    <div className="text-4xl mb-2 animate-bounce-slow">{gift.emoji}</div>
                    <p className="text-white text-sm font-semibold">{gift.name}</p>
                    <p className="text-gold-400 font-bold">{gift.priceDisplay}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-black/50">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleProceedToPayment}
                isLoading={isLoadingIntent}
                disabled={!selectedGift}
                data-testid="button-proceed-payment"
              >
                {selectedGift
                  ? `Envoyer ${selectedGift.emoji} (${selectedGift.priceDisplay})`
                  : 'Choisis un cadeau'}
              </Button>
              <p className="text-white/40 text-xs text-center mt-3">
                💰 100% des revenus vont à Zyeuté pour le moment
              </p>
            </div>
          </>
        ) : (
          /* Payment Form */
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4 p-3 bg-gold-500/10 rounded-xl border border-gold-500/20">
              <div className="text-3xl">{selectedGift?.emoji}</div>
              <div>
                <p className="text-white font-semibold">{selectedGift?.name}</p>
                <p className="text-gold-400 font-bold">{selectedGift?.priceDisplay} CAD</p>
              </div>
            </div>
            
            {clientSecret && (
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#FFBF00',
                      colorBackground: '#18181b',
                      colorText: '#ffffff',
                    },
                  },
                }}
              >
                <CheckoutForm
                  giftType={selectedGift?.type || ''}
                  postId={postId}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowPayment(false)}
                />
              </Elements>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftModal;
